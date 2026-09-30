import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { prismaAppointments } from "@/modules/appointments/infrastructure/prisma-appointments";
const error = (code: string, meta?: Record<string, unknown>) => new Prisma.PrismaClientKnownRequestError("synthetic database failure", { code, clientVersion: "7.10.0", meta });
describe("ADR-007 bounded transaction retries", () => {
  it.each([error("P2034"), error("P2010", { code: "40P01" }), error("P2010", { code: "40001" })])("retries only a rolled-back transient transaction", async failure => {
    const transaction = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce("committed");
    const repo = prismaAppointments({ $transaction: transaction } as unknown as PrismaClient);
    expect(await repo.transaction(async () => "unused")).toBe("committed"); expect(transaction).toHaveBeenCalledTimes(2);
  });
  it("bounds attempts and never retries constraint conflicts", async () => {
    for (const [failure, attempts] of [[error("P2034"), 3], [error("P2002"), 1], [error("P2004"), 1]] as const) {
      const transaction = vi.fn().mockRejectedValue(failure);
      await expect(prismaAppointments({ $transaction: transaction } as unknown as PrismaClient).transaction(async () => 0)).rejects.toMatchObject({ code: "CONFLICT" });
      expect(transaction).toHaveBeenCalledTimes(attempts);
    }
  });
});
