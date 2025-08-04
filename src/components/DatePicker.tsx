import { monthOptions } from "~/config/months";

export const DatePicker = ({
  birthday,
  setBirthday,
  monthValue,
}: {
  birthday: string;
  setBirthday: (birthday: string) => void;
  monthValue: string;
}) => {
  const filteredMonths =
    monthValue.length > 0
      ? monthOptions.filter((m) => m.toLowerCase().includes(monthValue.toLowerCase()))
      : [];
  return (
    <div className="relative flex w-full gap-2">
      <div className="flex flex-1 items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
        <div className="flex w-full flex-col items-start text-sm">
          <div className="text-[#ABABAB]">День</div>
          <input
            type="number"
            value={birthday ? birthday.split(".")[0] || "" : ""}
            onChange={(e) => {
              const day = e.target.value;
              const parts = birthday ? birthday.split(".") : ["", "", ""];
              setBirthday(`${day}.${parts[1] || ""}.${parts[2] || ""}`);
            }}
            className="w-full border-none bg-transparent text-black outline-none"
          />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
        <div className="relative w-full">
          <div className="text-[#ABABAB]">Месяц</div>
          <input
            type="text"
            value={monthValue}
            onClick={() => {
              if (monthValue) {
                const [d, , y] = birthday.split(".");
                setBirthday(`${d || ""}.${""}.${y || ""}`);
              }
            }}
            onChange={(e) => {
              const m = e.target.value;
              const [d, , y] = birthday.split(".");
              setBirthday(`${d || ""}.${m}.${y || ""}`);
            }}
            className="w-full border-none bg-transparent text-black outline-none"
          />
          {filteredMonths.length > 0 && !monthOptions.includes(monthValue) && (
            <ul className="absolute top-full right-0 z-10 mt-1 max-h-40 w-[100px] overflow-auto rounded-lg border bg-white shadow-lg">
              {filteredMonths.map((m) => (
                <li
                  key={m}
                  onClick={() => {
                    const [d, , y] = birthday.split(".");
                    setBirthday(`${d || ""}.${m}.${y || ""}`);
                  }}
                  className="cursor-pointer px-2 py-1 hover:bg-gray-100"
                >
                  {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
        <div className="flex w-full flex-col items-start text-sm">
          <div className="text-[#ABABAB]">Год</div>
          <input
            type="number"
            value={birthday ? birthday.split(".")[2] || "" : ""}
            onChange={(e) => {
              const year = e.target.value;
              const parts = birthday ? birthday.split(".") : ["", "", ""];
              setBirthday(`${parts[0] || ""}.${parts[1] || ""}.${year}`);
            }}
            className="w-full border-none bg-transparent text-black outline-none"
          />
        </div>
      </div>
    </div>
  );
};
