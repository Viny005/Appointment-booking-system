INSERT INTO "AdvisorProfile" (id, name, status, "updatedAt") VALUES ('availability-upgrade-profile', 'Synthetic migration profile', 'DRAFT', CURRENT_TIMESTAMP);
INSERT INTO "Service" (id, "advisorProfileId", name, description, "durationMinutes", "meetingModePolicy", "allowedMeetingModes", "updatedAt")
VALUES ('availability-upgrade-service', 'availability-upgrade-profile', 'Synthetic appointment type', '', 30, 'FIXED', ARRAY['PHONE']::"MeetingMode"[], CURRENT_TIMESTAMP);
