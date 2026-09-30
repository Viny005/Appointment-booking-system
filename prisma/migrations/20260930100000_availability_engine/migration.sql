-- CreateEnum
CREATE TYPE "AvailabilityExceptionType" AS ENUM ('BLOCK_DAY', 'REPLACE_DAY', 'ADD_INTERVAL');

-- AlterTable
ALTER TABLE "AdvisorProfile" ADD COLUMN     "availabilityVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WeeklyAvailability" (
    "id" TEXT NOT NULL,
    "advisorProfileId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL,
    "advisorProfileId" TEXT NOT NULL,
    "type" "AvailabilityExceptionType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityExceptionInterval" (
    "id" TEXT NOT NULL,
    "exceptionId" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "AvailabilityExceptionInterval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyAvailability_advisorProfileId_weekday_idx" ON "WeeklyAvailability"("advisorProfileId", "weekday");

-- CreateIndex
CREATE INDEX "AvailabilityException_advisorProfileId_startDate_endDate_idx" ON "AvailabilityException"("advisorProfileId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "AvailabilityExceptionInterval_exceptionId_idx" ON "AvailabilityExceptionInterval"("exceptionId");

-- AddForeignKey
ALTER TABLE "WeeklyAvailability" ADD CONSTRAINT "WeeklyAvailability_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_advisorProfileId_fkey" FOREIGN KEY ("advisorProfileId") REFERENCES "AdvisorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityExceptionInterval" ADD CONSTRAINT "AvailabilityExceptionInterval_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "AvailabilityException"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "AdvisorProfile" ADD CONSTRAINT availability_version_nonnegative CHECK ("availabilityVersion" >= 0);
ALTER TABLE "WeeklyAvailability" ADD CONSTRAINT weekly_weekday CHECK (weekday BETWEEN 1 AND 7);
ALTER TABLE "WeeklyAvailability" ADD CONSTRAINT weekly_time_range CHECK ("startMinute" >= 0 AND "startMinute" < "endMinute" AND "endMinute" <= 1440);
ALTER TABLE "WeeklyAvailability" ADD CONSTRAINT weekly_version CHECK (version >= 0);
ALTER TABLE "WeeklyAvailability" ADD CONSTRAINT weekly_no_overlap EXCLUDE USING gist
  ("advisorProfileId" WITH =, weekday WITH =, int4range("startMinute", "endMinute", '[)') WITH &&);
ALTER TABLE "AvailabilityException" ADD CONSTRAINT exception_dates CHECK
  ("startDate" <= "endDate" AND "startDate" >= DATE '0001-01-01' AND "endDate" <= DATE '9999-12-31' AND (type = 'BLOCK_DAY' OR "startDate" = "endDate"));
ALTER TABLE "AvailabilityException" ADD CONSTRAINT exception_version CHECK (version >= 0);
CREATE UNIQUE INDEX exception_one_replacement ON "AvailabilityException" ("advisorProfileId", "startDate") WHERE type = 'REPLACE_DAY';
ALTER TABLE "AvailabilityExceptionInterval" ADD CONSTRAINT exception_time_range CHECK
  ("startMinute" >= 0 AND "startMinute" < "endMinute" AND "endMinute" <= 1440);
ALTER TABLE "AvailabilityExceptionInterval" ADD CONSTRAINT exception_no_overlap EXCLUDE USING gist
  ("exceptionId" WITH =, int4range("startMinute", "endMinute", '[)') WITH &&);

-- Check the completed aggregate at COMMIT, allowing header/child replacement in one transaction.
CREATE FUNCTION check_availability_exception_shape() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE key text; keys text[]; kind "AvailabilityExceptionType"; interval_count integer;
BEGIN
  IF TG_TABLE_NAME = 'AvailabilityException' THEN keys := ARRAY[COALESCE(NEW.id, OLD.id)];
  ELSIF TG_OP = 'UPDATE' THEN keys := ARRAY[OLD."exceptionId", NEW."exceptionId"];
  ELSE keys := ARRAY[COALESCE(NEW."exceptionId", OLD."exceptionId")]; END IF;
  FOREACH key IN ARRAY keys LOOP
    SELECT type INTO kind FROM "AvailabilityException" WHERE id = key FOR UPDATE;
    IF NOT FOUND THEN CONTINUE; END IF;
    SELECT count(*) INTO interval_count FROM "AvailabilityExceptionInterval" WHERE "exceptionId" = key;
    IF (kind = 'BLOCK_DAY' AND interval_count <> 0) OR (kind = 'ADD_INTERVAL' AND interval_count = 0) THEN
      RAISE EXCEPTION 'Invalid availability exception shape' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER exception_shape_header AFTER INSERT OR UPDATE ON "AvailabilityException"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_availability_exception_shape();
CREATE CONSTRAINT TRIGGER exception_shape_intervals AFTER INSERT OR UPDATE OR DELETE ON "AvailabilityExceptionInterval"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_availability_exception_shape();
