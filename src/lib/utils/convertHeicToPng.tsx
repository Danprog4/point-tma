import convert from "heic-convert/browser";

export const convertHeicToPng = async (file: File): Promise<File> => {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = new Uint8Array(arrayBuffer);
  const outputBuffer = await convert({
    buffer: inputBuffer as unknown as ArrayBufferLike,
    format: "PNG",
    quality: 0.2,
  });
  const blob = new Blob([outputBuffer], { type: "image/png" });
  const newFileName = file.name.replace(/\.heic$/i, ".png");
  const newFile = new File([blob], newFileName, {
    type: "image/png",
  });
  return newFile;
};
