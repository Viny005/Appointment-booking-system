-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MeetingMode" AS ENUM ('IN_PERSON', 'PHONE', 'ONLINE');

-- CreateEnum
CREATE TYPE "MeetingModePolicy" AS ENUM ('FIXED', 'CLIENT_CHOICE');

-- CreateEnum
CREATE TYPE "PhoneDirection" AS ENUM ('ADVISOR_CALLS_CLIENT', 'CLIENT_CALLS_ADVISOR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canManageOwnServices" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AdvisorProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "shortDescription" TEXT NOT NULL DEFAULT '',
    "notificationEmail" TEXT NOT NULL DEFAULT '',
    "imageKey" TEXT,
    "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "advisorProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "meetingModePolicy" "MeetingModePolicy" NOT NULL,
    "allowedMeetingModes" "MeetingMode"[],
    "placeName" TEXT,
    "visitAddress" TEXT,
    "phoneDirection" "PhoneDirection" NOT NULL DEFAULT 'ADVISOR_CALLS_CLIENT',
    "advisorPhone" TEXT,
    "onlineUrl" TEXT,
    "onlineProvider" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileRelation" (
    "id" TEXT NOT NULL,
    "sourceProfileId" TEXT NOT NULL,
    "targetProfileId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "proposedToClient" BOOLEAN NOT NULL DEFAULT true,
    "defaultSelected" BOOLEAN NOT NULL DEFAULT false,
    "clientCanRemove" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorProfile_userId_key" ON "AdvisorProfile"("userId");

-- CreateIndex
CREATE INDEX "AdvisorProfile_status_idx" ON "AdvisorProfile"("status");

-- CreateIndex
CREATE INDEX "Service_advisorProfileId_active_idx" ON "Service"("advisorProfileId", "active");

-- CreateIndex
CREATE INDEX "ProfileRelation_targetProfileId_idx" ON "ProfileRelation"("targetProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileRelation_sourceProfileId_targetProfileId_key" ON "ProfileRelation"("sourceProfileId", "targetProfileId");

-- AddForeignKey
ALTER TABLE "AdvisorProfile" ADD CONSTRAINT "AdvisorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileRelation" ADD CONSTRAINT "ProfileRelation_sourceProfileId_fkey" FOREIGN KEY ("sourceProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileRelation" ADD CONSTRAINT "ProfileRelation_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Controlled SQL constraints complement the framework-independent policies.
ALTER TABLE "Service" ALTER COLUMN "allowedMeetingModes" SET NOT NULL;
ALTER TABLE "Service" ADD CONSTRAINT "service_duration_range"
  CHECK ("durationMinutes" BETWEEN 1 AND 480);
ALTER TABLE "Service" ADD CONSTRAINT "service_modes_nonempty"
  CHECK (cardinality("allowedMeetingModes") >= 1 AND array_ndims("allowedMeetingModes") = 1
    AND array_position("allowedMeetingModes", NULL) IS NULL);
ALTER TABLE "Service" ADD CONSTRAINT "service_fixed_one_mode"
  CHECK ("meetingModePolicy" <> 'FIXED' OR cardinality("allowedMeetingModes") = 1);
ALTER TABLE "Service" ADD CONSTRAINT "service_modes_unique"
  CHECK (cardinality("allowedMeetingModes") =
    (CASE WHEN 'IN_PERSON' = ANY("allowedMeetingModes") THEN 1 ELSE 0 END) +
    (CASE WHEN 'PHONE' = ANY("allowedMeetingModes") THEN 1 ELSE 0 END) +
    (CASE WHEN 'ONLINE' = ANY("allowedMeetingModes") THEN 1 ELSE 0 END));
ALTER TABLE "ProfileRelation" ADD CONSTRAINT "relation_not_self"
  CHECK ("sourceProfileId" <> "targetProfileId");
ALTER TABLE "ProfileRelation" ADD CONSTRAINT "relation_required_selected"
  CHECK ("clientCanRemove" OR "defaultSelected");
ALTER TABLE "AdvisorProfile" ADD CONSTRAINT "profile_image_key_safe"
  CHECK ("imageKey" IS NULL OR "imageKey" ~ '^[A-Za-z0-9_-]{1,128}(\.(jpg|jpeg|png|webp))?$');
