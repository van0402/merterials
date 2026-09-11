ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);

UPDATE "users"
SET "email_verified_at" = COALESCE("created_at", NOW())
WHERE "email_verified_at" IS NULL;
