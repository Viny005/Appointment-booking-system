import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { BookingDrafts } from "@/modules/booking/application/drafts";
import { prismaDrafts } from "@/modules/booking/infrastructure/prisma-drafts";
import { generateManagementToken } from "@/modules/appointments/infrastructure/management-token";
import { configuredBookingPlanner } from "@/modules/notifications/infrastructure/config";
import { getDatabase } from "@/shared/infrastructure/database";
export function bookingDrafts() { return new BookingDrafts(prismaDrafts(getDatabase(), (tx, id, raw, now) => configuredBookingPlanner()(tx, id, raw, now)), { now: Date.now, id: randomUUID, token: generateManagementToken, hash: value => createHash("sha256").update(value).digest("hex") }); }
