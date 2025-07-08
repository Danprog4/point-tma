export function getImageUrl(imageId: string) {
  return `${import.meta.env.VITE_BUCKET_PUBLIC_URL}/${imageId}`;
}
