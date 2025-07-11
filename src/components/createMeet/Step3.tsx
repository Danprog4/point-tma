export const Step3 = ({ name, isBasic }: { name: string; isBasic: boolean }) => {
  return (
    <>
      {isBasic ? (
        <>
          <div className="mb-4 text-xl font-bold">Сколько людей будет на вечеринке?</div>
          <div className="mb-2 flex w-full gap-2 text-xl font-bold">
            Количество участников
          </div>
          <div className="mb-4 flex flex-col items-start gap-2">
            <input
              type="text"
              placeholder="Локация вечеринки"
              className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            />
            <div className="px-4 text-xs">
              Допустимое количество людей, не из числа ваших друзей
            </div>
          </div>
          <div className="mb-2 flex w-full gap-2 text-xl font-bold">
            Пригласите друзей
          </div>
          <div className="text-sm text-gray-500">У вас пока нет друзей</div>
        </>
      ) : (
        <>
          <div className="mb-2 flex w-full gap-2 text-xl font-bold">Пригласите друга</div>
          <div className="mb-4 flex flex-col items-start gap-2">
            <input
              type="text"
              placeholder="Поиск"
              className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            />
            <div className="px-4 text-xs">Можете ввести фамилию или ник</div>
          </div>
        </>
      )}
    </>
  );
};
