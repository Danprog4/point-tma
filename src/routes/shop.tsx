import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Coins, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/shop")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cases } = useQuery(trpc.cases.getCases.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const isMobile = usePlatform();

  // Мутация для покупки кейса
  const buyCaseMutation = useMutation(
    trpc.cases.buyCase.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
        toast.success("Вы успешно купили кейс");
      },
    }),
  );

  const handleBuyCase = (caseId: number, price: number) => {
    if (user && user.balance && user.balance >= price) {
      buyCaseMutation.mutate({ caseId });
    } else {
      alert("Недостаточно средств!");
    }
  };

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen w-full overflow-y-auto bg-white px-4 pb-24 data-[mobile=true]:pt-40"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-center text-base font-bold text-gray-800">Магазин</h1>
        <button className="flex h-6 w-6 items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-transparent" />
        </button>
      </div>

      {/* Balance Section */}
      <div className="pb-4">
        <div className="rounded-2xl bg-gradient-to-r from-[#9924FF] to-[#7C1ED9] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ваш баланс</h2>
              <div className="mt-2 flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-400" />
                <span className="text-2xl font-bold">{user?.balance || 0}</span>
                <span className="text-sm opacity-80">поинтов</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">Уровень</div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-lg font-bold">1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="pb-4">
        <div className="scrollbar-hidden flex gap-3 overflow-x-auto">
          {["Все", "Кейсы"].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-[#9924FF] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Grid */}

      <h3 className="mb-4 text-lg font-bold text-gray-900">Популярные кейсы</h3>
      <div className="grid grid-cols-2 gap-4">
        {cases?.map((caseItem) => {
          const price = 500; // Базовая цена кейса
          const canAfford = user && user?.balance && user?.balance >= price;

          return (
            <div
              key={caseItem.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-lg"
              onClick={() => navigate({ to: `/case/${caseItem.id}` })}
            >
              {/* Case Image */}
              <div className="relative h-32 overflow-hidden">
                {caseItem.photo ? (
                  <img
                    src={caseItem.photo}
                    alt={caseItem.name || "Кейс"}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600">
                    <ShoppingBag className="h-8 w-8 text-white" />
                  </div>
                )}

                {/* Price Badge
                <div className="absolute top-2 right-2 rounded-full bg-black/80 px-2 py-1">
                  <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs font-bold text-white">{price}</span>
                  </div>
                </div> */}
              </div>

              {/* Case Info */}
              <div className="p-4">
                <h4 className="mb-1 font-semibold text-gray-900">
                  {caseItem.name || "Неизвестный кейс"}
                </h4>
                <p className="mb-3 line-clamp-2 text-xs text-gray-500">
                  {caseItem.description || "Откройте кейс и получите уникальные награды"}
                </p>

                {/* Buy Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyCase(caseItem.id, price);
                  }}
                  disabled={!canAfford || buyCaseMutation.isPending}
                  className={`w-full rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
                    canAfford
                      ? "bg-gradient-to-r from-[#9924FF] to-[#7C1ED9] text-white hover:from-[#7C1ED9] hover:to-[#5A1A9E]"
                      : "cursor-not-allowed bg-gray-300 text-gray-500"
                  }`}
                >
                  {buyCaseMutation.isPending ? "Покупка..." : `Купить за ${price}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special Offers */}
      <div className="pt-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Специальные предложения</h3>
        <div className="space-y-3">
          {/* Daily Offer */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold">Ежедневный бонус</h4>
                <p className="text-sm opacity-90">Получите 50 поинтов бесплатно</p>
              </div>
              <button className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/30">
                Получить
              </button>
            </div>
          </div>

          {/* Weekly Pack */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold">Недельный набор</h4>
                <p className="text-sm opacity-90">3 кейса + 200 поинтов</p>
              </div>
              <button className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/30">
                Купить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
