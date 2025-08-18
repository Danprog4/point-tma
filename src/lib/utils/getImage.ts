import { User } from "~/db/schema";
import { getImageUrl } from "./getImageURL";

export const getImage = (user: User, mainPhoto: string) => {
  // Check if mainPhoto is a valid non-empty string
  const hasValidMainPhoto = mainPhoto && mainPhoto.trim() !== "";
  // Check if user.photo is a valid non-empty string
  const hasValidUserPhoto = user?.photo && user?.photo.trim() !== "";

  let img: string;

  if (hasValidMainPhoto) {
    img = getImageUrl(mainPhoto.trim());
  } else if (hasValidUserPhoto) {
    img = getImageUrl(user?.photo!.trim());
  } else if (user?.photoUrl && user.photoUrl.trim() !== "") {
    img = user.photoUrl.trim();
  } else {
    // Default fallback image
    img = user?.sex === "male" ? "/men.jpeg" : "/women.jpeg";
  }

  // Debug info removed for cleaner console

  return img;
};
