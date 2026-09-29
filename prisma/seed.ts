import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  if (process.env.NODE_ENV !== "development") throw new Error("Seed requires NODE_ENV=development");
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/appointment_dev") throw new Error("Seed is restricted to local appointment_dev");
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.test";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email.endsWith("@example.test") || !password || password.length < 16) throw new Error("Use an example.test email and a supplied password of at least 16 characters");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
  try {
    if (await db.user.findUnique({ where: { email } })) { console.info("Development user already exists; credentials left unchanged."); return; }
    const id = randomUUID();
    await db.user.create({ data: { id, email, name: "Development Administrator", role: "ADMIN", emailVerified: true,
      accounts: { create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(password) } },
    } });
    console.info("Development administrator created. No credentials logged.");
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Development seed failed. Check the documented environment and local database."); process.exitCode = 1; });
