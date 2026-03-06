ALTER TABLE "users" ADD COLUMN "is_face_verified" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "face_verified_at" timestamp;
ALTER TABLE "users" ADD COLUMN "rekognition_face_id" varchar(255);
ALTER TABLE "users" ADD CONSTRAINT "users_rekognition_face_id_unique" UNIQUE("rekognition_face_id");

CREATE TABLE "face_verification_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"status" varchar(64) NOT NULL,
	"reason" varchar(255),
	"similarity" integer,
	"similar_user_id" bigint,
	"matched_face_id" varchar(255),
	"created_at" timestamp DEFAULT now()
);

CREATE INDEX "face_verification_attempts_user_id_idx" ON "face_verification_attempts" USING btree ("user_id");
