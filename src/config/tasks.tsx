import { Calendar, ShoppingBag, Ticket } from "lucide-react";

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
    id: "buy-event",
    title: "Купить 1 событие",
    description: "Приобретите 1 событие из афиши и получите награду",
    reward: {
      xp: 10,
      points: 100,
    },
    icon: <Calendar className="h-6 w-6" />,
    action: () => navigate({ to: "/" }),
    total: 1,
  },
  {
    id: "active-event",
    title: "Активировать 1 билет",
    description: "Активируйте 1 билет на квест и получите награду",
    reward: {
      xp: 30,
      points: 150,
    },
    icon: <Ticket className="h-6 w-6" />,
    action: () => navigate({ to: "/quests" }),
    total: 1,
  },
];

export const backendTasks = [
  {
    id: "buy-case",
    title: "Купить 1 кейс",
    description: "Приобретите 1 кейс в магазине и получите награду",
    reward: {
      xp: 50,
      points: 200,
    },
    total: 1,
  },
  {
    id: "buy-event",
    title: "Купить 1 событие",
    description: "Приобретите 1 событие из афиши и получите награду",
    reward: {
      xp: 10,
      points: 100,
    },
    total: 1,
  },
  {
    id: "active-event",
    title: "Активировать 1 билет",
    description: "Активируйте 1 билет на квест и получите награду",
    reward: {
      xp: 30,
      points: 150,
    },
    total: 1,
  },
];
