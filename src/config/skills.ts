export interface Skill {
  name: string;
  current: number;
  max: number;
}

export interface SkillCategory {
  title: string;
  skills: Skill[];
  bgColor: string;
  titleColor: string;
  progressColor: string;
}

export const skillCategories: SkillCategory[] = [
  {
    title: "Физические навыки",
    bgColor: "bg-green-200",
    titleColor: "text-green-700",
    progressColor: "bg-green-100",
    skills: [
      { name: "Сила", current: 0, max: 32 },
      { name: "Выносливость", current: 0, max: 32 },
      { name: "Ловкость", current: 0, max: 32 },
    ],
  },
  {
    title: "Интеллектуальные навыки",
    bgColor: "bg-blue-200",
    titleColor: "text-blue-700",
    progressColor: "bg-blue-100",
    skills: [
      { name: "Обучаемость", current: 0, max: 32 },
      { name: "Концентрация", current: 0, max: 32 },
      { name: "Тайм-менеджмент", current: 0, max: 32 },
    ],
  },
  {
    title: "Социальные навыки",
    bgColor: "bg-orange-200",
    titleColor: "text-orange-700",
    progressColor: "bg-orange-100",
    skills: [
      { name: "Убеждение", current: 0, max: 32 },
      { name: "Харизма", current: 0, max: 32 },
      { name: "Лидерство", current: 0, max: 32 },
    ],
  },
  {
    title: "Профессиональные умения",
    bgColor: "bg-red-200",
    titleColor: "text-red-700",
    progressColor: "bg-red-100",
    skills: [
      { name: "Управление бизнесом", current: 0, max: 32 },
      { name: "Финансовая грамотность", current: 0, max: 32 },
      { name: "Финансовая грамотность", current: 0, max: 32 },
    ],
  },
];
