ALTER TABLE "User"
  ADD COLUMN "securityGeneration" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "passwordMutationPending" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Session"
  ADD COLUMN "securityGeneration" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "User"
  ADD CONSTRAINT "User_securityGeneration_nonnegative" CHECK ("securityGeneration" >= 0);

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_securityGeneration_nonnegative" CHECK ("securityGeneration" >= 0);
