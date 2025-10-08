import { proxy } from "valtio";

export const store = proxy<{ isCheckedInToday: boolean }>({
  isCheckedInToday: false,
});

export const actions = {
  setIsCheckedInToday: (isCheckedInToday: boolean) => {
    store.isCheckedInToday = isCheckedInToday;
  },
};
