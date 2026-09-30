-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_CHANGED', 'BOOKING_CANCELLED', 'REMINDER', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "NotificationRecipient" AS ENUM ('CUSTOMER', 'ADVISOR', 'GUEST', 'USER');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "notificationEventNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reminderGeneration" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "recipientCategory" "NotificationRecipient" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "advisorProfileId" TEXT,
    "eventId" TEXT NOT NULL,
    "eventNumber" INTEGER NOT NULL,
    "appointmentVersion" INTEGER NOT NULL,
    "calendarSequence" INTEGER NOT NULL,
    "reminderGeneration" INTEGER,
    "removedGuest" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "requiresSecret" BOOLEAN NOT NULL DEFAULT false,
    "secretCipher" TEXT,
    "secretExpiresAt" TIMESTAMPTZ(3),
    "secretTokenHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "leaseToken" TEXT,
    "leaseUntil" TIMESTAMPTZ(3),
    "lastErrorCode" TEXT,
    "sentAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_status_dueAt_leaseUntil_idx" ON "Notification"("status", "dueAt", "leaseUntil");

-- CreateIndex
CREATE INDEX "Notification_appointmentId_recipientEmail_eventNumber_idx" ON "Notification"("appointmentId", "recipientEmail", "eventNumber");

-- CreateIndex
CREATE INDEX "Notification_secretExpiresAt_idx" ON "Notification"("secretExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_eventId_type_recipientEmail_key" ON "Notification"("eventId", "type", "recipientEmail");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment" ADD CONSTRAINT appointment_notification_versions CHECK ("notificationEventNumber" >= 0 AND "reminderGeneration" >= 0);
ALTER TABLE "Notification" ADD CONSTRAINT notification_counters CHECK (attempts BETWEEN 0 AND 6 AND "eventNumber" >= 0 AND "appointmentVersion" >= 0 AND "calendarSequence" >= 0 AND ("reminderGeneration" IS NULL OR "reminderGeneration" >= 0));
ALTER TABLE "Notification" ADD CONSTRAINT notification_lease CHECK (("leaseToken" IS NULL) = ("leaseUntil" IS NULL));
ALTER TABLE "Notification" ADD CONSTRAINT notification_recipient CHECK ("recipientEmail" = btrim("recipientEmail") AND char_length("recipientEmail") BETWEEN 3 AND 254 AND "recipientEmail" !~ '[[:space:]]' AND position('@' in "recipientEmail") > 1);
ALTER TABLE "Notification" ADD CONSTRAINT notification_scope CHECK ((type = 'PASSWORD_RESET' AND "appointmentId" IS NULL AND "recipientCategory" = 'USER') OR (type <> 'PASSWORD_RESET' AND "appointmentId" IS NOT NULL AND "recipientCategory" <> 'USER'));
ALTER TABLE "Notification" ADD CONSTRAINT notification_removal CHECK (NOT "removedGuest" OR (type = 'BOOKING_CANCELLED' AND "recipientCategory" = 'GUEST'));
ALTER TABLE "Notification" ADD CONSTRAINT notification_secret CHECK (
  ("secretCipher" IS NULL AND "secretExpiresAt" IS NULL AND "secretTokenHash" IS NULL AND (NOT "requiresSecret" OR status <> 'PENDING')) OR
  ("requiresSecret" AND "recipientCategory" IN ('CUSTOMER', 'USER') AND type IN ('BOOKING_CONFIRMATION','PASSWORD_RESET') AND "secretCipher" IS NOT NULL AND "secretTokenHash" IS NOT NULL AND "secretCipher" LIKE 'v1.%' AND "secretExpiresAt" IS NOT NULL AND "secretTokenHash" ~ '^[a-f0-9]{64}$'));
ALTER TABLE "Notification" ADD CONSTRAINT notification_payload CHECK (jsonb_typeof(payload) = 'object' AND NOT payload ? 'rawManagementToken' AND NOT payload ? 'remarks' AND NOT payload ? 'guests' AND NOT payload ? 'customerPhone');

ALTER TABLE "Notification" ADD CONSTRAINT notification_secret_lifetime CHECK ("secretExpiresAt" IS NULL OR "secretExpiresAt" <= "createdAt" + INTERVAL '24 hours');
ALTER TABLE "Notification" ADD CONSTRAINT notification_reminder_generation CHECK ((type = 'REMINDER') = ("reminderGeneration" IS NOT NULL));
ALTER TABLE "Notification" ADD CONSTRAINT notification_sent_time CHECK ((status = 'SENT') = ("sentAt" IS NOT NULL));
