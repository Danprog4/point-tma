export const Calendar = () => {
  return (
    <div className="w-full overflow-x-hidden px-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">Июнь</h3>
      </div>
      <div className="mb-4 flex gap-2">
        {[
          { day: "5", weekday: "ВС", isWeekend: true },
          { day: "6", weekday: "ПН", isWeekend: false },
          { day: "7", weekday: "ВТ", isWeekend: false },
          { day: "8", weekday: "СР", isWeekend: false },
          { day: "9", weekday: "ЧТ", isWeekend: false },
          { day: "10", weekday: "ПТ", isWeekend: false },
          { day: "11", weekday: "СБ", isWeekend: true },
          { day: "12", weekday: "ВС", isWeekend: true },
          { day: "13", weekday: "ПН", isWeekend: false },
        ].map((date, idx) => (
          <div key={idx} className="flex w-12 flex-col items-center p-1">
            <span className="text-lg font-medium text-gray-900">{date.day}</span>
            <span
              className={`text-xs font-bold ${date.isWeekend ? "text-red-500" : "text-gray-500"}`}
            >
              {date.weekday}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
