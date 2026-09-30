-- CreateTable
CREATE TABLE "BookingDraft" (
    "id" TEXT NOT NULL,
    "capabilityHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingIdempotency" (
    "id" TEXT NOT NULL,
    "capabilityHash" TEXT NOT NULL,
    "commandKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDraft_capabilityHash_key" ON "BookingDraft"("capabilityHash");

-- CreateIndex
CREATE INDEX "BookingDraft_expiresAt_idx" ON "BookingDraft"("expiresAt");

-- CreateIndex
CREATE INDEX "BookingIdempotency_expiresAt_idx" ON "BookingIdempotency"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingIdempotency_capabilityHash_commandKey_key" ON "BookingIdempotency"("capabilityHash", "commandKey");

ALTER TABLE "BookingDraft" ADD CONSTRAINT draft_capability_hash CHECK ("capabilityHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "BookingDraft" ADD CONSTRAINT draft_version CHECK (version >= 0);
ALTER TABLE "BookingDraft" ADD CONSTRAINT draft_payload_shape CHECK (jsonb_typeof(payload) = 'object' AND octet_length(payload::text) <= 32768);
ALTER TABLE "BookingIdempotency" ADD CONSTRAINT booking_idempotency_hash CHECK ("capabilityHash" ~ '^[a-f0-9]{64}$' AND "payloadHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "BookingIdempotency" ADD CONSTRAINT booking_idempotency_key CHECK ("commandKey" ~ '^[A-Za-z0-9_-]{16,128}$');
ALTER TABLE "BookingIdempotency" ADD CONSTRAINT booking_idempotency_result CHECK (jsonb_typeof(result) = 'object' AND NOT result ? 'rawManagementToken' AND NOT result ? 'customer' AND NOT result ? 'email');
