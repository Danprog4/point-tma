import { motion } from "framer-motion";
import { Search } from "lucide-react";
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
    <div className="flex flex-col gap-4 px-4 pt-4">
      <motion.h1
        className="text-3xl font-bold tracking-tight text-gray-900"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Люди
      </motion.h1>

      <div className="flex gap-3">
        <motion.div 
            className="relative flex-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск людей..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-2xl border-none bg-white pl-11 pr-4 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </motion.div>

        <FilterDrawer
          open={isFilterOpen}
          onOpenChange={(open) => {
            if (open) lockBodyScroll();
            else unlockBodyScroll();
            setIsFilterOpen(open);
          }}
        >
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200 transition-colors hover:bg-violet-700"
          >
            <WhiteFilter />
          </motion.button>
        </FilterDrawer>
      </div>
    </div>
  );
};
