export const INTEREST_LABELS: Record<string, string> = {
  pets: "Домашние животные",
  animals: "Домашние животные",
  alcohol: "Алкоголь",
  smoking: "Курение",
  smokingHabits: "Курение",
  sports: "Спорт",
  education: "Образование",
  children: "Дети",
  interests: "Интересы",
  zodiacSign: "Знак зодиака",
  music: "Музыка",
  movies: "Фильмы",
  religion: "Отношение к религии",
  relationshipGoal: "Цель знакомства",
  hobbies: "Хобби",
  books: "Книги",
  personalityType: "Тип личности",
  diet: "Питание",
  politicalViews: "Политические взгляды",
  badHabits: "Вредные привычки",
};

export function getInterestLabel(key: string): string {
  return INTEREST_LABELS[key] || key;
}
