export const isHeicFile = (file: File): boolean => {
  const ext = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return (
    ext.endsWith(".heic") ||
    ext.endsWith(".heif") ||
    mime === "image/heic" ||
    mime === "image/heif"
  );
};
