import { AppointmentError, requireAppointment } from "../domain/appointment";
import { requireCapability, customerView, requireCustomerChange, validateCustomerCommand, type CustomerCommand, type ManagedAppointment } from "../domain/customer-management";
import type { Slot } from "@/modules/availability/domain/values";

export type MutationReceipt = { payloadHash: string; result: { status: string; version: number }; expiresAt: Date };
export interface CustomerManagementReader {
  load(hash: string): Promise<ManagedAppointment | null>;
  slots(a: ManagedAppointment, date: string, now: number): Promise<Slot[]>;
}
export interface CustomerManagementWriter extends CustomerManagementReader {
  lock(hash: string): Promise<void>;
  receipt(hash: string, key: string): Promise<MutationReceipt | null>;
  saveReceipt(hash: string, key: string, receipt: MutationReceipt): Promise<void>;
  mutate(a: ManagedAppointment, command: CustomerCommand, now: number): Promise<{ status: string; version: number }>;
}
export interface CustomerManagementRepository {
  read<T>(work: (reader: CustomerManagementReader) => Promise<T>): Promise<T>;
  write<T>(work: (writer: CustomerManagementWriter) => Promise<T>): Promise<T>;
}
export class CustomerManagement {
  constructor(private readonly repository: CustomerManagementRepository, private readonly now: () => number, private readonly hash: (value: string) => string) {}
  private capability(raw: string) {
    if (typeof raw !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(raw)) throw new AppointmentError("NOT_FOUND", "Verwaltungslink nicht verfügbar. Bitte kontaktieren Sie Ihre Beratungsstelle.");
    return this.hash(raw);
  }
  async read(raw: string) { const hash = this.capability(raw); return this.repository.read(async tx => { const a = await tx.load(hash), now = this.now(); requireCapability(a, now); return customerView(a, now); }); }
  async slots(raw: string, date: string) { const hash = this.capability(raw); return this.repository.read(async tx => { const a = await tx.load(hash), now = this.now(); requireCapability(a, now); requireCustomerChange(a, a.version, now); return tx.slots(a, date, now); }); }
  async change(raw: string, key: string, input: CustomerCommand) {
    const hash = this.capability(raw), command = validateCustomerCommand(input);
    requireAppointment(typeof key === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(key), "Ungültiger Befehlsschlüssel.");
    const payloadHash = this.hash(JSON.stringify(command));
    return this.repository.write(async tx => {
      await tx.lock(hash);
      const now = this.now(), receipt = await tx.receipt(hash, key);
      // Minimal replay acknowledgement remains available after this command revoked the link; never a read capability.
      if (receipt && receipt.expiresAt.getTime() > now) {
        if (receipt.payloadHash !== payloadHash) throw new AppointmentError("CONFLICT", "Befehlsschlüssel bereits verwendet.");
        return { ...receipt.result, replay: true };
      }
      const a = await tx.load(hash); requireCapability(a, now); requireCustomerChange(a, command.version, now);
      const result = await tx.mutate(a, command, now);
      await tx.saveReceipt(hash, key, { payloadHash, result, expiresAt: new Date(now + 86400000) });
      return { ...result, replay: false };
    });
  }
}
