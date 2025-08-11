import { User } from "~/db/schema";
import { getImageUrl } from "./getImageURL";

export const getImage = (user: User, mainPhoto: string) => {
  const img = mainPhoto
    ? getImageUrl(mainPhoto)
    : user?.photo
      ? getImageUrl(user?.photo)
      : user?.photoUrl || (user?.sex === "male" ? "/men.jpeg" : "/women.jpeg");
  return img;
};
