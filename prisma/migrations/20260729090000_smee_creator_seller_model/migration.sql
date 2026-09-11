-- SMEE creator tiers, seller applications and idempotent money flows.
CREATE TYPE "CreatorType" AS ENUM ('KOL', 'KOC');
CREATE TYPE "PartnerTier" AS ENUM ('STANDARD', 'VIP', 'SVIP');
CREATE TYPE "SellerApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "AttributionMethod" AS ENUM ('REFERRAL_CODE', 'ATTRIBUTION_KEY', 'SELLER_DIRECT');
CREATE TYPE "CommissionSource" AS ENUM ('REFERRAL', 'SELLER');

ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'PAYOUT_PROCESSED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'COMMISSION_EARNED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'EMAIL_VERIFICATION';

ALTER TABLE "affiliates"
  ADD COLUMN "creator_type" "CreatorType" NOT NULL DEFAULT 'KOC',
  ADD COLUMN "tier" "PartnerTier" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "referral_rate_bps" INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN "completed_orders" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "ads_support_requested" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "personal_care_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "media_support_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "conversions"
  ADD COLUMN "external_id" TEXT,
  ADD COLUMN "idempotency_key" TEXT,
  ADD COLUMN "attribution_method" "AttributionMethod" NOT NULL DEFAULT 'REFERRAL_CODE',
  ADD COLUMN "attribution_id" TEXT,
  ADD COLUMN "seller_profile_id" TEXT,
  ADD COLUMN "product_id" TEXT,
  ADD COLUMN "platform_fee_bps" INTEGER,
  ADD COLUMN "platform_fee_cents" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "commissions"
  ADD COLUMN "rate_bps" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "source" "CommissionSource" NOT NULL DEFAULT 'REFERRAL';

ALTER TABLE "payouts" ADD COLUMN "idempotency_key" TEXT;
ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" DROP NOT NULL;
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_id_fkey";
ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "seller_profiles" (
  "id" TEXT NOT NULL,
  "affiliate_id" TEXT NOT NULL,
  "business_name" TEXT NOT NULL,
  "description" TEXT,
  "contact_phone" TEXT,
  "product_summary" TEXT NOT NULL,
  "status" "SellerApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "platform_fee_bps" INTEGER NOT NULL DEFAULT 2000,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "review_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
  "id" TEXT NOT NULL,
  "seller_profile_id" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attributions" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "affiliate_id" TEXT NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "referer" TEXT,
  "target_url" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refunds" (
  "id" TEXT NOT NULL,
  "conversion_id" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "maturation_runs" (
  "id" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "commission_count" INTEGER NOT NULL,
  "total_cents" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "maturation_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seller_profiles_affiliate_id_key" ON "seller_profiles"("affiliate_id");
CREATE INDEX "seller_profiles_status_idx" ON "seller_profiles"("status");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_seller_profile_id_idx" ON "products"("seller_profile_id");
CREATE UNIQUE INDEX "attributions_key_key" ON "attributions"("key");
CREATE INDEX "attributions_affiliate_id_idx" ON "attributions"("affiliate_id");
CREATE INDEX "attributions_expires_at_idx" ON "attributions"("expires_at");
CREATE UNIQUE INDEX "conversions_external_id_key" ON "conversions"("external_id");
CREATE UNIQUE INDEX "conversions_idempotency_key_key" ON "conversions"("idempotency_key");
CREATE INDEX "conversions_attribution_id_idx" ON "conversions"("attribution_id");
CREATE INDEX "conversions_seller_profile_id_idx" ON "conversions"("seller_profile_id");
CREATE INDEX "conversions_product_id_idx" ON "conversions"("product_id");
CREATE UNIQUE INDEX "payouts_idempotency_key_key" ON "payouts"("idempotency_key");
CREATE UNIQUE INDEX "refunds_external_id_key" ON "refunds"("external_id");
CREATE UNIQUE INDEX "refunds_idempotency_key_key" ON "refunds"("idempotency_key");
CREATE INDEX "refunds_conversion_id_idx" ON "refunds"("conversion_id");
CREATE UNIQUE INDEX "maturation_runs_idempotency_key_key" ON "maturation_runs"("idempotency_key");

ALTER TABLE "seller_profiles"
  ADD CONSTRAINT "seller_profiles_affiliate_id_fkey"
  FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products"
  ADD CONSTRAINT "products_seller_profile_id_fkey"
  FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attributions"
  ADD CONSTRAINT "attributions_affiliate_id_fkey"
  FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversions"
  ADD CONSTRAINT "conversions_attribution_id_fkey"
  FOREIGN KEY ("attribution_id") REFERENCES "attributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversions"
  ADD CONSTRAINT "conversions_seller_profile_id_fkey"
  FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversions"
  ADD CONSTRAINT "conversions_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refunds"
  ADD CONSTRAINT "refunds_conversion_id_fkey"
  FOREIGN KEY ("conversion_id") REFERENCES "conversions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
