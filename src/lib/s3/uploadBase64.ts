import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadBase64Image(data: string): Promise<string> {
  console.log("📸 uploadBase64Image called");
  console.log("📸 data head:", data?.slice(0, 100));
  console.log("📸 data length:", data?.length);
  console.log("📸 data type:", typeof data);
  console.log("📸 starts with data:image/?", data?.startsWith("data:image/"));
  const match = data.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!match) {
    console.log("❌ REGEX FAILED - no match found");
    console.log("❌ Full data:", data);
    throw new Error("Invalid Base64 image - regex pattern failed");
  }
  console.log("✅ Regex matched successfully");
  const [, mime, b64] = match;
  console.log("📸 Extracted MIME:", mime);
  console.log("📸 Base64 data length:", b64?.length);
  const id = uuidv4();
  console.log("📸 Generated UUID:", id);

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: id,
      Body: Buffer.from(b64, "base64"),
      ContentType: mime,
      ACL: "public-read",
    }),
  );

  return id;
}
