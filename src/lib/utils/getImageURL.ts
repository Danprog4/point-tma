export function getImageUrl(imageId: string) {
  const bucketUrl = import.meta.env.VITE_BUCKET_PUBLIC_URL;
  const result = `${bucketUrl}/${imageId}`;
  return result;
}
