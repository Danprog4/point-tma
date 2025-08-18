import { Datepicker, localeRu, Page, setOptions } from "@mobiscroll/react";
import "@mobiscroll/react/dist/css/mobiscroll.min.css";

setOptions({
  locale: localeRu,
  theme: "ios",
  themeVariant: "light",
});

function DatePicker2({
  value,
  setDate,
}: {
  value: Date | null;
  setDate: (date: Date) => void;
}) {
  return (
    <Page>
      <Datepicker
        controls={["date"]}
        label="Дата"
        labelStyle="stacked"
        inputStyle="underline"
        placeholder="Выберите дату"
        value={value}
        onChange={(e) => setDate(e.value as Date)}
      />
    </Page>
  );
}

export default DatePicker2;
