INSERT INTO "User" (id,name,email,"updatedAt") VALUES ('audit-upgrade-user','Synthetic admin','audit-upgrade@example.test',CURRENT_TIMESTAMP);
INSERT INTO "InternalAppointmentReceipt" (id,"actorId","appointmentId","commandKey",action,"payloadHash",result,"createdAt","expiresAt")
VALUES ('audit-upgrade-receipt','audit-upgrade-user','draft-upgrade-appointment','audit-upgrade-command','details',repeat('a',64),'{"status":"CONFIRMED","version":0,"noOp":false}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP+INTERVAL '1 hour');
