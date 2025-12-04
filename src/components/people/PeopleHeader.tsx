import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { cn } from "~/lib/utils";

interface PeopleHeaderProps {
  search: string;
  setSearch: (search: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  hideSearch?: boolean;
}

export const PeopleHeader = ({
  search,
  setSearch,
  isFilterOpen,
  setIsFilterOpen,
  hideSearch,
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
        <AnimatePresence mode="popLayout">
          {!hideSearch && (
            <motion.div
              className="relative flex-1"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ originX: 0 }}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Поиск людей..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-2xl border-none bg-white pr-4 pl-11 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 transition-all outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          layout
          initial={{ width: 48 }}
          animate={{ width: hideSearch ? "100%" : 48 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFilterOpen(true)}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200 transition-colors hover:bg-violet-700",
            hideSearch ? "w-full" : "w-12",
          )}
        >
          <WhiteFilter />
          <AnimatePresence mode="popLayout">
            {hideSearch && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold whitespace-nowrap"
              >
                Фильтры
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};
