DO $$ BEGIN
  IF (SELECT count(*) FROM "User" WHERE id = 'migration-user'
      AND email = 'migration@example.test' AND NOT "canManageOwnServices") <> 1 THEN
    RAISE EXCEPTION 'Foundation identity was not preserved';
  END IF;
  IF (SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL) <> 5 THEN
    RAISE EXCEPTION 'All migrations must be applied';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_fixed_one_mode') THEN
    RAISE EXCEPTION 'Domain migration constraints are missing';
  END IF;
END $$;
