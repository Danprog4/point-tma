import { Datepicker, localeRu, Page, setOptions } from "@mobiscroll/react";
import "@mobiscroll/react/dist/css/mobiscroll.min.css";

setOptions({
  locale: localeRu,
  theme: "ios",
  themeVariant: "light",
});

function TimePicker({
  value,
  setTime,
  placeholder,
}: {
  value: Date | null;
  setTime: (time: Date) => void;
  placeholder?: string | "Выберите время";
}) {
  return (
    <Page>
      <Datepicker
        controls={["time"]}
        label="Время"
        labelStyle="stacked"
        inputStyle="underline"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setTime(e.value as Date);
        }}
      />
    </Page>
  );
}

export default TimePicker;
