CREATE TABLE "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"referrerId" bigint,
	"photoUrl" varchar(255),
	"name" varchar(255)
);
