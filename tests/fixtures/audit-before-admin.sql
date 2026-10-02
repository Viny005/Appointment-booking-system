INSERT INTO "User" ("id","name","email","emailVerified","role","active","createdAt","updatedAt","canManageOwnServices")
VALUES ('admin-upgrade-fixture','Upgrade Admin','admin-upgrade@example.test',true,'ADMIN',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,false);

INSERT INTO "Session" ("id","expiresAt","token","createdAt","updatedAt","lastActivityAt","userId")
VALUES ('admin-upgrade-session',CURRENT_TIMESTAMP + interval '1 hour','admin-upgrade-session-token',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'admin-upgrade-fixture');
