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
  const match = data.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid Base64 image - regex pattern failed");
  }
  const [, mime, b64] = match;
  const id = uuidv4();

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
