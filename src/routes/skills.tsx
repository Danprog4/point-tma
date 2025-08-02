import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { usePlatform } from "~/hooks/usePlatform";

export const Route = createFileRoute("/skills")({
  component: RouteComponent,
});

interface Skill {
  name: string;
  current: number;
  max: number;
}

interface SkillCategory {
  title: string;
  skills: Skill[];
  bgColor: string;
  titleColor: string;
  progressColor: string;
}

const skillCategories: SkillCategory[] = [
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

function SkillProgressBar({
  skill,
  progressColor,
}: {
  skill: Skill;
  progressColor: string;
}) {
  const progressPercentage = (skill.current / skill.max) * 100;

  return (
    <div className="flex w-full items-center justify-between rounded-full bg-[#1212121A] p-2 text-xs">
      <div>{skill.name}</div>
      <div>
        {skill.current}/{skill.max}
      </div>
    </div>
  );
}

function SkillCategory({ category }: { category: SkillCategory }) {
  return (
    <div className={`rounded-2xl p-4 ${category.bgColor}`}>
      <h2 className={`mb-3 text-xl font-bold ${category.titleColor}`}>
        {category.title}
      </h2>
      <div className="flex w-full flex-col gap-2">
        {category.skills.map((skill, index) => (
          <SkillProgressBar
            key={index}
            skill={skill}
            progressColor={category.progressColor}
          />
        ))}
      </div>
    </div>
  );
}

const isMobile = usePlatform();

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full max-w-sm bg-white pb-24 data-[mobile=true]:pt-35"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between bg-white px-4 data-[mobile=true]:pt-22"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex items-center justify-center p-4">
          <div className="flex-1">
            <h1 className="text-center text-base font-bold text-gray-800">Ваши навыки</h1>
          </div>
        </div>
        <div className="flex items-center justify-center p-4 pb-2"></div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 p-4">
        {skillCategories.map((category, index) => (
          <SkillCategory key={index} category={category} />
        ))}
      </div>
    </div>
  );
}
