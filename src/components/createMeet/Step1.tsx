export const Step1 = () => {
  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-[#F0F0F0]"></div>
        <div className="text-xl text-[#9924FF]">Загрузить фото/афишу для вечеринки</div>
      </div>
      <div className="flex flex-col items-start gap-2 py-4 pb-4">
        <div className="text-xl font-bold">Название</div>
        <input
          type="text"
          placeholder={`Введите название ${name}`}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />
      </div>
      <div className="flex flex-col items-start gap-2">
        <div className="text-xl font-bold">Описание</div>
        <textarea
          placeholder={`Введите описание ${name}`}
          className="h-28 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-3 text-sm text-black placeholder:text-black/50"
        />
      </div>
    </>
  );
};
