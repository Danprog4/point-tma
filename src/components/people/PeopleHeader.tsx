import FilterDrawer from "~/components/FilterDrawer";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";

interface PeopleHeaderProps {
  search: string;
  setSearch: (search: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
}

export const PeopleHeader = ({
  search,
  setSearch,
  isFilterOpen,
  setIsFilterOpen,
}: PeopleHeaderProps) => {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-5">
        <h1 className="text-3xl font-bold text-black">Люди</h1>
      </div>

      <div className="mb-4 flex items-center justify-center gap-6 px-4">
        <input
          type="text"
          placeholder="Поиск людей"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />

        <FilterDrawer
          open={isFilterOpen}
          onOpenChange={(open) => {
            if (open) {
              lockBodyScroll();
            } else {
              unlockBodyScroll();
            }
            setIsFilterOpen(open);
          }}
        >
          <div className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]">
            <WhiteFilter />
          </div>
        </FilterDrawer>
      </div>
    </>
  );
};
