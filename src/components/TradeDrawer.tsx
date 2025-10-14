import { ArrowLeft, Repeat2, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { User } from "~/db/schema";
import { getImage } from "~/lib/utils/getImage";

// Utility to filter lists based on search
function filterUsers(users: User[], search: string) {
  if (!search.trim()) return [];
  return users.filter((u) =>
    `${u.name ?? ""} ${u.surname ?? ""} ${u.login ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
}

export default function TradeDrawer({
  open,
  onOpenChange,
  users,
  friends = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  friends?: User[];
}) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isTradeSent, setIsTradeSent] = useState(false);

  const filteredGlobalUsers = search.length > 0 ? filterUsers(users, search) : [];

  const filteredFriends = search.length === 0 ? friends : filterUsers(friends, search);

  const handleReset = () => {
    setSelectedUser(null);
    setIsTradeSent(false);
    setSearch("");
  };

  const handleDrawerClose = (open: boolean) => {
    if (!open) handleReset();
    onOpenChange(open);
  };

  return (
    <Drawer.Root open={open} onOpenChange={handleDrawerClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-10 flex h-[70vh] flex-col rounded-t-3xl bg-white px-7 py-8 shadow-2xl">
          <header className="relative flex items-center justify-between pb-3">
            <ArrowLeft
              className="absolute top-1/2 left-0 h-6 w-6 -translate-y-1/2 cursor-pointer text-purple-500 transition hover:text-purple-700"
              onClick={() => setSelectedUser(null)}
              style={{
                visibility: selectedUser && !isTradeSent ? "visible" : "hidden",
              }}
            />
            <div className="mx-auto flex items-center gap-2 text-xl font-extrabold text-purple-700">
              <Repeat2 className="h-7 w-7 text-purple-600" />
              Обмен билетом
            </div>
            <button
              onClick={() => handleDrawerClose(false)}
              className="absolute top-0 right-0 rounded-full p-1 transition hover:bg-purple-50"
              aria-label="Закрыть"
            >
              <X className="h-8 w-8 text-purple-900" />
            </button>
          </header>

          {!selectedUser && !isTradeSent && (
            <>
              <div className="mt-2 mb-5 text-center text-base text-purple-700">
                <span className="font-semibold">
                  Обменяйтесь билетом с одним из друзей!
                </span>
                <br />
                Получите новые впечатления или помогите другу попасть на событие.
              </div>

              {/* SEARCH BAR */}
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2">
                <UserIcon className="h-5 w-5 text-purple-400" />
                <input
                  className="flex-1 bg-transparent text-purple-800 placeholder-purple-400 outline-none"
                  placeholder="Поиск по имени или логину..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* FRIENDS LIST (default) or Search results */}
              <div
                className="flex flex-col gap-5 overflow-y-auto pt-1"
                style={{ maxHeight: "55vh" }}
              >
                {search === "" ? (
                  filteredFriends.length > 0 ? (
                    <div>
                      <div className="mb-2 px-2 text-sm font-bold text-purple-500 uppercase">
                        Друзья
                      </div>
                      <div className="flex flex-col gap-2">
                        {filteredFriends.map((user) => (
                          <button
                            key={user.id}
                            className="flex items-center gap-4 rounded-xl border border-purple-100 bg-white px-5 py-3 shadow transition hover:border-purple-300"
                            onClick={() => setSelectedUser(user)}
                          >
                            <img
                              src={getImage(user, "")}
                              alt={user.name ?? ""}
                              className="h-10 w-10 rounded-full border border-purple-200 object-cover"
                            />
                            <div className="flex flex-col items-start text-left">
                              <span className="font-semibold text-purple-900">
                                {user.name} {user.surname}
                              </span>
                              <span className="text-xs text-purple-400">
                                {user.login ? `@${user.login}` : ""}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-400">
                      У вас нет друзей для обмена
                    </div>
                  )
                ) : filteredGlobalUsers.length > 0 ? (
                  <div>
                    <div className="mb-2 px-2 text-sm font-bold text-yellow-600 uppercase">
                      Пользователи
                    </div>
                    <div className="flex flex-col gap-2">
                      {filteredGlobalUsers.map((user) => (
                        <button
                          key={user.id}
                          className="flex items-center gap-4 rounded-xl border border-yellow-100 bg-white px-5 py-3 shadow transition hover:border-yellow-300"
                          onClick={() => setSelectedUser(user)}
                        >
                          <img
                            src={getImage(user, "")}
                            alt={user.name ?? ""}
                            className="h-10 w-10 rounded-full border border-yellow-200 object-cover"
                          />
                          <div className="flex flex-col items-start text-left">
                            <span className="font-semibold text-yellow-900">
                              {user.name} {user.surname}
                            </span>
                            <span className="text-xs text-yellow-400">
                              {user.login ? `@${user.login}` : ""}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-300">
                    Не найдено пользователей по запросу
                  </div>
                )}
              </div>
            </>
          )}

          {/* Trade confirmation */}
          {selectedUser && !isTradeSent && (
            <div className="flex flex-col items-center py-8">
              <div className="mb-2 text-2xl font-bold text-purple-700">
                Подтверждение обмена
              </div>
              <div className="mb-6 text-center text-base text-gray-600">
                Вы хотите предложить обмен билетом пользователю:
              </div>
              <div className="mb-2 flex flex-col items-center gap-2">
                <img
                  src={getImage(selectedUser, "")}
                  alt={selectedUser.name ?? ""}
                  className="h-24 w-24 rounded-lg border-2 border-purple-300 object-cover"
                />
                <div className="text-lg font-semibold text-purple-900">
                  {selectedUser.name} {selectedUser.surname}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedUser.login ? `@${selectedUser.login}` : ""}
                </div>
              </div>
              <button
                className="mt-6 w-full rounded-2xl bg-purple-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-purple-700"
                onClick={() => setIsTradeSent(true)}
              >
                Отправить запрос на обмен
              </button>
            </div>
          )}

          {/* Trade success state */}
          {isTradeSent && (
            <div className="flex flex-col items-center justify-center pt-14 pb-10">
              <div className="mb-6 flex flex-col items-center gap-3">
                <div className="rounded-full bg-purple-100 p-4">
                  <Repeat2 className="h-10 w-10 text-purple-700 drop-shadow" />
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  Запрос отправлен!
                </div>
              </div>
              <div className="mb-4 max-w-xs text-center text-base text-gray-700">
                Запрос на обмен билетом отправлен пользователю{" "}
                <span className="font-semibold text-purple-900">
                  {selectedUser?.name} {selectedUser?.surname}
                </span>
                . Ожидайте ответа.
              </div>
              <button
                className="mt-2 rounded-lg bg-purple-200 px-6 py-2 font-bold text-purple-900 transition hover:bg-purple-300"
                onClick={() => handleDrawerClose(false)}
              >
                Закрыть
              </button>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
