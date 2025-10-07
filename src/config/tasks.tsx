import { ShoppingBag, Target } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  reward: {
    xp: number;
    points: number;
  };
  icon: React.ReactNode;
  action: () => void;
  completed?: boolean;
  total?: number;
}

export const getTasks = (navigate: (opts: { to: string }) => void): Task[] => [
  {
    id: "buy-case",
    title: "Купить 1 кейс",
    description: "Приобретите 1 кейс в магазине и получите награду",
    reward: {
      xp: 50,
      points: 200,
    },
    icon: <ShoppingBag className="h-6 w-6" />,
    action: () => navigate({ to: "/shop" }),
    total: 1,
  },
  {
    id: "visit-shop",
    title: "Посетить магазин",
    description: "Зайдите в магазин и ознакомьтесь с ассортиментом",
    reward: {
      xp: 10,
      points: 50,
    },
    icon: <Target className="h-6 w-6" />,
    action: () => navigate({ to: "/shop" }),
  },
];
