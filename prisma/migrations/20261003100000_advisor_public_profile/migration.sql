ALTER TABLE "AdvisorProfile"
  ADD COLUMN "publicSlug" TEXT,
  ADD COLUMN "aboutText" TEXT,
  ADD COLUMN "publicEmail" TEXT,
  ADD COLUMN "publicPhone" TEXT,
  ADD COLUMN "publicWebsite" TEXT,
  ADD COLUMN "publicAddress" TEXT,
  ADD COLUMN "accentColor" TEXT,
  ADD COLUMN "showDvagPartners" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "digitalCardEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "AdvisorProfile_publicSlug_key"
  ON "AdvisorProfile"("publicSlug");
