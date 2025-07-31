import { ArrowLeft } from "lucide-react";

export const Participations = ({
  participants,
  setIsOpen,
}: {
  participants: any[];
  setIsOpen: (isOpen: boolean) => void;
}) => {
  if (!participants || participants.length === 0) {
    return <div>Нет участников</div>;
  }
  return (
    <div className="px-4 py-4">
      <header className="flex items-center justify-between pb-4">
        <button onClick={() => setIsOpen(false)}>
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="text-xl font-bold">Оценка участников</div>
        <div className="h-6 w-6"></div>
      </header>
      <div className="flex flex-col gap-4">
        {participants?.map((participant: any) => (
          <div key={participant.id}>{participant.name}</div>
        ))}
      </div>
    </div>
  );
};
