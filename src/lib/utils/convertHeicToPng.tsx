import convert from "heic-convert/browser";

export const convertHeicToPng = async (file: File): Promise<File> => {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = new Uint8Array(arrayBuffer);
  const outputBuffer = await convert({
    buffer: inputBuffer as unknown as ArrayBufferLike,
    format: "JPEG",
    quality: 0.2,
  });

  const blob = new Blob([outputBuffer], { type: "image/jpeg" });
  return new File([blob], file.name.replace(/\.heic$/i, ".jpg"), {
    type: "image/jpeg",
  });
};
