CREATE TABLE "AppointmentMutationReceipt" (
 "id" TEXT PRIMARY KEY,
 "capabilityHash" TEXT NOT NULL CHECK ("capabilityHash" ~ '^[a-f0-9]{64}$'),
 "commandKey" TEXT NOT NULL CHECK ("commandKey" ~ '^[A-Za-z0-9_-]{16,128}$'),
 "payloadHash" TEXT NOT NULL CHECK ("payloadHash" ~ '^[a-f0-9]{64}$'),
 "result" JSONB NOT NULL CHECK (jsonb_typeof("result") = 'object' AND "result" ?& ARRAY['status','version'] AND "result" - ARRAY['status','version'] = '{}'::jsonb AND "result"->>'status' IN ('CONFIRMED','CANCELLED') AND jsonb_typeof("result"->'version') = 'number' AND "result"->>'version' ~ '^[0-9]+$'),
 "expiresAt" TIMESTAMPTZ(3) NOT NULL,
 "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "AppointmentMutationReceipt_capabilityHash_commandKey_key" ON "AppointmentMutationReceipt"("capabilityHash", "commandKey");
CREATE INDEX "AppointmentMutationReceipt_expiresAt_idx" ON "AppointmentMutationReceipt"("expiresAt");
