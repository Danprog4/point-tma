import { fakeUsers } from "~/config/fakeUsers";
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

  setValue,
  placeholder = "Выберите город",

  cities = fakeUsers.map((user) => user.city),
}: {
  height?: string;
  width?: string;
  placeholder?: string;
  cities?: string[];

  setValue?: (value: string) => void;
  children?: React.ReactNode;
}) => {
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
          <SelectItem key={city} value={city} onClick={() => setValue?.(city)}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
