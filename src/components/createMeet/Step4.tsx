export const Step4 = () => {
  return (
    <>
      <div className="mb-4 text-xl font-bold">Укажите вознаграждение за участие</div>
      <div className="mb-4 flex flex-col items-start gap-2">
        <input
          type="text"
          placeholder="Локация вечеринки"
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />
        <div className="px-4 text-xs">
          Укажите количество поинтов для прохождения квеста
        </div>
      </div>
    </>
  );
};
