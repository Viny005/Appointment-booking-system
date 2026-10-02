import { normalizeEmail } from "@/modules/appointments/domain/appointment";
import { smtpConfiguration } from "./smtp";
import { aesSecretBox } from "./secret-box";
import { bookingNotificationPlanner } from "./planner";
export function mailConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === "production";
  const publicUrl = new URL(env.BETTER_AUTH_URL ?? ""), privacy = new URL(env.GUEST_PRIVACY_URL ?? "");
  if (![publicUrl, privacy].every(u => !u.username && !u.password && (u.protocol === "https:" || !production && u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname)))) throw new Error("Invalid mail URL configuration");
  if (privacy.hash || privacy.search || production && env.PRIVACY_INFORMATION_APPROVED !== "true") throw new Error("Approved guest privacy information required");
  return { publicOrigin: publicUrl.origin, from: normalizeEmail(env.MAIL_FROM), guestPrivacyUrl: privacy.toString() };
}
export function configuredBookingPlanner() {
  smtpConfiguration();
  mailConfiguration(); // Fail before committing a booking with unusable delivery configuration.
  return bookingNotificationPlanner(aesSecretBox(process.env.OUTBOX_ENCRYPTION_KEY ?? ""));
}
