import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export const Selecter = () => {
  const [selectedCity, setSelectedCity] = useState("Москва");

  return (
    <Select>
      <SelectTrigger className="max-h-11 min-h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50">
        <SelectValue placeholder="Выберите город" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Москва</SelectItem>
        <SelectItem value="dark">Санкт-Петербург</SelectItem>
        <SelectItem value="system">Новосибирск</SelectItem>
      </SelectContent>
    </Select>
  );
};
