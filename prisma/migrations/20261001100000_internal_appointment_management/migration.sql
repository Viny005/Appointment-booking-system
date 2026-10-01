CREATE TYPE "GuestSource" AS ENUM ('CUSTOMER','INTERNAL');
ALTER TABLE "AppointmentGuest" ADD COLUMN "source" "GuestSource" NOT NULL DEFAULT 'CUSTOMER';
CREATE TABLE "InternalAppointmentReceipt" (
 "id" TEXT PRIMARY KEY, "actorId" TEXT NOT NULL, "appointmentId" TEXT NOT NULL,
 "commandKey" TEXT NOT NULL CHECK ("commandKey" ~ '^[A-Za-z0-9_-]{16,128}$'),
 "action" TEXT NOT NULL CHECK ("action" IN ('cancel','reschedule','details','guests','resend','outcome')),
 "payloadHash" TEXT NOT NULL CHECK ("payloadHash" ~ '^[a-f0-9]{64}$'),
 "result" JSONB NOT NULL CHECK (jsonb_typeof("result")='object' AND "result" ?& ARRAY['status','version','noOp'] AND "result" - ARRAY['status','version','noOp']='{}'::jsonb AND "result"->>'status' IN ('CONFIRMED','CANCELLED','COMPLETED','NO_SHOW') AND jsonb_typeof("result"->'version')='number' AND "result"->>'version' ~ '^[0-9]+$' AND jsonb_typeof("result"->'noOp')='boolean'),
 "createdAt" TIMESTAMPTZ(3) NOT NULL,
 "expiresAt" TIMESTAMPTZ(3) NOT NULL CHECK ("expiresAt" > "createdAt" AND "expiresAt" <= "createdAt" + INTERVAL '24 hours')
);
CREATE UNIQUE INDEX "InternalAppointmentReceipt_actorId_commandKey_key" ON "InternalAppointmentReceipt"("actorId","commandKey");
CREATE INDEX "InternalAppointmentReceipt_appointmentId_action_createdAt_idx" ON "InternalAppointmentReceipt"("appointmentId","action","createdAt");
CREATE INDEX "InternalAppointmentReceipt_expiresAt_idx" ON "InternalAppointmentReceipt"("expiresAt");
ALTER TABLE "InternalAppointmentReceipt" ADD CONSTRAINT "InternalAppointmentReceipt_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalAppointmentReceipt" ADD CONSTRAINT "InternalAppointmentReceipt_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
