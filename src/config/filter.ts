import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/init/react";

export const useFilterConfig = (selectedCategory?: string) => {
  const trpc = useTRPC();
  const categories = useQuery(trpc.event.getCategories.queryOptions());
  const organizers = useQuery(trpc.event.getOrganizers.queryOptions());

  // Get types based on selected category
  const activeCategory = categories.data?.find((c) => c.name === selectedCategory);

  // If a category is selected (and not "Все"), show only its types.
  // Otherwise, if "Все" is selected, show all types from all categories.
  // We use Set to remove duplicates if multiple categories share types.
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
        options: ["Сначала новые", "Сначала старые", "Сначала дешевле", "Сначала дороже"],
      },
      {
        key: "location",
        label: "Город",
        type: "select",
        options: ["Все", "Астана", "Алматы", "Москва"],
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
