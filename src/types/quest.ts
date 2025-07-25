export type Quest = {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  type: string;
  category: string;
  stages?: {
    title: string;
    desc: string;
  }[];
  quests?: {
    id: number;
    title: string;
    description: string;
  }[];
  rewards: {
    type: string;
    value: number;
  }[];
  hasAchievement: boolean;
  organizer: string;
  image: string;

  isSeries?: boolean;
};
