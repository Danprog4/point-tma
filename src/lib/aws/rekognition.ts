import {
  CreateCollectionCommand,
  DeleteFacesCommand,
  IndexFacesCommand,
  RekognitionClient,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";

const DEFAULT_REGION = "us-east-1";
const DEFAULT_COLLECTION_ID = "point-face-verification";
const DEFAULT_DUPLICATE_THRESHOLD = 97;
const DEFAULT_MAX_DUPLICATE_MATCHES = 5;

export class RekognitionNoFaceDetectedError extends Error {
  constructor() {
    super("No face detected");
    this.name = "RekognitionNoFaceDetectedError";
  }
}

export type RekognitionFaceMatch = {
  faceId: string | null;
  externalImageId: string | null;
  similarity: number | null;
};

const readNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const region = process.env.AWS_REKOGNITION_REGION || process.env.AWS_REGION || DEFAULT_REGION;
const collectionId = process.env.AWS_REKOGNITION_COLLECTION_ID || DEFAULT_COLLECTION_ID;
const duplicateThreshold = readNumber(
  process.env.AWS_FACE_DUPLICATE_THRESHOLD,
  DEFAULT_DUPLICATE_THRESHOLD,
);
const maxDuplicateMatches = readNumber(
  process.env.AWS_FACE_MAX_DUPLICATE_MATCHES,
  DEFAULT_MAX_DUPLICATE_MATCHES,
);

const hasStaticCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const rekognition = new RekognitionClient({
  region,
  ...(hasStaticCredentials
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        },
      }
    : {}),
});

let ensureCollectionPromise: Promise<void> | null = null;

const parseBase64Image = (base64Image: string): Uint8Array => {
  const match = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid selfie format. Expected base64 data URL.");
  }
  const [, , rawBase64] = match;
  return Buffer.from(rawBase64, "base64");
};

const ensureCollection = async () => {
  if (ensureCollectionPromise) {
    return ensureCollectionPromise;
  }

  ensureCollectionPromise = (async () => {
    try {
      await rekognition.send(
        new CreateCollectionCommand({
          CollectionId: collectionId,
        }),
      );
    } catch (error) {
      if ((error as { name?: string })?.name === "ResourceAlreadyExistsException") {
        return;
      }
      ensureCollectionPromise = null;
      throw error;
    }
  })();

  return ensureCollectionPromise;
};

export const searchDuplicateFaces = async (base64Image: string): Promise<RekognitionFaceMatch[]> => {
  await ensureCollection();
  const bytes = parseBase64Image(base64Image);

  try {
    const result = await rekognition.send(
      new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: bytes },
        FaceMatchThreshold: duplicateThreshold,
        MaxFaces: maxDuplicateMatches,
        QualityFilter: "AUTO",
      }),
    );

    return (result.FaceMatches || []).map((match) => ({
      faceId: match.Face?.FaceId || null,
      externalImageId: match.Face?.ExternalImageId || null,
      similarity: match.Similarity ?? null,
    }));
  } catch (error) {
    if ((error as { name?: string })?.name === "InvalidParameterException") {
      throw new RekognitionNoFaceDetectedError();
    }
    throw error;
  }
};

export const indexFaceForUser = async (
  base64Image: string,
  externalImageId: string,
): Promise<string | null> => {
  await ensureCollection();
  const bytes = parseBase64Image(base64Image);

  const result = await rekognition.send(
    new IndexFacesCommand({
      CollectionId: collectionId,
      Image: { Bytes: bytes },
      ExternalImageId: externalImageId,
      MaxFaces: 1,
      QualityFilter: "AUTO",
      DetectionAttributes: [],
    }),
  );

  return result.FaceRecords?.[0]?.Face?.FaceId || null;
};

export const deleteFaceById = async (faceId: string): Promise<void> => {
  await ensureCollection();
  await rekognition.send(
    new DeleteFacesCommand({
      CollectionId: collectionId,
      FaceIds: [faceId],
    }),
  );
};
