export const getYMaspAdress = (coordinates: string) => {
  const [lon, lat] = coordinates.split(",");
  const zoom = 17;
  return `https://yandex.ru/maps/?pt=${lon},${lat}&z=${zoom}&l=map`;
};
