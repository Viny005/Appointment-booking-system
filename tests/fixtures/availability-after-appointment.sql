DO $$ BEGIN
  IF (SELECT count(*) FROM "WeeklyAvailability" WHERE id = 'appointment-upgrade-weekly' AND "startMinute" = 480 AND "endMinute" = 720) <> 1 THEN
    RAISE EXCEPTION 'Weekly availability lost during upgrade';
  END IF;
  IF (SELECT count(*) FROM "AvailabilityException" WHERE id = 'appointment-upgrade-block' AND type = 'BLOCK_DAY' AND "endDate" = DATE '2026-12-26') <> 1 THEN
    RAISE EXCEPTION 'Availability exception lost during upgrade';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointment_no_double_booking') THEN
    RAISE EXCEPTION 'Appointment exclusion constraint missing';
  END IF;
  IF (SELECT count(*) FROM "Appointment") <> 0 THEN RAISE EXCEPTION 'Upgrade invented appointments'; END IF;
END $$;
