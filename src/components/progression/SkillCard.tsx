/**
 * Компонент карточки навыка
 */

import { SkillCategory, SkillProgress } from "~/systems/progression/client";

interface SkillCardProps {
  skill: SkillProgress & { xpToNext: number; progress: number };
}

const skillInfo: Record<
  string,
  { name: string; icon: string; color: string; description: string }
> = {
  [SkillCategory.SOCIAL]: {
    name: "Социальное",
    icon: "👥",
    color: "from-pink-500 to-rose-600",
    description: "Встречи, друзья, общение",
  },
  [SkillCategory.ADVENTURE]: {
    name: "Приключения",
    icon: "🎯",
    color: "from-orange-500 to-red-600",
    description: "Квесты и челленджи",
  },
  [SkillCategory.ECONOMY]: {
    name: "Экономика",
    icon: "💰",
    color: "from-green-500 to-emerald-600",
    description: "Маркет и обмены",
  },
  [SkillCategory.CREATIVE]: {
    name: "Творчество",
    icon: "🎨",
    color: "from-purple-500 to-indigo-600",
    description: "Создание контента",
  },
  [SkillCategory.HELPER]: {
    name: "Помощь",
    icon: "❤️",
    color: "from-red-500 to-pink-600",
    description: "Help-квесты и сообщество",
  },
  [SkillCategory.EXPLORER]: {
    name: "Исследование",
    icon: "🗺️",
    color: "from-blue-500 to-cyan-600",
    description: "Новые места и локации",
  },
};

const defaultInfo = {
  name: "Неизвестно",
  icon: "❓",
  color: "from-gray-400 to-gray-500",
  description: "Неизвестный навык",
};

export const SkillCard = ({ skill }: SkillCardProps) => {
  const info = skillInfo[skill.category] ?? defaultInfo;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${info.color} text-2xl shadow-md`}
        >
          {info.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{info.name}</h3>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-bold text-gray-700">
              Ур. {skill.level}
            </span>
          </div>

          <p className="mb-2 text-xs text-gray-500">{info.description}</p>

          <div className="space-y-1">
            <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${info.color}`}
                style={{ width: `${Math.min(100, skill.progress || 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                {skill.xp?.toLocaleString() ?? 0} / {skill.xpToNext?.toLocaleString() ?? 0} XP
              </span>
              <span>{(skill.progress || 0).toFixed(0)}%</span>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Всего действий: {skill.totalActions ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
};
