DO $$ BEGIN
  IF (SELECT count(*) FROM "AdvisorProfile" WHERE id = 'availability-upgrade-profile' AND "availabilityVersion" = 0 AND status = 'DRAFT') <> 1 THEN
    RAISE EXCEPTION 'Existing profile was not preserved';
  END IF;
  IF (SELECT count(*) FROM "Service" WHERE id = 'availability-upgrade-service' AND "durationMinutes" = 30) <> 1 THEN
    RAISE EXCEPTION 'Existing service was not preserved';
  END IF;
  IF (SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL) <> 11 THEN
    RAISE EXCEPTION 'All migrations must be applied';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'weekly_no_overlap') THEN
    RAISE EXCEPTION 'Availability constraints missing';
  END IF;
END $$;
