import * as React from "react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { Coin } from "./Icons/Coin";

type MarketStatsData = {
  minPrice: number;
  maxPrice: number;
  totalBuyers: number;
  priceRangePerDay: Array<{
    day: string;
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    soldCount: number;
  }>;
};

const chartConfig = {
  avgPrice: {
    label: " Средняя цена",
    color: "hsl(142, 76%, 36%)", // green
  },
  soldCount: {
    label: " Продано",
    color: "hsl(217, 91%, 60%)", // blue
  },
  minPrice: {
    label: " Мин. цена",
    color: "hsl(0, 72%, 51%)", // red
  },
  maxPrice: {
    label: " Макс. цена",
    color: "hsl(25, 95%, 53%)", // orange
  },
} satisfies ChartConfig;

type MarketStatsChartProps = {
  data: MarketStatsData;
  title?: string;
  description?: string;
};

export function MarketStatsChart({
  data,
  title = "Статистика продаж",
  description,
}: MarketStatsChartProps) {
  const [activeMetric, setActiveMetric] = React.useState<
    "avgPrice" | "minPrice" | "maxPrice"
  >("avgPrice");

  const { priceRangePerDay, minPrice, maxPrice, totalBuyers } = data;

  // Проверяем есть ли хоть одна продажа за неделю
  const hasSales = priceRangePerDay.some((day) => day.soldCount > 0);

  if (!priceRangePerDay || priceRangePerDay.length === 0) {
    return null; // Не должно случиться, так как всегда 7 дней
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {hasSales
              ? description ||
                `Всего продано: ${totalBuyers} шт. | Диапазон: ${minPrice}-${maxPrice}P`
              : "Статистика за последние 7 дней (пока нет продаж)"}
          </CardDescription>
        </div>
        <div className="flex">
          {(["avgPrice", "minPrice", "maxPrice"] as const).map((key) => {
            const config = chartConfig[key];

            // Считаем среднюю цену только по дням с продажами
            const daysWithSales = priceRangePerDay.filter((d) => d.soldCount > 0);
            const totalValue =
              key === "avgPrice"
                ? daysWithSales.length > 0
                  ? Math.round(
                      daysWithSales.reduce((acc, curr) => acc + curr.avgPrice, 0) /
                        daysWithSales.length,
                    )
                  : 0
                : key === "minPrice"
                  ? minPrice
                  : maxPrice;

            return (
              <button
                key={key}
                data-active={activeMetric === key}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col items-center justify-center gap-1 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4"
                onClick={() => setActiveMetric(key)}
              >
                <span className="text-muted-foreground text-xs">{config.label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg leading-none font-bold sm:text-2xl">
                    {totalValue}
                  </span>
                  <Coin />
                </div>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-0 pb-4 sm:p-6 sm:pt-0">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <ComposedChart
            accessibilityLayer
            data={priceRangePerDay}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                const today = new Date().toISOString().split("T")[0];
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0];

                if (value === today) return "Сегодня";
                if (value === yesterday) return "Вчера";

                return date.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                });
              }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value} P`}
              domain={[0, "auto"]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value} шт`}
              domain={[0, "auto"]}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("ru-RU", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  formatter={(value, name) => {
                    if (name === "soldCount") {
                      return [`${value} шт`, chartConfig.soldCount.label];
                    }
                    return [
                      `${value} P`,
                      chartConfig[name as keyof typeof chartConfig].label,
                    ];
                  }}
                />
              }
            />
            {/* Столбцы - выбранная метрика цены */}
            <Bar
              yAxisId="left"
              dataKey={activeMetric}
              fill={`var(--color-${activeMetric})`}
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
            {/* Линия - количество продаж */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="soldCount"
              stroke="var(--color-soldCount)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
