import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export const Selecter = ({
  height = "max-h-11 min-h-11",
  width = "w-full",
  children,
  placeholder = "Выберите город",
  cities = ["Москва", "Санкт-Петербург", "Новосибирск"],
}: {
  height?: string;
  width?: string;
  placeholder?: string;
  cities?: string[];
  children?: React.ReactNode;
}) => {
  const [selectedCity, setSelectedCity] = useState("Москва");

  return (
    <Select>
      <SelectTrigger
        className={`${height} ${width} rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50`}
      >
        {children}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {cities.map((city) => (
          <SelectItem key={city} value={city}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
