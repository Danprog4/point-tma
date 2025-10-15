import { ArrowLeft, Repeat2, X } from "lucide-react";

interface TradeHeaderProps {
  showBackButton: boolean;
  onBackClick: () => void;
  onClose: () => void;
}

export default function TradeHeader({
  showBackButton,
  onBackClick,
  onClose,
}: TradeHeaderProps) {
  return (
    <header className="relative flex items-center justify-between pb-3">
      <ArrowLeft
        className="absolute top-1/2 left-0 h-6 w-6 -translate-y-1/2 cursor-pointer text-purple-500 transition hover:text-purple-700"
        onClick={onBackClick}
        style={{
          visibility: showBackButton ? "visible" : "hidden",
        }}
      />
      <div className="mx-auto flex items-center gap-2 text-xl font-extrabold text-purple-700">
        <Repeat2 className="h-7 w-7 text-purple-600" />
        Обмен предметами
      </div>
      <button
        onClick={onClose}
        className="absolute top-0 right-0 rounded-full p-1 transition hover:bg-purple-50"
        aria-label="Закрыть"
      >
        <X className="h-8 w-8 text-purple-900" />
      </button>
    </header>
  );
}
