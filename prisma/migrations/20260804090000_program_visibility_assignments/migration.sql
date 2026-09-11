-- Add public/private visibility and affiliate assignments for admin Programs.
CREATE TYPE "ProgramVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "AffiliateProgramStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REMOVED');

ALTER TABLE "programs"
ADD COLUMN "visibility" "ProgramVisibility" NOT NULL DEFAULT 'PUBLIC';

CREATE TABLE "affiliate_programs" (
  "id" TEXT NOT NULL,
  "affiliate_id" TEXT NOT NULL,
  "program_id" TEXT NOT NULL,
  "status" "AffiliateProgramStatus" NOT NULL DEFAULT 'PENDING',
  "assigned_by_admin" BOOLEAN NOT NULL DEFAULT false,
  "assigned_by" TEXT,
  "joined_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "affiliate_programs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "affiliate_programs_affiliate_id_program_id_key"
ON "affiliate_programs"("affiliate_id", "program_id");

CREATE INDEX "affiliate_programs_program_id_status_idx"
ON "affiliate_programs"("program_id", "status");

ALTER TABLE "affiliate_programs"
ADD CONSTRAINT "affiliate_programs_affiliate_id_fkey"
FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "affiliate_programs"
ADD CONSTRAINT "affiliate_programs_program_id_fkey"
FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
