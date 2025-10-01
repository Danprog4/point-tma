export const getPluralCategoryName = (category: string) => {
  switch (category) {
    case "Кино":
      return "Кино";
    case "Конференция":
      return "Конференции";
    case "Вечеринка":
      return "Вечеринки";
    case "Нетворкинг":
      return "Нетворкинг";
    case "Квест":
      return "Квесты";
    case "Популярное":
      return "Популярное";
    default:
      return category;
  }
};
