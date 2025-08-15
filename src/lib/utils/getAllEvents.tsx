export function getAllEvents(
  activeFilter: string,
  questsData: any[],
  kinoData: any[],
  conferencesData: any[],
  networkingData: any[],
  partiesData: any[],
) {
  let data: any[] = [];

  switch (activeFilter) {
    case "Все":
      data = [
        ...questsData,
        ...kinoData,
        ...conferencesData,
        ...networkingData,
        ...partiesData,
      ];
      break;
    case "Квесты":
      data = questsData;
      console.log(data);
      break;
    case "Кино":
      data = kinoData;
      break;
    case "Конференции":
      data = conferencesData;
      break;
    case "Вечеринки":
      data = partiesData;
      break;
    case "Нетворкинг":
      data = networkingData;
      break;
    default:
      data = [];
  }

  const all = [
    ...questsData,
    ...kinoData,
    ...conferencesData,
    ...networkingData,
    ...partiesData,
  ];

  return { data, all };
}
