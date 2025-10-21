import { motion } from "framer-motion";
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
      <motion.div
        className="flex items-center justify-between px-4 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-3xl font-bold text-black">Люди</h1>
      </motion.div>

      <motion.div
        className="mb-4 flex items-center justify-center gap-6 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          type="text"
          placeholder="Поиск людей"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black transition-all placeholder:text-black/50 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
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
          <motion.div
            className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <WhiteFilter />
          </motion.div>
        </FilterDrawer>
      </motion.div>
    </>
  );
};
