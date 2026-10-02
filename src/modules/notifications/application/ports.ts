import type { NotificationPayload, NotificationType, Recipient } from "../domain/notification";
export type LeasedNotification = { id: string; leaseToken: string; attempts: number };
export type Mail = { id: string; to: string; subject: string; text: string; ics: string | null; method: "REQUEST" | "CANCEL" | null };
export type PreparedNotification = { id: string; type: NotificationType; recipient: Recipient; payload: NotificationPayload; secret: string | null };
export interface MailTransport { send(mail: Mail): Promise<void> }
export interface SecretBox { seal(plaintext: string, context: string): string; open(ciphertext: string, context: string): string }
export interface NotificationRepository {
  metrics(): Promise<{ pending: number; failed: number }>;
  claim(now: Date, limit: number, leaseMilliseconds: number): Promise<LeasedNotification[]>;
  prepare(job: LeasedNotification, now: Date): Promise<PreparedNotification | null>;
  finish(job: LeasedNotification, now: Date, delivered: boolean): Promise<boolean>;
  purgeSecrets(now: Date, limit: number): Promise<number>;
  retryFailed(actorId: string, notificationId: string, now: Date): Promise<void>;
}
export type MailConfiguration = { publicOrigin: string; from: string; guestPrivacyUrl: string };
export interface WorkerTelemetry { emit(event: { action: "SENT" | "FAILED" | "RETRY" | "SUPERSEDED" | "LEASE_LOST"; count: number }): void }
