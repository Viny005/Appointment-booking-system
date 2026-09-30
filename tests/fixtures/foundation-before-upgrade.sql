-- Synthetic fixture in a disposable upgrade database only.
INSERT INTO "User" (id, name, email, "updatedAt")
VALUES ('migration-user', 'Migration fixture', 'migration@example.test', CURRENT_TIMESTAMP);
