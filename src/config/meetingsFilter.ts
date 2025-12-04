import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/init/react";

export const useMeetingsFilter = (selectedCategory?: string) => {
  const trpc = useTRPC();
  const categories = useQuery(trpc.event.getCategories.queryOptions());

  // Get types based on selected category
  const activeCategory = categories.data?.find((c) => c.name === selectedCategory);

  // If a category is selected (and not "Все"), show only its types.
  // Otherwise, if "Все" is selected, show all types from all categories.
  const typeOptions =
    selectedCategory && selectedCategory !== "Все"
      ? ["Все", ...(activeCategory?.types || [])]
      : [
          "Все",
          ...Array.from(
            new Set((categories.data || []).flatMap((category) => category.types || [])),
          ),
        ];

  return {
    main: [
      {
        key: "sortBy",
        label: "Сортировка",
        type: "select",
        options: ["Сначала новые", "Сначала старые"],
      },
      {
        key: "category",
        label: "Категория",
        type: "select",
        options: [
          "Все",
          ...(categories.data || [])
            .map((category) => category.name)
            .filter((name): name is string => !!name),
        ],
      },
      {
        key: "type",
        label: "Тип",
        type: "select",
        options: typeOptions.filter((type): type is string => !!type),
        disabled: !selectedCategory || selectedCategory === "Все",
      },
      {
        key: "maxParticipants",
        label: "Максимальное количество участников",
        type: "number",
        min: 1,
        max: 100,
      },
    ],
  };
};
