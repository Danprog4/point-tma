export const convertToBase64 = (file: File): Promise<string> => {
  console.log("🔄 convertToBase64 starting");
  console.log("🔄 file name:", file.name);
  console.log("🔄 file type:", file.type);
  console.log("🔄 file size:", file.size);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      console.log("✅ FileReader onload triggered");
      console.log("✅ reader.result type:", typeof reader.result);
      if (typeof reader.result === "string") {
        console.log("✅ result head:", reader.result.slice(0, 100));
        console.log("✅ result length:", reader.result.length);
        console.log("✅ starts with data:?", reader.result.startsWith("data:"));
        resolve(reader.result);
      } else {
        console.log("❌ reader.result is not string:", reader.result);
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => {
      console.log("❌ FileReader error:", error);
      reject(error);
    };
  });
};
