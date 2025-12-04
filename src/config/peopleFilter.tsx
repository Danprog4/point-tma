export const usePeopleFilter = () => {
  return {
    main: [
      {
        key: "sortBy",
        label: "Сортировка",
        type: "select",
        options: ["Сначала новые", "Сначала старые"],
      },
      {
        key: "sex",
        label: "Пол",
        type: "select",
        options: ["Все", "Мужчина", "Женщина"],
      },
      {
        key: "level",
        label: "Уровень",
        type: "range",
        min: 1,
        max: 100,
      },
      {
        key: "city",
        label: "Город",
        type: "select",
        options: ["Все", "Астана", "Алматы", "Москва"],
      },
      {
        key: "isWithPhoto",
        label: "С фото",
        type: "checkbox",
      },
      {
        key: "age",
        label: "Возраст",
        type: "range",
        min: 18,
        max: 100,
      },
    ],
  };
};
