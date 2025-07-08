import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";

export function getEventData(eventType: string, eventId: number) {
  if (eventType === "Конференция") {
    return conferencesData.find((e) => e.id === eventId);
  }
  if (eventType === "Кино") {
    return kinoData.find((e) => e.id === eventId);
  }
  if (eventType === "Вечеринка") {
    return partiesData.find((e) => e.id === eventId);
  }
  if (eventType === "Нетворкинг") {
    return networkingData.find((e) => e.id === eventId);
  }
  if (eventType === "Квест") {
    return questsData.find((e) => e.id === eventId);
  }
}
