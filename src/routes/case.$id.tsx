import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Gift, Loader2, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSound } from "use-sound";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

// Utility function to get rarity-based colors and styles
const getRarityStyles = (rarity: string) => {
  // Отладочная информация
  console.log("Getting rarity styles for:", rarity);

  switch (rarity?.toLowerCase()) {
    case "common":
      return {
        gradient: "from-gray-400 to-gray-600",
        bgGradient: "from-gray-100 to-gray-200",
        textColor: "text-gray-700",
        iconColor: "text-gray-600",
        borderColor: "border-gray-300",
        shadowColor: "shadow-gray-200",
        bgColor: "bg-gray-500",
      };
    case "rare":
      return {
        gradient: "from-blue-500 to-blue-700",
        bgGradient: "from-blue-100 to-blue-200",
        textColor: "text-blue-700",
        iconColor: "text-blue-600",
        borderColor: "border-blue-300",
        shadowColor: "shadow-blue-200",
        bgColor: "bg-blue-500",
      };
    case "epic":
      return {
        gradient: "from-purple-500 to-purple-700",
        bgGradient: "from-purple-100 to-purple-200",
        textColor: "text-purple-700",
        iconColor: "text-purple-600",
        borderColor: "border-purple-300",
        shadowColor: "shadow-purple-200",
        bgColor: "bg-purple-600",
      };
    case "bronze":
      return {
        gradient: "from-amber-600 to-amber-800",
        bgGradient: "from-amber-100 to-amber-200",
        textColor: "text-amber-800",
        iconColor: "text-amber-600",
        borderColor: "border-amber-300",
        shadowColor: "shadow-amber-200",
        bgColor: "bg-amber-600",
      };
    case "silver":
      return {
        gradient: "from-gray-400 to-gray-600",
        bgGradient: "from-gray-100 to-gray-200",
        textColor: "text-gray-700",
        iconColor: "text-gray-600",
        borderColor: "border-gray-300",
        shadowColor: "shadow-gray-200",
        bgColor: "bg-gray-500",
      };
    case "gold":
      return {
        gradient: "from-yellow-400 to-yellow-600",
        bgGradient: "from-yellow-100 to-yellow-200",
        textColor: "text-yellow-700",
        iconColor: "text-yellow-600",
        borderColor: "border-yellow-300",
        shadowColor: "shadow-yellow-200",
        bgColor: "bg-yellow-500",
      };
    default:
      return {
        gradient: "from-gray-400 to-gray-600",
        bgGradient: "from-gray-100 to-gray-200",
        textColor: "text-gray-700",
        iconColor: "text-gray-600",
        borderColor: "border-gray-300",
        shadowColor: "shadow-gray-200",
        bgColor: "bg-gray-500",
      };
  }
};

// Utility function to get case type (limited or not)
const getCaseType = (eventId: number | null, eventType: string | null) => {
  if (eventId && eventType) {
    return {
      type: "limited",
      label: "ЛИМИТИРОВАННЫЙ",
      bgColor: "bg-red-500",
      textColor: "text-white",
    };
  }
};

export const Route = createFileRoute("/case/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const gamble = useMemo(() => "/gamble.mp3", []);
  const prize = useMemo(() => "/prize.mp3", []);
  const [play] = useSound(gamble);
  const [playPrize] = useSound(prize);
  const { data: caseData, isLoading } = useQuery(
    trpc.cases.getCase.queryOptions({ id: parseInt(id) }),
  );
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const isMobile = usePlatform();

  // Состояние для анимации открытия кейса
  const [offset, setOffset] = useState(0);
  const [isAnimationEnd, setIsAnimationEnd] = useState(false);
  const [arrayWithWinningItem, setArrayWithWinningItem] = useState<any[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [showZoomAnimation, setShowZoomAnimation] = useState(false);

  // Состояние для модалки наград
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  const isHasAlready = useMemo(() => {
    const inventory = user?.inventory || [];

    if (caseData?.eventType && caseData?.eventId) {
      const isHasCase = inventory.some(
        (item) =>
          item.eventId === caseData?.eventId &&
          item.type === "case" &&
          item.eventType === caseData?.eventType,
      );
      const isHasKey = inventory.some(
        (item) => item.caseId === caseData?.id && item.type === "key",
      );
      return isHasCase && isHasKey;
    } else {
      return inventory.some((item) => item.id === parseInt(id) && item.type === "case");
    }
  }, [user?.inventory, caseData, id]);

  // Подсчет количества кейсов у пользователя
  const caseCount = useMemo(() => {
    const inventory = user?.inventory || [];

    if (caseData?.eventType && caseData?.eventId) {
      // Для лимитированных кейсов считаем по eventId и eventType
      return inventory.filter(
        (item) =>
          item.eventId === caseData?.eventId &&
          item.type === "case" &&
          item.eventType === caseData?.eventType,
      ).length;
    } else {
      // Для обычных кейсов считаем по id
      return inventory.filter((item) => item.id === parseInt(id) && item.type === "case")
        .length;
    }
  }, [user?.inventory, caseData, id]);

  // Эффекты для горизонтальной анимации
  useEffect(() => {
    if (!arrayWithWinningItem.length) return;
    const timer = setTimeout(() => {
      const itemWidth = window.innerWidth; // Ширина экрана
      const targetIndex = arrayWithWinningItem.length - 1;
      const calculatedOffset = targetIndex * itemWidth;
      setOffset(calculatedOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [arrayWithWinningItem]);

  useEffect(() => {
    if (offset > 0) {
      const timer = setTimeout(() => {
        setIsAnimationEnd(true);
        setShowZoomAnimation(true);
        playPrize();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [offset]);

  // Мутация для покупки кейса
  const buyCaseMutation = useMutation(
    trpc.cases.buyCase.mutationOptions({
      onSuccess: () => {
        queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
          const currentInventory = old.inventory || [];

          if (caseData?.eventType && caseData?.eventId) {
            return {
              ...old,
              balance: old.balance - (caseData?.price ?? 0),
              inventory: [
                ...currentInventory,
                {
                  type: "case",
                  eventId: caseData?.eventId,
                  eventType: caseData?.eventType,
                },
              ],
            };
          } else {
            return {
              ...old,
              balance: old.balance - (caseData?.price ?? 0),
              inventory: [...currentInventory, { type: "case", id: parseInt(id) }],
            };
          }
        });
        toast.success("Вы успешно купили кейс");
      },
    }),
  );

  // Функция для создания массива предметов для анимации
  const createAnimationItems = (winningItem: any, caseItems: any[]) => {
    const items = [];

    // Добавляем случайные предметы из кейса (больше для непрерывной анимации)
    for (let i = 0; i < 25; i++) {
      const randomItem = caseItems[Math.floor(Math.random() * caseItems.length)];
      items.push({
        name: randomItem.type,
        price: randomItem.value,
        rarity: randomItem.rarity || "default", // Устанавливаем default если rarity отсутствует
        image: "/fallback.png", // Заглушка для изображения
        id: Date.now() + i,
        isWinning: false,
      });
    }

    // Заменяем последний предмет на выигрышный
    items[items.length - 1] = {
      ...winningItem,
      rarity: winningItem.rarity || "default", // Устанавливаем default если rarity отсутствует
      isWinning: true,
    };

    return items;
  };

  // Мутация для открытия кейса
  const openCaseMutation = useMutation(
    trpc.cases.openCase.mutationOptions({
      onSuccess: (data: any) => {
        // Создаем выигрышный предмет
        const winningItem = {
          name: data.reward.type,
          price: data.reward.value,
          rarity: data.reward.rarity,
          image: "/fallback.png", // Заглушка для изображения
          id: data.reward.id,
        };

        // Создаем массив для анимации
        const animationItems = createAnimationItems(winningItem, caseData?.items || []);

        setIsOpening(true);
        play();
        setArrayWithWinningItem(animationItems);
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
      },
      onError: (error) => {
        toast.error("Не удалось открыть кейс");
      },
    }),
  );

  const handleBuyCase = (
    eventId: number | null,
    eventType: string | null,
    caseData: any,
  ) => {
    console.log(caseData);
    if (user && user.balance && user.balance >= 500) {
      console.log(eventId, eventType);
      buyCaseMutation.mutate({ caseId: parseInt(id), eventId, eventType });
    } else {
      alert("Недостаточно средств!");
    }
  };

  const handleOpenCase = (eventId: number | null, eventType: string | null) => {
    openCaseMutation.mutate({ caseId: parseInt(id), eventId, eventType });
  };

  const resetAnimation = () => {
    setIsAnimationEnd(false);
    setArrayWithWinningItem([]);
    setOffset(0);
    setIsOpening(false);
    setShowZoomAnimation(false);
  };

  // Функции для модалки наград
  const openRewardModal = (reward: any) => {
    setSelectedReward(reward);
    setIsRewardModalOpen(true);
  };

  const closeRewardModal = () => {
    setIsRewardModalOpen(false);
    setSelectedReward(null);
  };

  const winningItem = arrayWithWinningItem[arrayWithWinningItem.length - 1];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Кейс не найден</p>
          <button
            onClick={() => navigate({ to: "/shop" })}
            className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-white"
          >
            Вернуться в магазин
          </button>
        </div>
      </div>
    );
  }

  const canAfford = user && user.balance && user.balance >= (caseData.price ?? 0);

  // Если идет анимация открытия кейса
  if (isOpening) {
    return (
      <div className="flex h-full flex-col items-center justify-center overflow-hidden">
        <div className="relative h-full w-full">
          {/* Стрелки для горизонтальной анимации */}
          {/* <div className="absolute top-1/2 left-2 z-10 -translate-y-1/2 transform">
            <div className="h-0 w-0 border-t-[20px] border-b-[20px] border-l-[30px] border-t-transparent border-r-red-500 border-b-transparent"></div>
          </div>

          <div className="absolute top-1/2 right-2 z-10 -translate-y-1/2 transform">
            <div className="h-0 w-0 border-t-[20px] border-r-[30px] border-b-[20px] border-t-transparent border-b-transparent border-l-red-500"></div>
          </div> */}

          <div className="h-[100vh] overflow-hidden">
            <div
              className="flex flex-row items-center"
              style={{
                transform: `translateX(-${offset}px)`,
                transition: "transform 4s ease-out",
                width: `${arrayWithWinningItem.length * window.innerWidth}px`,
              }}
            >
              {arrayWithWinningItem?.map((item, index) => {
                const rarityStyles = getRarityStyles(item.rarity || "default");
                return (
                  <div
                    key={index}
                    className="flex h-[100vh] w-screen flex-shrink-0 flex-col items-center justify-center gap-6 px-8"
                  >
                    <div className="relative h-50 w-50">
                      <div
                        className={`flex aspect-square w-full items-center justify-center rounded-lg bg-gradient-to-br ${rarityStyles.gradient} shadow-lg`}
                      >
                        <div className="flex aspect-square w-full items-center justify-center rounded-md bg-white/10 backdrop-blur-sm">
                          <Gift className="h-30 w-30 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="mb-2 text-2xl font-bold text-black">
                        {item.name === "point" ? "Поинты" : item.name}
                      </div>
                      <div className={`text-xl font-semibold ${rarityStyles.textColor}`}>
                        {item.price}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {isAnimationEnd && winningItem && (
              <motion.div
                className="bg-opacity-90 absolute top-0 right-0 bottom-0 left-0 z-10 mx-auto flex w-full items-center justify-center bg-white px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex w-full flex-col items-center justify-center gap-6 p-8">
                  {/* Выигрышный предмет в стилистике приложения */}
                  <motion.div
                    className="relative w-full"
                    initial={{ scale: 0.5, opacity: 0, y: 100 }}
                    animate={{
                      scale: showZoomAnimation ? 1.2 : 1,
                      opacity: 1,
                      y: showZoomAnimation ? -50 : 0,
                      rotateY: showZoomAnimation ? 360 : 0,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: "easeOut",
                      scale: { delay: 0.2, duration: 0.6 },
                      y: { delay: 0.2, duration: 0.6 },
                      rotateY: { delay: 0.4, duration: 0.8 },
                    }}
                  >
                    {(() => {
                      const rarityStyles = getRarityStyles(
                        winningItem.rarity || "default",
                      );
                      return (
                        <div
                          className={`flex aspect-square w-full items-center justify-center rounded-3xl bg-gradient-to-br ${rarityStyles.gradient} shadow-2xl`}
                        >
                          <motion.div
                            className="flex aspect-square w-full items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm"
                            animate={{
                              boxShadow: showZoomAnimation
                                ? [
                                    "0 0 0 0 rgba(153, 36, 255, 0.7)",
                                    "0 0 0 20px rgba(153, 36, 255, 0)",
                                    "0 0 0 0 rgba(153, 36, 255, 0)",
                                  ]
                                : "0 0 0 0 rgba(153, 36, 255, 0)",
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: showZoomAnimation ? Infinity : 0,
                              repeatDelay: 0.5,
                            }}
                          >
                            <motion.div
                              animate={{
                                scale: showZoomAnimation ? [1, 1.1, 1] : 1,
                                rotate: showZoomAnimation ? [0, 5, -5, 0] : 0,
                              }}
                              transition={{
                                duration: 0.6,
                                repeat: showZoomAnimation ? Infinity : 0,
                                repeatDelay: 1,
                              }}
                            >
                              <Gift className="h-40 w-40 text-white" />
                            </motion.div>
                          </motion.div>
                        </div>
                      );
                    })()}
                  </motion.div>

                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <div className="mb-2 text-5xl font-bold text-black">
                      {winningItem.name === "point" ? "Поинты" : winningItem.name}
                    </div>
                    {(() => {
                      const rarityStyles = getRarityStyles(
                        winningItem.rarity || "default",
                      );
                      return (
                        <motion.div
                          className={`text-3xl font-semibold ${rarityStyles.textColor}`}
                          animate={{
                            scale: showZoomAnimation ? [1, 1.1, 1] : 1,
                            color: showZoomAnimation
                              ? ["#fbbf24", "#f59e0b", "#fbbf24"]
                              : undefined,
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: showZoomAnimation ? Infinity : 0,
                            repeatDelay: 0.5,
                          }}
                        >
                          {winningItem.price}
                        </motion.div>
                      );
                    })()}
                  </motion.div>

                  <motion.div
                    className="fixed right-0 bottom-0 left-0 flex w-full max-w-md flex-col gap-3 p-4"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <motion.button
                      onClick={() => {
                        resetAnimation();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9924FF] to-[#7C1ED9] px-6 py-3 text-center text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Закрыть
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Reward Modal Component
  const RewardModal = () => {
    if (!selectedReward) return null;

    const rarityStyles = getRarityStyles(selectedReward.rarity || "default");

    return (
      <AnimatePresence>
        {isRewardModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRewardModal}
          >
            <motion.div
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeRewardModal}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Reward Content */}
              <div className="flex flex-col items-center gap-6">
                {/* Reward Icon */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                >
                  <div
                    className={`flex aspect-square w-32 items-center justify-center rounded-2xl bg-gradient-to-br ${rarityStyles.gradient} shadow-xl`}
                  >
                    <motion.div
                      className="flex aspect-square w-full items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm"
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(153, 36, 255, 0.7)",
                          "0 0 0 20px rgba(153, 36, 255, 0)",
                          "0 0 0 0 rgba(153, 36, 255, 0)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      <Gift className="h-16 w-16 text-white" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Reward Info */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">
                    {selectedReward.type === "point" ? "Поинты" : selectedReward.type}
                  </h3>
                  <div className={`text-3xl font-bold ${rarityStyles.textColor}`}>
                    {selectedReward.value}
                  </div>
                </motion.div>

                {/* Rarity Badge */}
                <motion.div
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${rarityStyles.bgColor} text-white`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  {selectedReward.rarity === "common"
                    ? "ОБЫЧНЫЙ"
                    : selectedReward.rarity === "rare"
                      ? "РЕДКИЙ"
                      : selectedReward.rarity === "epic"
                        ? "ЭПИЧЕСКИЙ"
                        : selectedReward.rarity === "bronze"
                          ? "БРОНЗОВЫЙ"
                          : selectedReward.rarity === "silver"
                            ? "СЕРЕБРЯНЫЙ"
                            : selectedReward.rarity === "gold"
                              ? "ЗОЛОТОЙ"
                              : "ОБЫЧНЫЙ"}
                </motion.div>

                {/* Description */}
                <motion.p
                  className="text-center text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  {selectedReward.type === "point"
                    ? "Виртуальная валюта для покупок в магазине"
                    : "Уникальная награда из кейса"}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen w-full overflow-y-auto bg-white px-4 pb-32 data-[mobile=true]:pt-40"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => window.history.back()}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-center text-base font-bold text-gray-800">
          {caseData.name || "Кейс"}
        </h1>
        <button className="flex h-6 w-6 items-center justify-center"></button>
      </div>

      {/* Case Image */}
      <div className="">
        <div className="relative overflow-hidden rounded-2xl bg-gray-100">
          {caseData.photo ? (
            <img
              src={
                caseData.photo.startsWith("/")
                  ? caseData.photo
                  : getImageUrl(caseData.photo)
              }
              alt={caseData.name || "Кейс"}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600">
              <ShoppingBag className="h-16 w-16 text-white" />
            </div>
          )}

          <div className="absolute right-4 bottom-4 flex flex-col items-center">
            {caseCount > 0 && (
              <div className="mt-1 flex items-center gap-1 rounded-full bg-[#9924FF] px-2 py-1">
                <ShoppingBag className="h-3 w-3 text-white" />
                <span className="text-xs font-semibold text-white">
                  {caseCount} в инвентаре
                </span>
              </div>
            )}
          </div>

          {/* Rarity Badge */}
          <div className="absolute top-3 left-3">
            {(() => {
              const rarityStyles = getRarityStyles(caseData.rarity || "default");
              return (
                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${rarityStyles.bgColor} text-white shadow-lg`}
                >
                  {caseData.rarity === "common"
                    ? "ОБЫЧНЫЙ"
                    : caseData.rarity === "rare"
                      ? "РЕДКИЙ"
                      : caseData.rarity === "epic"
                        ? "ЭПИЧЕСКИЙ"
                        : "ОБЫЧНЫЙ"}
                </div>
              );
            })()}
          </div>

          {/* Limited/Regular Badge */}
          {caseData.eventId && caseData.eventType && (
            <div className="absolute top-3 right-3">
              {(() => {
                const caseType = getCaseType(caseData.eventId, caseData.eventType);
                return (
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${caseType?.bgColor} ${caseType?.textColor} shadow-lg`}
                  >
                    {caseType?.label}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Case Info */}
      <div className="pt-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          {caseData.name || "Неизвестный кейс"}
        </h2>
        <p className="mb-4 text-gray-600">
          {caseData.description || "Откройте кейс и получите уникальные награды"}
        </p>

        {/* Balance
        <div className="mb-6 rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-gray-900">Ваш баланс:</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {user?.balance || 0} монет
            </span>
          </div>
        </div> */}

        {/* Possible Rewards */}
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-bold text-gray-900">Возможные награды</h3>
          <div className="grid grid-cols-3 gap-3">
            {caseData?.items?.map((item, index) => {
              console.log("Case item:", item, "rarity:", item.rarity);
              const rarityStyles = getRarityStyles(item.rarity || "default");
              return (
                <motion.div
                  key={index}
                  className={`flex aspect-square w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br ${rarityStyles.gradient} border ${rarityStyles.borderColor} ${rarityStyles.shadowColor} cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                  onClick={() => openRewardModal(item)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Gift className="h-6 w-6 text-white" />
                  <span className="mt-1 text-xs font-medium text-white">
                    {item.type === "point" ? "Поинты" : item.type}
                  </span>
                  <span className="text-xs text-white">{item.value}</span>
                </motion.div>
              );
            }) ||
              // Fallback если нет предметов
              [1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="flex h-20 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100"
                >
                  <Gift className="h-6 w-6 text-purple-600" />
                  <span className="mt-1 text-xs font-medium text-gray-700">
                    Награда {item}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed right-0 bottom-0 left-0 space-y-3 bg-white px-4 py-3">
          {canAfford ? (
            <>
              <button
                onClick={() =>
                  handleBuyCase(caseData.eventId, caseData.eventType, caseData)
                }
                disabled={buyCaseMutation.isPending}
                className="w-full rounded-xl bg-gradient-to-r from-[#9924FF] to-[#7C1ED9] px-6 py-3 text-lg font-semibold text-white transition-all duration-200 hover:from-[#7C1ED9] hover:to-[#5A1A9E] disabled:opacity-50"
              >
                {buyCaseMutation.isPending
                  ? "Покупка..."
                  : `Купить за ${caseData.price ?? 0} монет`}
              </button>

              {isHasAlready && (
                <button
                  onClick={() => handleOpenCase(caseData.eventId, caseData.eventType)}
                  disabled={openCaseMutation.isPending || isOpening}
                  className="w-full rounded-xl border-2 border-[#9924FF] px-6 py-3 text-lg font-semibold text-[#9924FF] transition-all duration-200 hover:bg-[#9924FF] hover:text-white disabled:opacity-50"
                >
                  {openCaseMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Открываем...
                    </div>
                  ) : (
                    "Открыть кейс"
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="text-center">
              <p className="mb-3 text-gray-600">Недостаточно средств для покупки</p>
              <button
                onClick={() => navigate({ to: "/shop" })}
                className="rounded-xl bg-gray-200 px-6 py-4 text-lg font-semibold text-gray-600"
              >
                Пополнить баланс
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reward Modal */}
      <RewardModal />
    </div>
  );
}
