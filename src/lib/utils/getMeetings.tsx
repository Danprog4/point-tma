import { eq } from "drizzle-orm";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import { db } from "~/db";
import { usersTable } from "~/db/schema";

function serializeUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    referrerId: user.referrerId,
    photoUrl: user.photoUrl,
    name: user.name,
    surname: user.surname,
    login: user.login,
    birthday: user.birthday,
    city: user.city,
    interests: user.interests,
    email: user.email,
    phone: user.phone,
    bio: user.bio,
    inventory: user.inventory,
    balance: user.balance,
    sex: user.sex,
    photo: user.photo,
    gallery: user.gallery,
  };
}

export const getMeetings = (meetings: any[]) => {
  return meetings?.map((meeting) => {
    const userRaw = db.query.usersTable.findFirst({
      where: eq(usersTable.id, meeting.userId),
    });
    const user = serializeUser(userRaw);

    switch (meeting.typeOfEvent) {
      case "Кино":
        return {
          ...meeting,
          event: kinoData?.find((event) => event.id === meeting.idOfEvent),
          user,
        };
      case "Вечеринка":
        return {
          ...meeting,
          event: partiesData?.find((event) => event.id === meeting.idOfEvent),
          user,
        };
      case "Конференция":
        return {
          ...meeting,
          event: conferencesData?.find((event) => event.id === meeting.idOfEvent),
          user,
        };
      case "Нетворкинг":
        return {
          ...meeting,
          event: networkingData?.find((event) => event.id === meeting.idOfEvent),
          user,
        };
      case "Квест":
        return {
          ...meeting,
          event: questsData?.find((quest) => quest.id === meeting.idOfEvent),
          user,
        };
      default:
        return {
          ...meeting,
          user,
        };
    }
  });
};
