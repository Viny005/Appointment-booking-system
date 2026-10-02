DO $$ BEGIN
 IF (SELECT count(*) FROM "Notification" WHERE id='customer-upgrade-notification' AND status='PENDING' AND payload->>'subject'='Preserved') <> 1 THEN RAISE EXCEPTION 'Outbox lost'; END IF;
 IF (SELECT count(*) FROM "Appointment" WHERE id='draft-upgrade-appointment' AND "calendarUid"='draft-upgrade-calendar' AND version=0) <> 1 THEN RAISE EXCEPTION 'Appointment changed'; END IF;
 IF (SELECT count(*) FROM "AppointmentMutationReceipt") <> 0 THEN RAISE EXCEPTION 'Unexpected receipt'; END IF;
END $$;
