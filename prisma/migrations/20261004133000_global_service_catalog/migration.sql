CREATE TABLE "ServiceTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "meetingModePolicy" "MeetingModePolicy" NOT NULL,
    "allowedMeetingModes" "MeetingMode"[] NOT NULL,
    "placeName" TEXT,
    "visitAddress" TEXT,
    "phoneDirection" "PhoneDirection" NOT NULL DEFAULT 'ADVISOR_CALLS_CLIENT',
    "advisorPhone" TEXT,
    "onlineUrl" TEXT,
    "onlineProvider" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceTemplate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Service"
  ADD COLUMN "serviceTemplateId" TEXT;

CREATE INDEX "ServiceTemplate_name_idx" ON "ServiceTemplate"("name");
CREATE INDEX "Service_serviceTemplateId_idx" ON "Service"("serviceTemplateId");
CREATE UNIQUE INDEX "Service_advisorProfileId_serviceTemplateId_key"
  ON "Service"("advisorProfileId", "serviceTemplateId");

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_serviceTemplateId_fkey"
  FOREIGN KEY ("serviceTemplateId") REFERENCES "ServiceTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ServiceTemplate" ADD CONSTRAINT "service_template_duration_range"
  CHECK ("durationMinutes" BETWEEN 1 AND 480);
ALTER TABLE "ServiceTemplate" ADD CONSTRAINT "service_template_modes_nonempty"
  CHECK (cardinality("allowedMeetingModes") >= 1 AND array_ndims("allowedMeetingModes") = 1
    AND array_position("allowedMeetingModes", NULL) IS NULL);
ALTER TABLE "ServiceTemplate" ADD CONSTRAINT "service_template_fixed_one_mode"
  CHECK ("meetingModePolicy" <> 'FIXED' OR cardinality("allowedMeetingModes") = 1);
ALTER TABLE "ServiceTemplate" ADD CONSTRAINT "service_template_modes_unique"
  CHECK (cardinality("allowedMeetingModes") =
    (CASE WHEN 'IN_PERSON' = ANY("allowedMeetingModes") THEN 1 ELSE 0 END) +
    (CASE WHEN 'PHONE' = ANY("allowedMeetingModes") THEN 1 ELSE 0 END) +
    (CASE WHEN 'ONLINE' = ANY("allowedMeetingModes") THEN 1 ELSE 0 END));
