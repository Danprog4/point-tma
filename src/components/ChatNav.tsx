import { ChevronUp } from "lucide-react";
import { chatData } from "~/config/chat";

export const ChatNav = ({
  selectedCategory,
  setSelectedCategory,
}: {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}) => {
  return (
    <div className="fixed right-0 bottom-20 left-0 z-[10000] mx-auto mt-4 flex w-full flex-col items-start justify-center gap-4 bg-white px-4 py-4 text-center font-semibold text-black">
      <div className="">Быстрые ответы</div>
      <div className="scrollbar-hidden flex w-full gap-8 overflow-x-auto whitespace-nowrap">
        {chatData.map((category) => (
          <div className="flex items-center justify-start gap-2">
            <button
              key={category.category}
              className="flex-shrink-0 rounded-full py-2 text-black hover:bg-gray-200"
              onClick={() => {
                setSelectedCategory(
                  selectedCategory === category.category ? null : category.category,
                );
              }}
            >
              {category.category}
            </button>
            <div className="flex items-center justify-center">
              <ChevronUp className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
