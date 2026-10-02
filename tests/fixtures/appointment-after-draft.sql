DO $$ BEGIN
 IF (SELECT count(*) FROM "Appointment" WHERE id = 'draft-upgrade-appointment' AND "calendarUid" = 'draft-upgrade-calendar' AND "serviceName" = 'Preserved snapshot' AND "calendarSequence" = 0) <> 1 THEN RAISE EXCEPTION 'Appointment snapshot lost'; END IF;
 IF (SELECT count(*) FROM "AppointmentReservation" WHERE id = 'draft-upgrade-reservation') <> 1 THEN RAISE EXCEPTION 'Reservation lost'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'draft_capability_hash') THEN RAISE EXCEPTION 'Draft constraints missing'; END IF;
 IF (SELECT count(*) FROM "BookingDraft") <> 0 THEN RAISE EXCEPTION 'Unexpected draft'; END IF;
END $$;
