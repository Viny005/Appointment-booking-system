DO $$ BEGIN
 IF (SELECT count(*) FROM "AppointmentGuest" WHERE id='internal-upgrade-guest' AND source='CUSTOMER') <> 1 THEN RAISE EXCEPTION 'Guest/source lost'; END IF;
 IF (SELECT count(*) FROM "AppointmentMutationReceipt" WHERE id='internal-upgrade-receipt') <> 1 THEN RAISE EXCEPTION 'Customer receipt lost'; END IF;
 IF (SELECT count(*) FROM "InternalAppointmentReceipt") <> 0 THEN RAISE EXCEPTION 'Unexpected internal receipt'; END IF;
 IF (SELECT count(*) FROM "Notification" WHERE id='customer-upgrade-notification' AND status='PENDING') <> 1 THEN RAISE EXCEPTION 'Outbox lost'; END IF;
END $$;
