DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "User"
    WHERE id = 'admin-upgrade-fixture' AND role = 'ADMIN' AND active = true
      AND "securityGeneration" = 0 AND "passwordMutationPending" = false
  ) THEN RAISE EXCEPTION 'admin user was not preserved with safe security defaults'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "Session"
    WHERE id = 'admin-upgrade-session' AND "userId" = 'admin-upgrade-fixture' AND "securityGeneration" = 0
  ) THEN RAISE EXCEPTION 'session was not preserved with matching security generation'; END IF;
END $$;
