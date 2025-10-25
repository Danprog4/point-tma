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

  // Validate and fix date values
  const validateAndFixDate = (day: string, month: string, year: string) => {
    let d = parseInt(day) || 0;
    let m = parseInt(month) || 0;
    let y = parseInt(year) || 0;

    // Validate month (1-12)
    if (m < 1) m = 1;
    if (m > 12) m = 12;

    // Validate year (1900-current year)
    const currentYear = new Date().getFullYear();
    if (y < 1900) y = 1900;
    if (y > currentYear) y = currentYear;

    // Validate day based on month and year
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d < 1) d = 1;
    if (d > daysInMonth) d = daysInMonth;

    return `${d}.${m}.${y}`;
  };

  return (
    <div className="relative flex w-full gap-2">
      <div className="flex flex-1 items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
        <div className="flex w-full flex-col items-start text-sm">
          <div className="text-[#ABABAB]">День</div>
          <input
            type="number"
            min="1"
            max="31"
            value={birthday ? birthday.split(".")[0] || "" : ""}
            onChange={(e) => {
              const day = e.target.value;
              const parts = birthday ? birthday.split(".") : ["", "", ""];
              const newDate = validateAndFixDate(
                day,
                parts[1] || "1",
                parts[2] || "2000",
              );
              setBirthday(newDate);
            }}
            onBlur={(e) => {
              const day = e.target.value;
              const parts = birthday ? birthday.split(".") : ["", "", ""];
              const newDate = validateAndFixDate(
                day,
                parts[1] || "1",
                parts[2] || "2000",
              );
              setBirthday(newDate);
            }}
            className="w-full border-none bg-transparent text-black outline-none"
          />
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
        <div className="flex w-full flex-col items-start text-sm">
          <div className="text-[#ABABAB]">Месяц</div>
          <input
            type="number"
            min="1"
            max="12"
            value={birthday ? birthday.split(".")[1] || "" : ""}
            onChange={(e) => {
              const month = e.target.value;
              const parts = birthday ? birthday.split(".") : ["", "", ""];
              const newDate = validateAndFixDate(
                parts[0] || "1",
                month,
                parts[2] || "2000",
              );
              setBirthday(newDate);
            }}
            onBlur={(e) => {
              const month = e.target.value;
              const parts = birthday ? birthday.split(".") : ["", "", ""];
              const newDate = validateAndFixDate(
                parts[0] || "1",
                month,
                parts[2] || "2000",
              );
              setBirthday(newDate);
            }}
            className="w-full border-none bg-transparent text-black outline-none"
          />
        </div>
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
      <div className="flex flex-1 items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
        <div className="flex w-full flex-col items-start text-sm">
          <div className="text-[#ABABAB]">Год</div>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={birthday ? birthday.split(".")[2] || "" : ""}
            onChange={(e) => {
              const year = e.target.value;
              const parts = birthday ? birthday.split(".") : ["", "", ""];
              const newDate = validateAndFixDate(parts[0] || "1", parts[1] || "1", year);
              setBirthday(newDate);
            }}
            onBlur={(e) => {
              const year = e.target.value;
              const parts = birthday ? birthday.split(".") : ["", "", ""];
              const newDate = validateAndFixDate(parts[0] || "1", parts[1] || "1", year);
              setBirthday(newDate);
            }}
            className="w-full border-none bg-transparent text-black outline-none"
          />
        </div>
      </div>
    </div>
  );
};
