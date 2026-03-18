import { and, desc, eq, or } from "drizzle-orm";
import { db } from "~/db";
import {
  friendRequestsTable,
  privateAccessRequestsTable,
  privateProfileAccessTable,
  subscriptionsTable,
  type User,
  type UserPrivacySettings,
  usersTable,
} from "~/db/schema";

export const DEFAULT_PRIVACY_SETTINGS: UserPrivacySettings = {
  profileAccess: "everyone",
  discoverInPeople: "everyone",
  discoverInSearch: "everyone",
  meetingInvites: "friends",
  friendRequests: "everyone",
  showActivity: "friends",
  showOnlineStatus: "friends",
  showCity: "everyone",
  showAge: "everyone",
};

const PRIVACY_AUDIENCE_SET = new Set(["everyone", "friends", "nobody"]);
const PRIVACY_PROFILE_ACCESS_SET = new Set(["everyone", "friends", "request"]);

export type PrivacyViewerContext = {
  approvedOwnerIds: Set<number>;
  blockedIds: Set<number>;
  friendIds: Set<number>;
  viewerId: number;
};

export type ProfileAccessState = {
  canRequestAccess: boolean;
  canViewActivity: boolean;
  hasAccess: boolean;
  isBlocked: boolean;
  isPending: boolean;
  isSelf: boolean;
  settings: UserPrivacySettings;
};

type PrivacySurface = "people" | "search";

const normalizeAudience = (
  value: string | null | undefined,
  fallback: UserPrivacySettings[keyof UserPrivacySettings],
) => {
  if (typeof value !== "string" || !PRIVACY_AUDIENCE_SET.has(value)) {
    return fallback;
  }

  return value as UserPrivacySettings[keyof UserPrivacySettings];
};

export const normalizePrivacySettings = (
  rawSettings: User["privacySettings"] | null | undefined,
  isPrivate?: boolean | null,
): UserPrivacySettings => {
  const settings = rawSettings || undefined;

  return {
    profileAccess:
      typeof settings?.profileAccess === "string" &&
      PRIVACY_PROFILE_ACCESS_SET.has(settings.profileAccess)
        ? settings.profileAccess
        : isPrivate
          ? "request"
          : DEFAULT_PRIVACY_SETTINGS.profileAccess,
    discoverInPeople: normalizeAudience(
      settings?.discoverInPeople,
      DEFAULT_PRIVACY_SETTINGS.discoverInPeople,
    ) as UserPrivacySettings["discoverInPeople"],
    discoverInSearch: normalizeAudience(
      settings?.discoverInSearch,
      DEFAULT_PRIVACY_SETTINGS.discoverInSearch,
    ) as UserPrivacySettings["discoverInSearch"],
    meetingInvites: normalizeAudience(
      settings?.meetingInvites,
      DEFAULT_PRIVACY_SETTINGS.meetingInvites,
    ) as UserPrivacySettings["meetingInvites"],
    friendRequests:
      settings?.friendRequests === "nobody"
        ? "nobody"
        : DEFAULT_PRIVACY_SETTINGS.friendRequests,
    showActivity: normalizeAudience(
      settings?.showActivity,
      DEFAULT_PRIVACY_SETTINGS.showActivity,
    ) as UserPrivacySettings["showActivity"],
    showOnlineStatus: normalizeAudience(
      settings?.showOnlineStatus,
      DEFAULT_PRIVACY_SETTINGS.showOnlineStatus,
    ) as UserPrivacySettings["showOnlineStatus"],
    showCity: normalizeAudience(
      settings?.showCity,
      DEFAULT_PRIVACY_SETTINGS.showCity,
    ) as UserPrivacySettings["showCity"],
    showAge: normalizeAudience(
      settings?.showAge,
      DEFAULT_PRIVACY_SETTINGS.showAge,
    ) as UserPrivacySettings["showAge"],
  };
};

export const buildPrivacyViewerContext = async (
  viewerId: number,
): Promise<PrivacyViewerContext> => {
  const viewer = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, viewerId),
    columns: { notInterestedIds: true },
  });

  const [friendships, grantedAccess] = await Promise.all([
    db.query.friendRequestsTable.findMany({
      where: and(
        eq(friendRequestsTable.status, "accepted"),
        or(
          eq(friendRequestsTable.fromUserId, viewerId),
          eq(friendRequestsTable.toUserId, viewerId),
        ),
      ),
      columns: {
        fromUserId: true,
        toUserId: true,
      },
    }),
    db.query.privateProfileAccessTable.findMany({
      where: eq(privateProfileAccessTable.allowedUserId, viewerId),
      columns: { ownerId: true },
    }),
  ]);

  const friendIds = new Set<number>();
  friendships.forEach((friendship) => {
    if (friendship.fromUserId && friendship.fromUserId !== viewerId) {
      friendIds.add(friendship.fromUserId);
    }
    if (friendship.toUserId && friendship.toUserId !== viewerId) {
      friendIds.add(friendship.toUserId);
    }
  });

  return {
    viewerId,
    friendIds,
    approvedOwnerIds: new Set(
      grantedAccess.map((access) => access.ownerId).filter((id): id is number => Number.isFinite(id)),
    ),
    blockedIds: new Set((viewer?.notInterestedIds || []).filter((id) => Number.isFinite(id))),
  };
};

const audienceAllows = (
  audience: "everyone" | "friends" | "nobody",
  isFriend: boolean,
  isSelf: boolean,
) => {
  if (isSelf) return true;
  if (audience === "everyone") return true;
  if (audience === "friends") return isFriend;
  return false;
};

export const isBlockedBetween = (
  viewerContext: PrivacyViewerContext,
  targetUser: Pick<User, "id" | "notInterestedIds">,
) => {
  if (!targetUser.id) return false;
  const targetBlockedIds = new Set(
    (targetUser.notInterestedIds || []).filter((id) => Number.isFinite(id)),
  );

  return (
    viewerContext.blockedIds.has(targetUser.id) || targetBlockedIds.has(viewerContext.viewerId)
  );
};

export const getProfileAccessState = async (
  viewerContext: PrivacyViewerContext,
  targetUser: User,
): Promise<ProfileAccessState> => {
  const settings = normalizePrivacySettings(targetUser.privacySettings, targetUser.isPrivate);
  const isSelf = viewerContext.viewerId === targetUser.id;
  const isFriend = targetUser.id ? viewerContext.friendIds.has(targetUser.id) : false;
  const hasGrantedAccess = targetUser.id
    ? viewerContext.approvedOwnerIds.has(targetUser.id)
    : false;
  const isBlocked = isBlockedBetween(viewerContext, targetUser);

  let hasAccess = isSelf;
  if (!isSelf && !isBlocked) {
    if (settings.profileAccess === "everyone") {
      hasAccess = true;
    } else if (settings.profileAccess === "friends") {
      hasAccess = isFriend;
    } else {
      hasAccess = isFriend || hasGrantedAccess;
    }
  }

  const canRequestAccess =
    !isSelf &&
    !isBlocked &&
    settings.profileAccess === "request" &&
    !hasAccess &&
    !isFriend &&
    !hasGrantedAccess;

  let isPending = false;
  if (canRequestAccess) {
    const pending = await db.query.privateAccessRequestsTable.findFirst({
      where: and(
        eq(privateAccessRequestsTable.ownerId, targetUser.id),
        eq(privateAccessRequestsTable.requesterId, viewerContext.viewerId),
      ),
      columns: { id: true },
    });
    isPending = Boolean(pending?.id);
  }

  return {
    hasAccess,
    isPending,
    canRequestAccess,
    isBlocked,
    isSelf,
    canViewActivity: isSelf || (hasAccess && settings.showActivity !== "nobody"),
    settings,
  };
};

export const canDiscoverUser = async (
  viewerContext: PrivacyViewerContext,
  targetUser: User,
  surface: PrivacySurface,
) => {
  const settings = normalizePrivacySettings(targetUser.privacySettings, targetUser.isPrivate);
  const isSelf = viewerContext.viewerId === targetUser.id;
  const isFriend = targetUser.id ? viewerContext.friendIds.has(targetUser.id) : false;

  if (!targetUser.id || isBlockedBetween(viewerContext, targetUser)) {
    return false;
  }

  const audience =
    surface === "people" ? settings.discoverInPeople : settings.discoverInSearch;

  return audienceAllows(audience, isFriend, isSelf);
};

export const canSendMeetingInvite = async (
  viewerContext: PrivacyViewerContext,
  targetUser: User,
) => {
  const settings = normalizePrivacySettings(targetUser.privacySettings, targetUser.isPrivate);
  const isSelf = viewerContext.viewerId === targetUser.id;
  const isFriend = targetUser.id ? viewerContext.friendIds.has(targetUser.id) : false;

  if (!targetUser.id || isBlockedBetween(viewerContext, targetUser)) {
    return false;
  }

  return audienceAllows(settings.meetingInvites, isFriend, isSelf);
};

export const canSendFriendRequest = async (
  viewerContext: PrivacyViewerContext,
  targetUser: User,
) => {
  const settings = normalizePrivacySettings(targetUser.privacySettings, targetUser.isPrivate);
  const isSelf = viewerContext.viewerId === targetUser.id;

  if (!targetUser.id || isSelf || isBlockedBetween(viewerContext, targetUser)) {
    return false;
  }

  return settings.friendRequests === "everyone";
};

export const toPrivacyAwareUserPreview = async (
  viewerContext: PrivacyViewerContext,
  targetUser: User,
) => {
  const access = await getProfileAccessState(viewerContext, targetUser);
  const isFriend = targetUser.id ? viewerContext.friendIds.has(targetUser.id) : false;
  const canSeeAge = access.hasAccess || audienceAllows(access.settings.showAge, isFriend, access.isSelf);
  const canSeeCity =
    access.hasAccess || audienceAllows(access.settings.showCity, isFriend, access.isSelf);
  const canSeeOnline =
    access.hasAccess ||
    audienceAllows(access.settings.showOnlineStatus, isFriend, access.isSelf);

  return {
    ...targetUser,
    bio: access.hasAccess ? targetUser.bio : null,
    birthday: canSeeAge ? targetUser.birthday : null,
    city: canSeeCity ? targetUser.city : null,
    coordinates: access.hasAccess ? targetUser.coordinates : null,
    email: null,
    gallery: access.hasAccess ? targetUser.gallery : [],
    interests: access.hasAccess ? targetUser.interests : undefined,
    inventory: access.hasAccess ? targetUser.inventory : [],
    lastLocationUpdate: canSeeOnline ? targetUser.lastLocationUpdate : null,
    privacySettings: access.settings,
    isPrivate: access.settings.profileAccess !== "everyone",
  };
};

export const clearPrivateAccessState = async (ownerId: number) => {
  const privateUsers = await db.query.privateProfileAccessTable.findMany({
    where: eq(privateProfileAccessTable.ownerId, ownerId),
    columns: { allowedUserId: true },
  });

  const privateUserIds = privateUsers
    .map((record) => record.allowedUserId)
    .filter((id): id is number => Number.isFinite(id));

  await db
    .delete(privateProfileAccessTable)
    .where(eq(privateProfileAccessTable.ownerId, ownerId));

  await db
    .delete(privateAccessRequestsTable)
    .where(eq(privateAccessRequestsTable.ownerId, ownerId));

  if (privateUserIds.length > 0) {
    await db
      .delete(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.targetUserId, ownerId),
          or(...privateUserIds.map((id) => eq(subscriptionsTable.subscriberId, id))),
        ),
      );
  }
};

export const getPendingPrivateRequests = async (ownerId: number) => {
  return db.query.privateAccessRequestsTable.findMany({
    where: eq(privateAccessRequestsTable.ownerId, ownerId),
    orderBy: [desc(privateAccessRequestsTable.createdAt), desc(privateAccessRequestsTable.id)],
  });
};

export const getGrantedPrivateAccess = async (ownerId: number) => {
  return db.query.privateProfileAccessTable.findMany({
    where: eq(privateProfileAccessTable.ownerId, ownerId),
    orderBy: [desc(privateProfileAccessTable.createdAt), desc(privateProfileAccessTable.id)],
  });
};
