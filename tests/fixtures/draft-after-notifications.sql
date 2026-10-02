DO $$ BEGIN
 IF (SELECT count(*) FROM "BookingDraft" WHERE id = 'notification-upgrade-draft' AND version = 0) <> 1 THEN RAISE EXCEPTION 'Draft lost'; END IF;
 IF (SELECT count(*) FROM "BookingIdempotency" WHERE id = 'notification-upgrade-key') <> 1 THEN RAISE EXCEPTION 'Idempotency lost'; END IF;
 IF (SELECT count(*) FROM "Appointment" WHERE id = 'draft-upgrade-appointment' AND "notificationEventNumber" = 0 AND "reminderGeneration" = 0 AND "calendarUid" = 'draft-upgrade-calendar') <> 1 THEN RAISE EXCEPTION 'Appointment changed'; END IF;
 IF (SELECT count(*) FROM "Notification") <> 0 THEN RAISE EXCEPTION 'Upgrade sent historical messages'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_secret') THEN RAISE EXCEPTION 'Outbox constraints missing'; END IF;
END $$;
