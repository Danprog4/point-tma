import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Gift, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/case/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: caseData, isLoading } = useQuery(
    trpc.cases.getCase.queryOptions({ id: parseInt(id) }),
  );
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [isOpening, setIsOpening] = useState(false);
  const isMobile = usePlatform();

  const isHasAlready = user?.inventory?.some(
    (item) => item.eventId === parseInt(id) && item.type === "case",
  );

  // Мутация для покупки кейса
  const buyCaseMutation = useMutation(trpc.cases.buyCase.mutationOptions());

  // Мутация для открытия кейса
  const openCaseMutation = useMutation({
    ...trpc.cases.openCase.mutationOptions(),
    onSuccess: () => {
      setIsOpening(false);
      // Показать результат открытия
    },
  });

  const handleBuyCase = () => {
    if (user && user.balance && user.balance >= 500) {
      buyCaseMutation.mutate({ caseId: parseInt(id) });
      queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
    } else {
      alert("Недостаточно средств!");
    }
  };

  const handleOpenCase = () => {
    setIsOpening(true);
    openCaseMutation.mutate({ caseId: parseInt(id) });
  };

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

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full max-w-sm bg-white pb-24 data-[mobile=true]:pt-40"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/shop" })}
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
              src={caseData.photo}
              alt={caseData.name || "Кейс"}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600">
              <ShoppingBag className="h-16 w-16 text-white" />
            </div>
          )}

          {/* Price Badge
          <div className="absolute top-4 right-4 rounded-full bg-black/80 px-3 py-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-bold text-white">{caseData.price ?? 0}</span>
            </div>
          </div> */}

          {/* Rarity Badge */}
          <div className="absolute top-4 left-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2">
            <span className="text-sm font-bold text-white">Редкий</span>
          </div>
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
            {[1, 2, 3, 4, 5, 6].map((item) => (
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
        <div className="fixed right-0 bottom-0 left-0 space-y-3 bg-white px-4 py-4">
          {canAfford ? (
            <>
              <button
                onClick={handleBuyCase}
                disabled={buyCaseMutation.isPending}
                className="w-full rounded-xl bg-gradient-to-r from-[#9924FF] to-[#7C1ED9] px-6 py-4 text-lg font-semibold text-white transition-all duration-200 hover:from-[#7C1ED9] hover:to-[#5A1A9E] disabled:opacity-50"
              >
                {buyCaseMutation.isPending
                  ? "Покупка..."
                  : `Купить за ${caseData.price ?? 0} монет`}
              </button>

              {isHasAlready && (
                <button
                  onClick={handleOpenCase}
                  disabled={openCaseMutation.isPending || isOpening}
                  className="w-full rounded-xl border-2 border-[#9924FF] px-6 py-4 text-lg font-semibold text-[#9924FF] transition-all duration-200 hover:bg-[#9924FF] hover:text-white disabled:opacity-50"
                >
                  {isOpening ? "Открываем..." : "Открыть кейс"}
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
    </div>
  );
}
