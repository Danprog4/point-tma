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

export const skillCategories = {
  physical: {
    label: "Физические навыки",
    bgColor: "bg-green-200",
    titleColor: "text-green-700",
    progressColor: "bg-green-100",
    skills: [
      { key: "strength", label: "Сила", max: 32 },
      { key: "endurance", label: "Выносливость", max: 32 },
      { key: "agility", label: "Ловкость", max: 32 },
    ],
  },
  mental: {
    label: "Умственные навыки",
    bgColor: "bg-blue-200",
    titleColor: "text-blue-700",
    progressColor: "bg-blue-100",
    skills: [
      { key: "learning", label: "Обучаемость", max: 32 },
      { key: "concentration", label: "Концентрация", max: 32 },
      { key: "time_management", label: "Тайм-менеджмент", max: 32 },
    ],
  },
  social: {
    label: "Социальные навыки",
    bgColor: "bg-orange-200",
    titleColor: "text-orange-700",
    progressColor: "bg-orange-100",
    skills: [
      { key: "persuasion", label: "Убеждение", max: 32 },
      { key: "charisma", label: "Харизма", max: 32 },
      { key: "leadership", label: "Лидерство", max: 32 },
    ],
  },
  business: {
    label: "Бизнес навыки",
    bgColor: "bg-red-200",
    titleColor: "text-red-700",
    progressColor: "bg-red-100",
    skills: [
      { key: "business_management", label: "Управление бизнесом", max: 32 },
      { key: "financial_literacy", label: "Финансовая грамотность", max: 32 },
    ],
  },
};

export const getAllSkills = () => {
  return Object.values(skillCategories).flatMap((category) => category.skills);
};
