/**
 * Функция для получения случайного предмета из кейса
 *
 * Использует систему весов для определения вероятности выпадения предметов:
 * - Более дорогие предметы имеют меньшую вероятность выпадения
 * - Предметы дешевле кейса получают бонус к вероятности
 * - Используется инверсная квадратичная зависимость от цены
 *
 * @param caseId - ID кейса в базе данных
 * @param userId - ID пользователя
 * @returns Объект с информацией о выпавшем предмете или null при ошибке
 */

import { eq } from "drizzle-orm";
import { db } from "~/db";
import { casesTable, usersTable } from "~/db/schema";

const CHEAP_BOOST = 2.2; // множитель для вещей дешевле кейса
const EPS = 1; // чтобы не делить на ноль

export const getItem = async (caseId: number, userId: number) => {
  // 1. Проверяем пользователя
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) return null;

  // 2. Получаем предметы выбранного кейса из базы данных
  const currentCase = await db.query.casesTable.findFirst({
    where: eq(casesTable.id, caseId),
  });
  if (!currentCase || !currentCase.items || currentCase.items.length === 0) return null;

  const { items: caseItems, price: casePrice } = currentCase;

  // 3. Считаем веса
  const itemsWithWeights = caseItems.map(
    (item: { type: string; value: number | string }) => {
      // Преобразуем value в число для расчета веса
      const itemValue =
        typeof item.value === "number" ? item.value : parseInt(String(item.value)) || 0;

      // Инверсная квадратичная зависимость от цены
      let weight = 1 / Math.pow(itemValue + EPS, 2);

      // Усиливаем, если предмет дешевле кейса
      if (itemValue < (casePrice || 0)) weight *= CHEAP_BOOST;

      return { ...item, weight, value: itemValue };
    },
  );

  // 4. Рулетка по суммарному весу
  const totalWeight = itemsWithWeights.reduce((sum: number, i: any) => sum + i.weight, 0);
  const roll = Math.random() * totalWeight;

  let acc = 0;
  for (const item of itemsWithWeights) {
    acc += item.weight;
    if (roll <= acc) {
      return {
        type: item.type,
        value: item.value,
        caseId: caseId,
        id: Date.now(),
        isActive: true,
      };
    }
  }
};
