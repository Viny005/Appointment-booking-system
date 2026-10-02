-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('PRIMARY', 'ADDITIONAL');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
    "version" INTEGER NOT NULL DEFAULT 0,
    "calendarUid" TEXT NOT NULL,
    "calendarSequence" INTEGER NOT NULL DEFAULT 0,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "remarks" TEXT,
    "serviceName" TEXT NOT NULL,
    "serviceDescription" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "meetingMode" "MeetingMode" NOT NULL,
    "placeName" TEXT,
    "visitAddress" TEXT,
    "phoneDirection" "PhoneDirection",
    "advisorPhone" TEXT,
    "onlineUrl" TEXT,
    "onlineProvider" TEXT,
    "managementTokenHash" TEXT,
    "managementTokenExpiresAt" TIMESTAMPTZ(3),
    "managementTokenRevokedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentParticipant" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "advisorProfileId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL,
    "profileName" TEXT NOT NULL,
    "profileTitle" TEXT NOT NULL,

    CONSTRAINT "AppointmentParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentGuest" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "AppointmentGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentReservation" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "advisorProfileId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AppointmentReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_calendarUid_key" ON "Appointment"("calendarUid");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_managementTokenHash_key" ON "Appointment"("managementTokenHash");

-- CreateIndex
CREATE INDEX "Appointment_status_startAt_endAt_idx" ON "Appointment"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Appointment_serviceId_idx" ON "Appointment"("serviceId");

-- CreateIndex
CREATE INDEX "AppointmentParticipant_advisorProfileId_appointmentId_idx" ON "AppointmentParticipant"("advisorProfileId", "appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentParticipant_appointmentId_advisorProfileId_key" ON "AppointmentParticipant"("appointmentId", "advisorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentGuest_appointmentId_email_key" ON "AppointmentGuest"("appointmentId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentReservation_appointmentId_advisorProfileId_key" ON "AppointmentReservation"("appointmentId", "advisorProfileId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentParticipant" ADD CONSTRAINT "AppointmentParticipant_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentParticipant" ADD CONSTRAINT "AppointmentParticipant_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentGuest" ADD CONSTRAINT "AppointmentGuest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentReservation" ADD CONSTRAINT "AppointmentReservation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentReservation" ADD CONSTRAINT "AppointmentReservation_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment" ADD CONSTRAINT appointment_time CHECK ("startAt" < "endAt");
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_versions CHECK (version >= 0 AND "calendarSequence" >= 0);
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_zone CHECK ("timeZone" = 'Europe/Berlin');
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_duration CHECK ("durationMinutes" BETWEEN 1 AND 480 AND "endAt" = "startAt" + "durationMinutes" * INTERVAL '1 minute');
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_token CHECK (
  ("managementTokenHash" IS NULL AND "managementTokenExpiresAt" IS NULL) OR
  ("managementTokenHash" IS NOT NULL AND "managementTokenHash" ~ '^[a-f0-9]{64}$' AND "managementTokenExpiresAt" IS NOT NULL AND "managementTokenExpiresAt" = "endAt"));
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_customer_lengths CHECK
  (char_length("firstName") BETWEEN 1 AND 100 AND char_length("lastName") BETWEEN 1 AND 100 AND char_length(email) BETWEEN 3 AND 254 AND char_length(phone) BETWEEN 1 AND 32 AND char_length(address) <= 500 AND char_length(remarks) <= 2000);
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_meeting_shape CHECK (CASE "meetingMode"
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
CREATE UNIQUE INDEX appointment_one_primary ON "AppointmentParticipant" ("appointmentId") WHERE role = 'PRIMARY';
ALTER TABLE "AppointmentGuest" ADD CONSTRAINT appointment_guest_email CHECK
  (email = btrim(email) AND char_length(email) BETWEEN 3 AND 254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' AND split_part(email, '@', 2) = lower(split_part(email, '@', 2)));
ALTER TABLE "AppointmentReservation" ADD CONSTRAINT reservation_time CHECK ("startAt" < "endAt");
ALTER TABLE "AppointmentReservation" ADD CONSTRAINT reservation_participant FOREIGN KEY ("appointmentId", "advisorProfileId")
  REFERENCES "AppointmentParticipant" ("appointmentId", "advisorProfileId") ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "AppointmentReservation" ADD CONSTRAINT appointment_no_double_booking EXCLUDE USING gist
  ("advisorProfileId" WITH =, tstzrange("startAt", "endAt", '[)') WITH &&);

-- Validate the final aggregate, never its transient creation order inside the transaction.
CREATE FUNCTION check_appointment_aggregate() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE keys text[]; key text; a "Appointment"%ROWTYPE; primary_count integer; guest_count integer;
BEGIN
  IF TG_TABLE_NAME = 'Appointment' THEN keys := ARRAY[COALESCE(NEW.id, OLD.id)];
  ELSIF TG_OP = 'UPDATE' THEN keys := ARRAY[OLD."appointmentId", NEW."appointmentId"];
  ELSE keys := ARRAY[COALESCE(NEW."appointmentId", OLD."appointmentId")]; END IF;
  FOREACH key IN ARRAY keys LOOP
    SELECT * INTO a FROM "Appointment" WHERE id = key FOR UPDATE;
    IF NOT FOUND THEN CONTINUE; END IF;
    SELECT count(*) INTO primary_count FROM "AppointmentParticipant" p JOIN "Service" s ON s.id = a."serviceId"
      WHERE p."appointmentId" = key AND p.role = 'PRIMARY' AND p."advisorProfileId" = s."advisorProfileId";
    IF primary_count <> 1 THEN RAISE EXCEPTION 'Appointment requires the service owner as primary' USING ERRCODE = '23514'; END IF;
    SELECT count(*) INTO guest_count FROM "AppointmentGuest" WHERE "appointmentId" = key;
    IF guest_count > 10 OR EXISTS (SELECT 1 FROM "AppointmentGuest" WHERE "appointmentId" = key AND email = a.email) THEN
      RAISE EXCEPTION 'Invalid appointment guest set' USING ERRCODE = '23514';
    END IF;
    IF a.status = 'CONFIRMED' THEN
      IF EXISTS (SELECT 1 FROM "AppointmentParticipant" p WHERE p."appointmentId" = key AND NOT EXISTS
        (SELECT 1 FROM "AppointmentReservation" r WHERE r."appointmentId" = key AND r."advisorProfileId" = p."advisorProfileId"))
        OR EXISTS (SELECT 1 FROM "AppointmentReservation" r WHERE r."appointmentId" = key AND (r."startAt" <> a."startAt" OR r."endAt" <> a."endAt")) THEN
        RAISE EXCEPTION 'Confirmed appointment requires matching participant reservations' USING ERRCODE = '23514';
      END IF;
    ELSIF EXISTS (SELECT 1 FROM "AppointmentReservation" WHERE "appointmentId" = key) THEN
      RAISE EXCEPTION 'Terminal appointment must not occupy resources' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER appointment_aggregate_header AFTER INSERT OR UPDATE ON "Appointment"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_appointment_aggregate();
CREATE CONSTRAINT TRIGGER appointment_aggregate_participants AFTER INSERT OR UPDATE OR DELETE ON "AppointmentParticipant"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_appointment_aggregate();
CREATE CONSTRAINT TRIGGER appointment_aggregate_guests AFTER INSERT OR UPDATE OR DELETE ON "AppointmentGuest"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_appointment_aggregate();
CREATE CONSTRAINT TRIGGER appointment_aggregate_reservations AFTER INSERT OR UPDATE OR DELETE ON "AppointmentReservation"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_appointment_aggregate();
