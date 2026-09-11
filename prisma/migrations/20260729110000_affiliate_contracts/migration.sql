CREATE TYPE "AffiliateContractStatus" AS ENUM ('DRAFT', 'GENERATED');

CREATE TABLE "affiliate_contracts" (
  "id" TEXT NOT NULL,
  "affiliate_id" TEXT NOT NULL,
  "contract_number" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "contract_email" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "position" TEXT,
  "citizen_id" TEXT NOT NULL,
  "citizen_id_issued_at" TIMESTAMP(3) NOT NULL,
  "citizen_id_issued_by" TEXT NOT NULL,
  "bank_name" TEXT NOT NULL,
  "bank_branch" TEXT,
  "bank_province" TEXT,
  "bank_account_number" TEXT NOT NULL,
  "bank_account_holder" TEXT NOT NULL,
  "citizen_id_front_data" TEXT NOT NULL,
  "citizen_id_back_data" TEXT NOT NULL,
  "signature_data" TEXT NOT NULL,
  "status" "AffiliateContractStatus" NOT NULL DEFAULT 'DRAFT',
  "generated_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "affiliate_contracts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "affiliate_contracts_affiliate_id_key" ON "affiliate_contracts"("affiliate_id");
CREATE UNIQUE INDEX "affiliate_contracts_contract_number_key" ON "affiliate_contracts"("contract_number");

ALTER TABLE "affiliate_contracts"
  ADD CONSTRAINT "affiliate_contracts_affiliate_id_fkey"
  FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
