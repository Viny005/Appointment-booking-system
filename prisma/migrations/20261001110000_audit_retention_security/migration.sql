CREATE TYPE "AuditAction" AS ENUM ('APPOINTMENT_CREATED','APPOINTMENT_RESCHEDULED','APPOINTMENT_DETAILS_CHANGED','APPOINTMENT_GUESTS_CHANGED','APPOINTMENT_CANCELLED','CONFIRMATION_RESENT','APPOINTMENT_COMPLETED','APPOINTMENT_NO_SHOW','RETENTION_APPLIED','ACCESS_DENIED','PROFILE_CHANGED','SERVICE_CHANGED','RELATION_CHANGED','AVAILABILITY_CHANGED','USER_CHANGED','PASSWORD_RESET','IMAGE_CHANGED','SETTINGS_CHANGED');
ALTER TABLE "Appointment" ADD COLUMN "piiErasedAt" TIMESTAMPTZ(3);
ALTER TABLE "Appointment" DROP CONSTRAINT appointment_meeting_shape;
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_meeting_shape CHECK ("piiErasedAt" IS NOT NULL OR CASE "meetingMode"
  WHEN 'IN_PERSON' THEN "placeName" IS NOT NULL AND btrim("placeName") <> '' AND "visitAddress" IS NOT NULL AND btrim("visitAddress") <> ''
    AND char_length("placeName") + char_length("visitAddress") <= 1000
    AND "phoneDirection" IS NULL AND "advisorPhone" IS NULL AND "onlineUrl" IS NULL AND "onlineProvider" IS NULL
  WHEN 'PHONE' THEN "phoneDirection" IS NOT NULL AND "placeName" IS NULL AND "visitAddress" IS NULL AND "onlineUrl" IS NULL AND "onlineProvider" IS NULL
    AND (("phoneDirection" = 'ADVISOR_CALLS_CLIENT' AND "advisorPhone" IS NULL) OR
      ("phoneDirection" = 'CLIENT_CALLS_ADVISOR' AND "advisorPhone" IS NOT NULL AND btrim("advisorPhone") <> '' AND char_length("advisorPhone") <= 32))
  WHEN 'ONLINE' THEN "onlineUrl" IS NOT NULL AND "onlineUrl" ~* '^https://' AND char_length("onlineUrl") <= 2048
    AND "onlineProvider" IS NOT NULL AND btrim("onlineProvider") <> '' AND char_length("onlineProvider") <= 100
    AND "placeName" IS NULL AND "visitAddress" IS NULL AND "phoneDirection" IS NULL AND "advisorPhone" IS NULL
  ELSE false END);
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_erasure CHECK ("piiErasedAt" IS NULL OR (
 "firstName" IS NULL AND "lastName" IS NULL AND email IS NULL AND phone IS NULL AND address IS NULL AND remarks IS NULL
 AND "placeName" IS NULL AND "visitAddress" IS NULL AND "phoneDirection" IS NULL AND "advisorPhone" IS NULL AND "onlineUrl" IS NULL AND "onlineProvider" IS NULL
 AND "managementTokenHash" IS NULL AND "managementTokenExpiresAt" IS NULL AND "serviceDescription" = ''));
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_cancellation_time CHECK (status <> 'CANCELLED' OR "cancelledAt" IS NOT NULL);
CREATE TABLE "AuditLog" (
 id TEXT PRIMARY KEY, "eventKey" TEXT UNIQUE, timestamp TIMESTAMPTZ(3) NOT NULL,
 "actorKind" TEXT NOT NULL CHECK ("actorKind" IN ('CUSTOMER','INTERNAL','SYSTEM','ANONYMOUS')), "actorId" TEXT,
 action "AuditAction" NOT NULL, resource TEXT NOT NULL CHECK (resource IN ('APPOINTMENT','PROFILE','SERVICE','RELATION','AVAILABILITY','USER','IMAGE','SETTINGS','SECURITY')),
 "resourceId" TEXT, version INTEGER CHECK (version >= 0), "changedFields" TEXT[] NOT NULL,
 "recipientCount" INTEGER NOT NULL DEFAULT 0 CHECK ("recipientCount" BETWEEN 0 AND 100),
 result TEXT NOT NULL CHECK (result IN ('SUCCESS','DENIED')), reason TEXT CHECK (reason IN ('AUTHORIZATION','INVALID_CAPABILITY','ORIGIN','RATE_LIMIT')),
 occurrences INTEGER NOT NULL DEFAULT 1 CHECK (occurrences > 0),
 CONSTRAINT audit_fields CHECK ("changedFields" <@ ARRAY['status','startAt','endAt','meetingMode','placeName','visitAddress','phoneDirection','advisorPhone','onlineUrl','onlineProvider','firstName','lastName','phone','address','remarks','guests','managementToken','recipientSelection','personalData','profile','service','relation','availability','role','active','profileId','imageKey','password','settings']),
 CONSTRAINT audit_actor CHECK (("actorKind"='INTERNAL' AND "actorId" IS NOT NULL) OR ("actorKind"<>'INTERNAL' AND "actorId" IS NULL)),
 CONSTRAINT audit_result CHECK ((result='SUCCESS' AND reason IS NULL) OR (result='DENIED' AND action='ACCESS_DENIED' AND reason IS NOT NULL))
);
CREATE INDEX "AuditLog_resourceId_timestamp_idx" ON "AuditLog"("resourceId",timestamp);
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"(timestamp);
CREATE TABLE "RateLimitBucket" (
 key TEXT PRIMARY KEY CHECK (key ~ '^[a-f0-9]{64}$'), "windowStart" TIMESTAMPTZ(3) NOT NULL,
 count INTEGER NOT NULL CHECK (count > 0), "expiresAt" TIMESTAMPTZ(3) NOT NULL CHECK ("expiresAt" > "windowStart")
);
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
