import { ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { QuestCard } from "~/routes/quests";
import { Quest } from "~/types/quest";
import { MinusIcon } from "../Icons/MinusIcon";
import { PlusIcon } from "../Icons/Plus";
import { WalletIcon } from "../Icons/Wallet";
import BuyDrawer from "./BuyDrawer";

export const BuyQuest = ({
  quest,
  setIsOpen,
}: {
  quest: Quest;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const [count, setCount] = useState(1);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const handleCount = (type: "plus" | "minus") => {
    if (type === "plus") {
      setCount(count + 1);
    } else {
      setCount(Math.max(count - 1, 1));
    }
  };

  return (
    <>
      <div className="flex items-center justify-center p-4 pb-10 text-black">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute left-4 flex h-6 w-6 items-center justify-center"
        >
          <X className="h-6 w-6 text-gray-900" />
        </button>

        <h1 className="text-base font-bold text-gray-800">Квест</h1>
      </div>

      <h3 className="px-4 pb-2 text-xs font-normal text-black">{quest.date}</h3>
      <div className="px-4">
        <QuestCard quest={quest} />
        <div className="flex flex-col gap-2 pb-4">
          <div>Стоимость</div>
          <div className="text-xl font-bold">{quest.price}</div>
        </div>
        <div>Количество билетов</div>
        <div className="mx-auto mt-4 flex w-1/2 items-center justify-between">
          <div
            onClick={() => handleCount("minus")}
            className="flex aspect-square h-7 items-center justify-center rounded-full bg-[#DEB8FF]"
          >
            <MinusIcon />
          </div>
          <div className="text-2xl font-bold">{count}</div>
          <div
            onClick={() => handleCount("plus")}
            className="flex aspect-square h-7 items-center justify-center rounded-full bg-[#DEB8FF]"
          >
            <PlusIcon />
          </div>
        </div>
        <BuyDrawer open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <div className="mt-11 flex items-center justify-between gap-2">
            <div className="flex items-center justify-center gap-2">
              <WalletIcon />
              <div>Выберите способ оплаты</div>
            </div>
            <ArrowRight className="h-6 w-6 text-gray-900" />
          </div>
        </BuyDrawer>
      </div>
    </>
  );
};
