import { cn } from "~/lib/utils";

interface ViewToggleProps {
  isList: boolean;
  setIsList: (isList: boolean) => void;
}

export const ViewToggle = ({ isList, setIsList }: ViewToggleProps) => {
  return (
    <div className="flex gap-4 px-4 pb-4">
      <button
        className={cn(
          "flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium",
          !isList ? "bg-purple-600 text-white" : "bg-white text-black",
        )}
        onClick={() => setIsList(false)}
      >
        На карте
      </button>
      <button
        className={cn(
          "flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium",
          isList ? "bg-purple-600 text-white" : "bg-white text-black",
        )}
        onClick={() => setIsList(true)}
      >
        Списком
      </button>
    </div>
  );
};
