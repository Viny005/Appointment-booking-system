INSERT INTO "WeeklyAvailability" (id, "advisorProfileId", weekday, "startMinute", "endMinute", "updatedAt")
VALUES ('appointment-upgrade-weekly', 'availability-upgrade-profile', 1, 480, 720, CURRENT_TIMESTAMP);
INSERT INTO "AvailabilityException" (id, "advisorProfileId", type, "startDate", "endDate", "updatedAt")
VALUES ('appointment-upgrade-block', 'availability-upgrade-profile', 'BLOCK_DAY', '2026-12-24', '2026-12-26', CURRENT_TIMESTAMP);
