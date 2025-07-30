import convert from "heic-convert/browser";

export const convertHeicToPng = async (file: File): Promise<File> => {
  console.log("🔄 convertHeicToPng starting");
  console.log("🔄 input file:", file.name, file.type, file.size);
  const arrayBuffer = await file.arrayBuffer();
  console.log("🔄 arrayBuffer size:", arrayBuffer.byteLength);
  const inputBuffer = new Uint8Array(arrayBuffer);
  console.log("🔄 inputBuffer length:", inputBuffer.length);
  const outputBuffer = await convert({
    buffer: inputBuffer as unknown as ArrayBufferLike,
    format: "PNG",
    quality: 0.2,
  });
  console.log("✅ HEIC convert done, output size:", outputBuffer.byteLength);
  const blob = new Blob([outputBuffer], { type: "image/png" });
  console.log("✅ Blob created, size:", blob.size, "type:", blob.type);
  const newFileName = file.name.replace(/\.heic$/i, ".png");
  const newFile = new File([blob], newFileName, {
    type: "image/png",
  });
  console.log("✅ New File created:", newFile.name, newFile.type, newFile.size);
  return newFile;
};
