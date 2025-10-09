import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { skillCategories } from "~/config/skills";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/skills")({
  component: RouteComponent,
});

function SkillProgressBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const progressPercentage = (current / max) * 100;

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full items-center justify-between text-xs">
        <div>{label}</div>
        <div>
          {current}/{max}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#1212121A]">
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}

function SkillCategory({
  category,
  userSkills,
}: {
  category: {
    label: string;
    bgColor: string;
    titleColor: string;
    progressColor: string;
    skills: Array<{ key: string; label: string; max: number }>;
  };
  userSkills: Array<{ [key: string]: number }>;
}) {
  const getUserSkillValue = (skillKey: string) => {
    if (!userSkills || userSkills.length === 0) return 0;

    for (const skillObj of userSkills) {
      if (skillObj[skillKey] !== undefined) {
        return skillObj[skillKey];
      }
    }
    return 0;
  };

  return (
    <div className={`rounded-2xl p-4 ${category.bgColor}`}>
      <h2 className={`mb-3 text-xl font-bold ${category.titleColor}`}>
        {category.label}
      </h2>
      <div className="flex w-full flex-col gap-2">
        {category.skills.map((skill, index) => (
          <SkillProgressBar
            key={index}
            label={skill.label}
            current={getUserSkillValue(skill.key)}
            max={skill.max}
          />
        ))}
      </div>
    </div>
  );
}

const isMobile = usePlatform();

function RouteComponent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full max-w-sm bg-white pb-24 data-[mobile=true]:pt-42"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>

        <h1 className="text-center text-base font-bold text-gray-800">Ваши навыки</h1>

        <div className="flex items-center justify-center p-4 pb-2"></div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {Object.values(skillCategories).map((category, index) => (
          <SkillCategory
            key={index}
            category={category}
            userSkills={user?.skills || []}
          />
        ))}
      </div>
    </div>
  );
}
