import { chatData } from "~/config/chat";

export const ChatMessages = ({
  selectedCategory,
  setSelectedCategory,
  handleSendChatMessage,
}: {
  selectedCategory: string;
  setSelectedCategory: (category: string | null) => void;
  handleSendChatMessage: (message: string) => void;
}) => {
  return (
    <div className="fixed right-4 bottom-[8em] left-4 z-[10001] mx-auto rounded-lg bg-white p-3 shadow-lg">
      <div className="mb-2 text-sm font-semibold text-gray-700">{selectedCategory}</div>
      <div className="flex flex-col gap-2">
        {chatData
          .find((cat) => cat.category === selectedCategory)
          ?.messages.map((message, index) => (
            <button
              key={index}
              className="rounded-lg bg-gray-50 px-3 py-2 text-left text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => {
                handleSendChatMessage(message);
                setSelectedCategory(null);
              }}
            >
              {message}
            </button>
          ))}
      </div>
    </div>
  );
};
