import { Coins } from "lucide-react";

interface PointsRequestProps {
  requestedPoints: number;
  onPointsChange: (points: number) => void;
  userBalance: number;
}

export default function PointsRequest({
  requestedPoints,
  onPointsChange,
  userBalance,
}: PointsRequestProps) {
  return (
    <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-purple-700">
        <Coins className="h-5 w-5" />
        Поинты
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          value={requestedPoints || ""}
          onChange={(e) => onPointsChange(Number(e.target.value))}
          placeholder="Количество поинтов"
          className="flex-1 rounded-lg border border-purple-200 bg-white px-3 py-2 text-purple-900 outline-none focus:border-purple-400"
        />
        <div className="text-sm text-purple-600">Баланс: {userBalance || 0}</div>
      </div>
    </div>
  );
}
