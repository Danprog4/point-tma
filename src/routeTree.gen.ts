/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as UserQuestsImport } from './routes/user-quests'
import { Route as SkillsImport } from './routes/skills'
import { Route as QuestsImport } from './routes/quests'
import { Route as ProfileSettImport } from './routes/profile-sett'
import { Route as ProfileImport } from './routes/profile'
import { Route as PointsImport } from './routes/points'
import { Route as OnboardingImport } from './routes/onboarding'
import { Route as NotifImport } from './routes/notif'
import { Route as MeetingsImport } from './routes/meetings'
import { Route as InventoryImport } from './routes/inventory'
import { Route as HistoryImport } from './routes/history'
import { Route as FillProfileImport } from './routes/fill-profile'
import { Route as CalendarImport } from './routes/calendar'
import { Route as AchievmentsImport } from './routes/achievments'
import { Route as IndexImport } from './routes/index'
import { Route as QuestIdImport } from './routes/quest.$id'
import { Route as ProfileIdImport } from './routes/profile.$id'
import { Route as MeetIdImport } from './routes/meet.$id'
import { Route as CreateMeetNameImport } from './routes/createMeet.$name'
import { Route as AllNameImport } from './routes/all.$name'

// Create/Update Routes

const UserQuestsRoute = UserQuestsImport.update({
  id: '/user-quests',
  path: '/user-quests',
  getParentRoute: () => rootRoute,
} as any)

const SkillsRoute = SkillsImport.update({
  id: '/skills',
  path: '/skills',
  getParentRoute: () => rootRoute,
} as any)

const QuestsRoute = QuestsImport.update({
  id: '/quests',
  path: '/quests',
  getParentRoute: () => rootRoute,
} as any)

const ProfileSettRoute = ProfileSettImport.update({
  id: '/profile-sett',
  path: '/profile-sett',
  getParentRoute: () => rootRoute,
} as any)

const ProfileRoute = ProfileImport.update({
  id: '/profile',
  path: '/profile',
  getParentRoute: () => rootRoute,
} as any)

const PointsRoute = PointsImport.update({
  id: '/points',
  path: '/points',
  getParentRoute: () => rootRoute,
} as any)

const OnboardingRoute = OnboardingImport.update({
  id: '/onboarding',
  path: '/onboarding',
  getParentRoute: () => rootRoute,
} as any)

const NotifRoute = NotifImport.update({
  id: '/notif',
  path: '/notif',
  getParentRoute: () => rootRoute,
} as any)

const MeetingsRoute = MeetingsImport.update({
  id: '/meetings',
  path: '/meetings',
  getParentRoute: () => rootRoute,
} as any)

const InventoryRoute = InventoryImport.update({
  id: '/inventory',
  path: '/inventory',
  getParentRoute: () => rootRoute,
} as any)

const HistoryRoute = HistoryImport.update({
  id: '/history',
  path: '/history',
  getParentRoute: () => rootRoute,
} as any)

const FillProfileRoute = FillProfileImport.update({
  id: '/fill-profile',
  path: '/fill-profile',
  getParentRoute: () => rootRoute,
} as any)

const CalendarRoute = CalendarImport.update({
  id: '/calendar',
  path: '/calendar',
  getParentRoute: () => rootRoute,
} as any)

const AchievmentsRoute = AchievmentsImport.update({
  id: '/achievments',
  path: '/achievments',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const QuestIdRoute = QuestIdImport.update({
  id: '/quest/$id',
  path: '/quest/$id',
  getParentRoute: () => rootRoute,
} as any)

const ProfileIdRoute = ProfileIdImport.update({
  id: '/$id',
  path: '/$id',
  getParentRoute: () => ProfileRoute,
} as any)

const MeetIdRoute = MeetIdImport.update({
  id: '/meet/$id',
  path: '/meet/$id',
  getParentRoute: () => rootRoute,
} as any)

const CreateMeetNameRoute = CreateMeetNameImport.update({
  id: '/createMeet/$name',
  path: '/createMeet/$name',
  getParentRoute: () => rootRoute,
} as any)

const AllNameRoute = AllNameImport.update({
  id: '/all/$name',
  path: '/all/$name',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/achievments': {
      id: '/achievments'
      path: '/achievments'
      fullPath: '/achievments'
      preLoaderRoute: typeof AchievmentsImport
      parentRoute: typeof rootRoute
    }
    '/calendar': {
      id: '/calendar'
      path: '/calendar'
      fullPath: '/calendar'
      preLoaderRoute: typeof CalendarImport
      parentRoute: typeof rootRoute
    }
    '/fill-profile': {
      id: '/fill-profile'
      path: '/fill-profile'
      fullPath: '/fill-profile'
      preLoaderRoute: typeof FillProfileImport
      parentRoute: typeof rootRoute
    }
    '/history': {
      id: '/history'
      path: '/history'
      fullPath: '/history'
      preLoaderRoute: typeof HistoryImport
      parentRoute: typeof rootRoute
    }
    '/inventory': {
      id: '/inventory'
      path: '/inventory'
      fullPath: '/inventory'
      preLoaderRoute: typeof InventoryImport
      parentRoute: typeof rootRoute
    }
    '/meetings': {
      id: '/meetings'
      path: '/meetings'
      fullPath: '/meetings'
      preLoaderRoute: typeof MeetingsImport
      parentRoute: typeof rootRoute
    }
    '/notif': {
      id: '/notif'
      path: '/notif'
      fullPath: '/notif'
      preLoaderRoute: typeof NotifImport
      parentRoute: typeof rootRoute
    }
    '/onboarding': {
      id: '/onboarding'
      path: '/onboarding'
      fullPath: '/onboarding'
      preLoaderRoute: typeof OnboardingImport
      parentRoute: typeof rootRoute
    }
    '/points': {
      id: '/points'
      path: '/points'
      fullPath: '/points'
      preLoaderRoute: typeof PointsImport
      parentRoute: typeof rootRoute
    }
    '/profile': {
      id: '/profile'
      path: '/profile'
      fullPath: '/profile'
      preLoaderRoute: typeof ProfileImport
      parentRoute: typeof rootRoute
    }
    '/profile-sett': {
      id: '/profile-sett'
      path: '/profile-sett'
      fullPath: '/profile-sett'
      preLoaderRoute: typeof ProfileSettImport
      parentRoute: typeof rootRoute
    }
    '/quests': {
      id: '/quests'
      path: '/quests'
      fullPath: '/quests'
      preLoaderRoute: typeof QuestsImport
      parentRoute: typeof rootRoute
    }
    '/skills': {
      id: '/skills'
      path: '/skills'
      fullPath: '/skills'
      preLoaderRoute: typeof SkillsImport
      parentRoute: typeof rootRoute
    }
    '/user-quests': {
      id: '/user-quests'
      path: '/user-quests'
      fullPath: '/user-quests'
      preLoaderRoute: typeof UserQuestsImport
      parentRoute: typeof rootRoute
    }
    '/all/$name': {
      id: '/all/$name'
      path: '/all/$name'
      fullPath: '/all/$name'
      preLoaderRoute: typeof AllNameImport
      parentRoute: typeof rootRoute
    }
    '/createMeet/$name': {
      id: '/createMeet/$name'
      path: '/createMeet/$name'
      fullPath: '/createMeet/$name'
      preLoaderRoute: typeof CreateMeetNameImport
      parentRoute: typeof rootRoute
    }
    '/meet/$id': {
      id: '/meet/$id'
      path: '/meet/$id'
      fullPath: '/meet/$id'
      preLoaderRoute: typeof MeetIdImport
      parentRoute: typeof rootRoute
    }
    '/profile/$id': {
      id: '/profile/$id'
      path: '/$id'
      fullPath: '/profile/$id'
      preLoaderRoute: typeof ProfileIdImport
      parentRoute: typeof ProfileImport
    }
    '/quest/$id': {
      id: '/quest/$id'
      path: '/quest/$id'
      fullPath: '/quest/$id'
      preLoaderRoute: typeof QuestIdImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

interface ProfileRouteChildren {
  ProfileIdRoute: typeof ProfileIdRoute
}

const ProfileRouteChildren: ProfileRouteChildren = {
  ProfileIdRoute: ProfileIdRoute,
}

const ProfileRouteWithChildren =
  ProfileRoute._addFileChildren(ProfileRouteChildren)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/achievments': typeof AchievmentsRoute
  '/calendar': typeof CalendarRoute
  '/fill-profile': typeof FillProfileRoute
  '/history': typeof HistoryRoute
  '/inventory': typeof InventoryRoute
  '/meetings': typeof MeetingsRoute
  '/notif': typeof NotifRoute
  '/onboarding': typeof OnboardingRoute
  '/points': typeof PointsRoute
  '/profile': typeof ProfileRouteWithChildren
  '/profile-sett': typeof ProfileSettRoute
  '/quests': typeof QuestsRoute
  '/skills': typeof SkillsRoute
  '/user-quests': typeof UserQuestsRoute
  '/all/$name': typeof AllNameRoute
  '/createMeet/$name': typeof CreateMeetNameRoute
  '/meet/$id': typeof MeetIdRoute
  '/profile/$id': typeof ProfileIdRoute
  '/quest/$id': typeof QuestIdRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/achievments': typeof AchievmentsRoute
  '/calendar': typeof CalendarRoute
  '/fill-profile': typeof FillProfileRoute
  '/history': typeof HistoryRoute
  '/inventory': typeof InventoryRoute
  '/meetings': typeof MeetingsRoute
  '/notif': typeof NotifRoute
  '/onboarding': typeof OnboardingRoute
  '/points': typeof PointsRoute
  '/profile': typeof ProfileRouteWithChildren
  '/profile-sett': typeof ProfileSettRoute
  '/quests': typeof QuestsRoute
  '/skills': typeof SkillsRoute
  '/user-quests': typeof UserQuestsRoute
  '/all/$name': typeof AllNameRoute
  '/createMeet/$name': typeof CreateMeetNameRoute
  '/meet/$id': typeof MeetIdRoute
  '/profile/$id': typeof ProfileIdRoute
  '/quest/$id': typeof QuestIdRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/achievments': typeof AchievmentsRoute
  '/calendar': typeof CalendarRoute
  '/fill-profile': typeof FillProfileRoute
  '/history': typeof HistoryRoute
  '/inventory': typeof InventoryRoute
  '/meetings': typeof MeetingsRoute
  '/notif': typeof NotifRoute
  '/onboarding': typeof OnboardingRoute
  '/points': typeof PointsRoute
  '/profile': typeof ProfileRouteWithChildren
  '/profile-sett': typeof ProfileSettRoute
  '/quests': typeof QuestsRoute
  '/skills': typeof SkillsRoute
  '/user-quests': typeof UserQuestsRoute
  '/all/$name': typeof AllNameRoute
  '/createMeet/$name': typeof CreateMeetNameRoute
  '/meet/$id': typeof MeetIdRoute
  '/profile/$id': typeof ProfileIdRoute
  '/quest/$id': typeof QuestIdRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/achievments'
    | '/calendar'
    | '/fill-profile'
    | '/history'
    | '/inventory'
    | '/meetings'
    | '/notif'
    | '/onboarding'
    | '/points'
    | '/profile'
    | '/profile-sett'
    | '/quests'
    | '/skills'
    | '/user-quests'
    | '/all/$name'
    | '/createMeet/$name'
    | '/meet/$id'
    | '/profile/$id'
    | '/quest/$id'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/achievments'
    | '/calendar'
    | '/fill-profile'
    | '/history'
    | '/inventory'
    | '/meetings'
    | '/notif'
    | '/onboarding'
    | '/points'
    | '/profile'
    | '/profile-sett'
    | '/quests'
    | '/skills'
    | '/user-quests'
    | '/all/$name'
    | '/createMeet/$name'
    | '/meet/$id'
    | '/profile/$id'
    | '/quest/$id'
  id:
    | '__root__'
    | '/'
    | '/achievments'
    | '/calendar'
    | '/fill-profile'
    | '/history'
    | '/inventory'
    | '/meetings'
    | '/notif'
    | '/onboarding'
    | '/points'
    | '/profile'
    | '/profile-sett'
    | '/quests'
    | '/skills'
    | '/user-quests'
    | '/all/$name'
    | '/createMeet/$name'
    | '/meet/$id'
    | '/profile/$id'
    | '/quest/$id'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AchievmentsRoute: typeof AchievmentsRoute
  CalendarRoute: typeof CalendarRoute
  FillProfileRoute: typeof FillProfileRoute
  HistoryRoute: typeof HistoryRoute
  InventoryRoute: typeof InventoryRoute
  MeetingsRoute: typeof MeetingsRoute
  NotifRoute: typeof NotifRoute
  OnboardingRoute: typeof OnboardingRoute
  PointsRoute: typeof PointsRoute
  ProfileRoute: typeof ProfileRouteWithChildren
  ProfileSettRoute: typeof ProfileSettRoute
  QuestsRoute: typeof QuestsRoute
  SkillsRoute: typeof SkillsRoute
  UserQuestsRoute: typeof UserQuestsRoute
  AllNameRoute: typeof AllNameRoute
  CreateMeetNameRoute: typeof CreateMeetNameRoute
  MeetIdRoute: typeof MeetIdRoute
  QuestIdRoute: typeof QuestIdRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AchievmentsRoute: AchievmentsRoute,
  CalendarRoute: CalendarRoute,
  FillProfileRoute: FillProfileRoute,
  HistoryRoute: HistoryRoute,
  InventoryRoute: InventoryRoute,
  MeetingsRoute: MeetingsRoute,
  NotifRoute: NotifRoute,
  OnboardingRoute: OnboardingRoute,
  PointsRoute: PointsRoute,
  ProfileRoute: ProfileRouteWithChildren,
  ProfileSettRoute: ProfileSettRoute,
  QuestsRoute: QuestsRoute,
  SkillsRoute: SkillsRoute,
  UserQuestsRoute: UserQuestsRoute,
  AllNameRoute: AllNameRoute,
  CreateMeetNameRoute: CreateMeetNameRoute,
  MeetIdRoute: MeetIdRoute,
  QuestIdRoute: QuestIdRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/achievments",
        "/calendar",
        "/fill-profile",
        "/history",
        "/inventory",
        "/meetings",
        "/notif",
        "/onboarding",
        "/points",
        "/profile",
        "/profile-sett",
        "/quests",
        "/skills",
        "/user-quests",
        "/all/$name",
        "/createMeet/$name",
        "/meet/$id",
        "/quest/$id"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/achievments": {
      "filePath": "achievments.tsx"
    },
    "/calendar": {
      "filePath": "calendar.tsx"
    },
    "/fill-profile": {
      "filePath": "fill-profile.tsx"
    },
    "/history": {
      "filePath": "history.tsx"
    },
    "/inventory": {
      "filePath": "inventory.tsx"
    },
    "/meetings": {
      "filePath": "meetings.tsx"
    },
    "/notif": {
      "filePath": "notif.tsx"
    },
    "/onboarding": {
      "filePath": "onboarding.tsx"
    },
    "/points": {
      "filePath": "points.tsx"
    },
    "/profile": {
      "filePath": "profile.tsx",
      "children": [
        "/profile/$id"
      ]
    },
    "/profile-sett": {
      "filePath": "profile-sett.tsx"
    },
    "/quests": {
      "filePath": "quests.tsx"
    },
    "/skills": {
      "filePath": "skills.tsx"
    },
    "/user-quests": {
      "filePath": "user-quests.tsx"
    },
    "/all/$name": {
      "filePath": "all.$name.tsx"
    },
    "/createMeet/$name": {
      "filePath": "createMeet.$name.tsx"
    },
    "/meet/$id": {
      "filePath": "meet.$id.tsx"
    },
    "/profile/$id": {
      "filePath": "profile.$id.tsx",
      "parent": "/profile"
    },
    "/quest/$id": {
      "filePath": "quest.$id.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
