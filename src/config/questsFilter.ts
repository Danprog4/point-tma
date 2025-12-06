import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/init/react";

export const useQuestsFilter = () => {
  const trpc = useTRPC();
  const organizers = useQuery(trpc.event.getOrganizers.queryOptions());
  const categories = useQuery(trpc.event.getCategories.queryOptions());

  // Find the "Квест" category to get its types
  const questCategory = categories.data?.find((c) => c.name === "Квест");

  return {
    main: [
      {
        key: "sortBy",
        label: "Сортировка",
        type: "select",
        options: [
          "По дате: новые сначала",
          "По дате: старые сначала",
          "По цене: сначала дешевле",
          "По цене: сначала дороже",
          "Сначала дороже",
        ],
      },
      {
        key: "location",
        label: "Город",
        type: "select",
        options: ["Все", "Астана", "Алматы", "Москва"],
      },
      {
        key: "type",
        label: "Тип",
        type: "select",
        options: ["Все", ...(questCategory?.types || [])].filter(
          (type): type is string => !!type,
        ),
      },
      {
        key: "organizer",
        label: "Организатор",
        type: "select",
        options: [
          "Все",
          ...(organizers.data || []).filter((org): org is string => !!org),
        ],
      },
      {
        key: "isSeries",
        label: "Серия квестов",
        type: "checkbox",
      },
      {
        key: "hasAchievement",
        label: "Достижение",
        type: "select",
        options: ["Все", "Да", "Нет"],
      },
      {
        key: "price",
        label: "Цена",
        type: "range",
        min: 0,
        max: 1000000,
      },
    ],
  };
};
