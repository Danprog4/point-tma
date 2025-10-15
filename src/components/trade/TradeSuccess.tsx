import { Repeat2 } from "lucide-react";

interface TradeSuccessProps {
  selectedUserName: string;
  selectedUserSurname: string;
  onClose: () => void;
}

export default function TradeSuccess({
  selectedUserName,
  selectedUserSurname,
  onClose,
}: TradeSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-14 pb-10">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="rounded-full bg-purple-100 p-4">
          <Repeat2 className="h-10 w-10 text-purple-700 drop-shadow" />
        </div>
        <div className="text-2xl font-bold text-purple-700">Запрос отправлен!</div>
      </div>
      <div className="mb-4 max-w-xs text-center text-base text-gray-700">
        Запрос на обмен билетом отправлен пользователю{" "}
        <span className="font-semibold text-purple-900">
          {selectedUserName} {selectedUserSurname}
        </span>
        . Ожидайте ответа.
      </div>
      <button
        className="mt-2 rounded-lg bg-purple-200 px-6 py-2 font-bold text-purple-900 transition hover:bg-purple-300"
        onClick={onClose}
      >
        Закрыть
      </button>
    </div>
  );
}
