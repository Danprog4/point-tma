export const achievementTypes = {
  default: {
    borderColor: "border-gray-300",
    textColor: "text-gray-500",
    dotColor: "bg-gray-400",
    bgColor: "bg-white",
    hasGradientBorder: false,
  },
  pro: {
    borderColor: "border-green-200",
    textColor: "text-green-600",
    dotColor: "bg-green-400",
    bgColor: "bg-white",
    hasGradientBorder: false,
  },
  rare: {
    borderColor: "border-blue-300",
    textColor: "text-blue-600",
    dotColor: "bg-blue-500",
    bgColor: "bg-white",
    hasGradientBorder: false,
  },
  legend: {
    borderColor: "border-purple-300",
    textColor: "text-purple-600",
    dotColor: "bg-purple-500",
    bgColor: "bg-white",
    hasGradientBorder: true,
  },
  epic: {
    borderColor: "border-yellow-300",
    textColor: "text-yellow-600",
    dotColor: "bg-yellow-500",
    bgColor: "bg-yellow-50",
    hasGradientBorder: true,
  },
};

export const availableAchievements = [
  {
    title: "Любитель свиданий",
    type: "default" as keyof typeof achievementTypes,
    image: "💕",
  },
  {
    title: "Любитель квестов",
    type: "pro" as keyof typeof achievementTypes,
    image: "🎯",
  },
  {
    title: "Мастер свиданий",
    type: "rare" as keyof typeof achievementTypes,
    image: "👑",
  },
  {
    title: "Король свиданий",
    type: "legend" as keyof typeof achievementTypes,
    image: "👑",
  },
  {
    title: "Первый квест",
    type: "epic" as keyof typeof achievementTypes,
    image: "⭐",
  },
];
