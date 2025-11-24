import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

export const Step5 = ({
  isLoading,
  type,
  title,
  base64,
}: {
  isLoading: boolean;

  type: string;
  eventType: string;
  isBasic: boolean;
  title: string;

  reward: number;
  setReward: (reward: number) => void;
  base64: string;
}) => {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50 px-4 pb-40">
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-violet-500/20 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-violet-50 text-violet-600 shadow-xl ring-4 ring-white">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Создаем встречу</h2>
            <p className="mt-2 text-gray-500">Пожалуйста, подождите...</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="relative w-full max-w-sm"
        >
          {/* Confetti / Decoration Background */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-green-200/40 to-emerald-200/40 blur-3xl" />
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-xl ring-4 ring-white"
            >
              <Check className="h-12 w-12" strokeWidth={3} />
            </motion.div>

            <h2 className="mb-2 text-3xl font-bold text-gray-900">Успех!</h2>
            <p className="mb-8 text-gray-500">Ваша встреча успешно создана</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
