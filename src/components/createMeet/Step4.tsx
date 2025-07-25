import { useState } from "react";
export const Step4 = ({
  name,
  isBasic,
  item,
  reward,
  setReward,
  isInvite,
}: {
  name: string;
  isBasic: boolean;
  item: any;
  reward: number;
  setReward: (reward: number) => void;
  isInvite: boolean;
}) => {
  const [length, setLength] = useState(2);
  return (
    <>
      <>
        <div className="mb-4 text-xl font-bold">Укажите вознаграждение за участие</div>
        <div className="mb-4 flex flex-col items-start gap-2">
          <input
            type="number"
            placeholder="Вознаграждение в point"
            className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            value={reward || ""}
            onChange={(e) => setReward(Number(e.target.value))}
          />
          <div className="px-4 text-xs">
            Укажите количество поинтов для прохождения квеста
          </div>
        </div>
      </>
    </>
  );
};
