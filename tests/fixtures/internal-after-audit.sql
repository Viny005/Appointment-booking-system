DO $$ BEGIN
 IF (SELECT count(*) FROM "Appointment" WHERE id='draft-upgrade-appointment' AND email='upgrade@example.test' AND "piiErasedAt" IS NULL) <> 1 THEN RAISE EXCEPTION 'Appointment changed during upgrade'; END IF;
 IF (SELECT count(*) FROM "InternalAppointmentReceipt" WHERE id='audit-upgrade-receipt') <> 1 THEN RAISE EXCEPTION 'Internal receipt lost'; END IF;
 IF (SELECT count(*) FROM "AppointmentGuest" WHERE id='internal-upgrade-guest' AND source='CUSTOMER') <> 1 THEN RAISE EXCEPTION 'Guest lost'; END IF;
 IF (SELECT count(*) FROM "Notification" WHERE id='customer-upgrade-notification') <> 1 THEN RAISE EXCEPTION 'Notification lost'; END IF;
 IF (SELECT count(*) FROM "AuditLog") <> 0 THEN RAISE EXCEPTION 'Fabricated historical audit'; END IF;
 IF (SELECT count(*) FROM "RateLimitBucket") <> 0 THEN RAISE EXCEPTION 'Unexpected rate bucket'; END IF;
END $$;
