import { getEventData } from "~/lib/utils/getEventData";
import { Coin } from "../Icons/Coin";
import { Inventory } from "../Inventory";
export const Step4 = ({
  name,
  isBasic,
  item,
  reward,
  setReward,
  isInvite,
  isInventoryOpen,
  setIsInventoryOpen,
  setSelectedInventory,
  selectedInventory,
  user,
  setIsDisabled,
  isDisabled,
}: {
  name: string;
  isBasic: boolean;
  item: any;
  reward: number;
  setReward: (reward: number) => void;
  isInvite: boolean;
  isInventoryOpen: boolean;
  setIsInventoryOpen: (isInventoryOpen: boolean) => void;
  setSelectedInventory: (selectedInventory: string[]) => void;
  selectedInventory: string[];
  user: any;
  setIsDisabled: (isDisabled: boolean) => void;
  isDisabled: boolean;
}) => {
  const getItem = (id: string) => {
    if (!user?.inventory) {
      return undefined;
    }

    const foundItem = user.inventory.find((item: any) => {
      return item.id?.toString() === id;
    });

    return foundItem;
  };

  const getEvent = (eventId: number, name: string) => {
    return getEventData(name, eventId);
  };

  console.log(selectedInventory, "selectedInventory");

  return (
    <>
      {isInventoryOpen ? (
        <Inventory
          setSelectedInventory={setSelectedInventory}
          setIsInventoryOpen={setIsInventoryOpen}
          selectedInventory={selectedInventory}
        />
      ) : (
        <>
          <div className="text-xl font-bold">Укажите вознаграждение в point</div>
          <div className="flex items-center justify-start gap-2 py-4">
            <Coin />
            <div className="flex flex-col items-start justify-center">
              <div className="text-xs text-black/50">Ваш баланс</div>
              <div className="text-sm font-bold text-black">{user?.balance}</div>
            </div>
          </div>
          <div className="mb-4 flex w-full flex-col items-start gap-2">
            <input
              type="number"
              placeholder="Вознаграждение в point"
              className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
              value={reward || ""}
              onChange={(e) => setReward(Number(e.target.value))}
            />
            <div className="flex w-full items-center justify-between px-4">
              <div className="text-xs">Награда каждому участнику</div>
              <div className="text-xs text-[#9924FF]">{reward}</div>
            </div>
          </div>
          <div className="pb-4">
            <div className="text-xl font-bold">Награда из инвентаря</div>
            <div className="text-xs text-black/50">
              Наличие награды в виде предмета повышает привлекательность встречи
            </div>
          </div>
          {selectedInventory && selectedInventory.length === 0 && (
            <div
              className="text-center text-lg text-[#9924FF]"
              onClick={() => setIsInventoryOpen(true)}
            >
              Выберите награду из инвентаря
            </div>
          )}
          {selectedInventory && selectedInventory.length > 0 && (
            <div className="grid grid-cols-3 gap-4 py-2">
              {selectedInventory.map((item) => (
                <div key={item} className="flex flex-col">
                  <div className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4">
                    <img
                      src={getEvent(getItem(item)?.eventId, getItem(item)?.name)?.image}
                      alt="Selected reward"
                      className="h-[61px] w-[61px] rounded-lg"
                    />
                    <div className="text-center text-xs font-bold text-nowrap text-[#A35700]">
                      {getEventData(getItem(item)?.name, getItem(item)?.eventId)
                        ?.category === "Квест"
                        ? "Билет на квест"
                        : "Ваучер"}
                    </div>
                  </div>
                  <div
                    className="cursor-pointer text-center text-sm text-[#9924FF]"
                    onClick={() =>
                      setSelectedInventory(selectedInventory.filter((i) => i !== item))
                    }
                  >
                    Удалить
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedInventory && selectedInventory.length > 0 && (
            <div
              className="text-center text-lg text-[#9924FF]"
              onClick={() => setIsInventoryOpen(true)}
            >
              Добавить еще
            </div>
          )}
        </>
      )}
    </>
  );
};
