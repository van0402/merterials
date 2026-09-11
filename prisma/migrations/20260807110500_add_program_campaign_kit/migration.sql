-- Add campaign-kit fields for admin-created affiliate programs.
ALTER TABLE "programs"
  ADD COLUMN "product_description" TEXT,
  ADD COLUMN "service_price" TEXT,
  ADD COLUMN "estimated_commission" TEXT,
  ADD COLUMN "campaign_assets" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "content_suggestions" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "support_url" TEXT,
  ADD COLUMN "support_label" TEXT;
