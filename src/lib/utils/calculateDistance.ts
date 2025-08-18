/**
 * Вычисляет расстояние между двумя точками используя формулу Haversine
 * @param lat1 Широта первой точки
 * @param lon1 Долгота первой точки
 * @param lat2 Широта второй точки
 * @param lon2 Долгота второй точки
 * @returns Расстояние в километрах
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Радиус Земли в километрах
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10; // Округляем до 1 знака после запятой
}

/**
 * Конвертирует градусы в радианы
 */
function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Форматирует расстояние для отображения
 * @param distance Расстояние в километрах
 * @returns Отформатированная строка
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} м`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} км`;
  } else {
    return `${Math.round(distance)} км`;
  }
}

/**
 * Вычисляет расстояние между координатами в формате [lng, lat]
 * @param coords1 Координаты в формате [долгота, широта]
 * @param coords2 Координаты в формате [долгота, широта]
 * @returns Расстояние в километрах
 */
export function calculateDistanceFromCoords(
  coords1: [number, number],
  coords2: [number, number],
): number {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  return calculateDistance(lat1, lon1, lat2, lon2);
}
