import { Plus, Trash2 } from "lucide-react";
import { Event } from "~/db/schema";
import { Coin } from "../Icons/Coin";
import { Inventory } from "../Inventory";

export const Step4 = ({
  reward,
  setReward,

  isInventoryOpen,
  setIsInventoryOpen,
  setSelectedInventory,
  selectedInventory,
  user,
  event,
}: {
  reward: number;
  setReward: (reward: number) => void;

  isInventoryOpen: boolean;
  setIsInventoryOpen: (isInventoryOpen: boolean) => void;
  setSelectedInventory: (selectedInventory: string[]) => void;
  selectedInventory: string[];
  user: any;

  isDisabled: boolean;
  event: Event;
}) => {
  return (
    <div className="px-4 pb-20">
      {isInventoryOpen ? (
        <Inventory
          setSelectedInventory={setSelectedInventory}
          setIsInventoryOpen={setIsInventoryOpen}
          selectedInventory={selectedInventory}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Points Reward */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-4 text-lg font-bold text-gray-900">
              Вознаграждение в point
            </h3>
            
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 p-2">
                  <Coin />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Ваш баланс</div>
                  <div className="text-lg font-bold text-gray-900">{user?.balance}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  className="h-14 w-full rounded-2xl border-none bg-gray-50 px-4 text-lg font-bold text-gray-900 ring-1 ring-gray-200 placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  value={reward || ""}
                  onChange={(e) => setReward(Number(e.target.value))}
                />
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-gray-400">
                  point
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-gray-500">Награда каждому участнику</span>
                <span className="text-sm font-bold text-violet-600">
                  Итого: {reward * 1} point
                </span>
              </div>
            </div>
          </div>

          {/* Inventory Reward */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Награда из инвентаря</h3>
              <p className="mt-1 text-sm text-gray-500">
                Предметы повышают интерес к встрече
              </p>
            </div>

            {selectedInventory && selectedInventory.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {selectedInventory.map((item) => (
                  <div
                    key={item}
                    className="relative flex flex-col items-center gap-2 rounded-2xl bg-gray-50 p-3 ring-1 ring-gray-100"
                  >
                    <button
                      onClick={() =>
                        setSelectedInventory(selectedInventory.filter((i) => i !== item))
                      }
                      className="absolute top-2 right-2 rounded-full bg-white p-1.5 text-gray-400 shadow-sm hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-100">
                      <img
                        src={event?.image ?? ""}
                        alt="Reward"
                        className="h-12 w-12 object-contain"
                      />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs font-bold text-gray-900">
                        {event?.category === "Квест" ? "Билет на квест" : "Ваучер"}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setIsInventoryOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-3 transition-colors hover:border-violet-300 hover:bg-violet-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                    <Plus className="h-5 w-5 text-violet-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Добавить</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsInventoryOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 py-4 font-bold text-violet-600 transition-colors hover:border-violet-300 hover:bg-violet-100 active:scale-[0.99]"
              >
                <Plus className="h-5 w-5" />
                Выбрать из инвентаря
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
