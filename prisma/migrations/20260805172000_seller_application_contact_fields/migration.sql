ALTER TABLE "seller_profiles"
  ADD COLUMN "contact_name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "website_url" TEXT,
  ADD COLUMN "contact_email" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "business_service" TEXT NOT NULL DEFAULT '';

UPDATE "seller_profiles"
SET
  "contact_name" = COALESCE(NULLIF("contact_name", ''), "business_name"),
  "contact_email" = COALESCE(NULLIF("contact_email", ''), ''),
  "business_service" = COALESCE(NULLIF("business_service", ''), "product_summary");
