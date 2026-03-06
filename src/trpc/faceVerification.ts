import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { faceVerificationAttemptsTable, usersTable } from "~/db/schema";
import {
  deleteFaceById,
  indexFaceForUser,
  RekognitionNoFaceDetectedError,
  searchDuplicateFaces,
} from "~/lib/aws/rekognition";
import { procedure } from "./init";

export const faceVerificationRouter = {
  getStatus: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
      columns: {
        isFaceVerified: true,
        faceVerifiedAt: true,
        rekognitionFaceId: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const latestAttempt = await db.query.faceVerificationAttemptsTable.findFirst({
      where: eq(faceVerificationAttemptsTable.userId, ctx.userId),
      orderBy: [desc(faceVerificationAttemptsTable.id)],
    });

    return {
      isFaceVerified: Boolean(user.isFaceVerified),
      faceVerifiedAt: user.faceVerifiedAt ?? null,
      latestAttempt: latestAttempt
        ? {
            status: latestAttempt.status,
            reason: latestAttempt.reason,
            similarity: latestAttempt.similarity,
            similarUserId: latestAttempt.similarUserId,
            createdAt: latestAttempt.createdAt,
          }
        : null,
    };
  }),

  submitSelfie: procedure
    .input(
      z.object({
        selfie: z.string().min(32),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (user.isFaceVerified) {
        return {
          verified: true,
          status: "already_verified" as const,
        };
      }

      let matches;
      try {
        matches = await searchDuplicateFaces(input.selfie);
      } catch (error) {
        if (error instanceof RekognitionNoFaceDetectedError) {
          await db.insert(faceVerificationAttemptsTable).values({
            userId: ctx.userId,
            status: "rejected_no_face",
            reason: "no_face_detected",
          });

          return {
            verified: false,
            status: "rejected_no_face" as const,
          };
        }

        await db.insert(faceVerificationAttemptsTable).values({
          userId: ctx.userId,
          status: "failed",
          reason: "rekognition_search_failed",
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Face verification failed. Try again later.",
        });
      }

      const duplicateMatch = matches
        .filter((match) => {
          const externalUserId = match.externalImageId ? Number(match.externalImageId) : null;
          const isSameByExternalId = externalUserId === ctx.userId;
          const isSameByFaceId =
            Boolean(user.rekognitionFaceId) && user.rekognitionFaceId === match.faceId;
          return !isSameByExternalId && !isSameByFaceId;
        })
        .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))[0];

      if (duplicateMatch) {
        let similarUserId: number | null = null;
        if (
          duplicateMatch.externalImageId &&
          /^\d+$/.test(duplicateMatch.externalImageId)
        ) {
          similarUserId = Number(duplicateMatch.externalImageId);
        } else if (duplicateMatch.faceId) {
          const similarUser = await db.query.usersTable.findFirst({
            where: eq(usersTable.rekognitionFaceId, duplicateMatch.faceId),
            columns: { id: true },
          });
          similarUserId = similarUser?.id ?? null;
        }

        await db.insert(faceVerificationAttemptsTable).values({
          userId: ctx.userId,
          status: "rejected_duplicate",
          reason: "duplicate_face",
          similarity: Math.round(duplicateMatch.similarity ?? 0),
          similarUserId,
          matchedFaceId: duplicateMatch.faceId,
        });

        return {
          verified: false,
          status: "rejected_duplicate" as const,
          similarity: duplicateMatch.similarity ?? null,
          similarUserId,
        };
      }

      let indexedFaceId: string | null = null;
      try {
        if (user.rekognitionFaceId) {
          await deleteFaceById(user.rekognitionFaceId);
        }

        indexedFaceId = await indexFaceForUser(input.selfie, String(ctx.userId));
      } catch {
        await db.insert(faceVerificationAttemptsTable).values({
          userId: ctx.userId,
          status: "failed",
          reason: "rekognition_index_failed",
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Face verification failed. Try again later.",
        });
      }

      if (!indexedFaceId) {
        await db.insert(faceVerificationAttemptsTable).values({
          userId: ctx.userId,
          status: "rejected_no_face",
          reason: "index_face_not_found",
        });

        return {
          verified: false,
          status: "rejected_no_face" as const,
        };
      }

      const verifiedAt = new Date();
      await db
        .update(usersTable)
        .set({
          isFaceVerified: true,
          faceVerifiedAt: verifiedAt,
          rekognitionFaceId: indexedFaceId,
        })
        .where(eq(usersTable.id, ctx.userId));

      await db.insert(faceVerificationAttemptsTable).values({
        userId: ctx.userId,
        status: "verified",
        reason: "ok",
        matchedFaceId: indexedFaceId,
      });

      return {
        verified: true,
        status: "verified" as const,
        verifiedAt,
      };
    }),
};
