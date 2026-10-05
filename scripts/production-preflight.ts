import "dotenv/config";
import { constants } from "node:fs";
import { access, mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import { productionReadiness } from "../src/shared/application/production-readiness";
import { getDatabase } from "../src/shared/infrastructure/database";
import { smtpConfiguration } from "../src/modules/notifications/infrastructure/smtp";
import { mailConfiguration } from "../src/modules/notifications/infrastructure/config";
import { aesSecretBox } from "../src/modules/notifications/infrastructure/secret-box";
import { retentionConfiguration } from "../src/modules/privacy/infrastructure/config";

const technicalOnly = process.argv.includes("--technical");
const checks: { name: string; ok: boolean; detail?: string }[] = [];

async function check(name: string, work: () => Promise<void> | void) {
  try {
    await work();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      detail: error instanceof Error ? error.message : "unknown error",
    });
  }
}

await check("runtime-node", () => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major !== 24 || !Number.isInteger(minor)) {
    throw new Error("Node.js 24 LTS is required; running " + process.versions.node);
  }
});

const productionEnv: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "production",
  ...(technicalOnly ? {
    // Technical staging may validate infrastructure before operator/legal approval.
    // These values exist only in this copied object and do not alter process.env.
    PRIVACY_INFORMATION_APPROVED: "true",
    RETENTION_POLICY_APPROVED: "true",
  } : {}),
};

await check(technicalOnly ? "technical-readiness" : "production-readiness", () => {
  const readiness = productionReadiness(productionEnv);
  if (!readiness.ok) throw new Error("missing: " + readiness.missing.join(", "));
});

await check("retention-config", () => {
  retentionConfiguration(productionEnv);
});

await check("outbox-encryption", () => {
  aesSecretBox(productionEnv.OUTBOX_ENCRYPTION_KEY ?? "");
});

await check("mail-config", () => {
  smtpConfiguration(productionEnv);
  mailConfiguration(productionEnv);
});

let database: ReturnType<typeof getDatabase> | undefined;
await check("database", async () => {
  database = getDatabase();
  await database.$queryRaw`SELECT 1`;
});

await check("migrations", async () => {
  database ??= getDatabase();
  const local = (await readdir(resolve("prisma", "migrations"), { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  const rows = await database.$queryRaw<Array<{
    migration_name: string;
    finished_at: Date | null;
    rolled_back_at: Date | null;
  }>>`
    SELECT "migration_name", "finished_at", "rolled_back_at"
    FROM "_prisma_migrations"
    ORDER BY "migration_name"
  `;

  const applied = new Set(
    rows
      .filter(row => row.finished_at !== null && row.rolled_back_at === null)
      .map(row => row.migration_name),
  );
  const missing = local.filter(name => !applied.has(name));
  const unknown = [...applied].filter(name => !local.includes(name));

  if (missing.length || unknown.length) {
    throw new Error([
      missing.length ? "not applied: " + missing.join(", ") : "",
      unknown.length ? "not in repository: " + unknown.join(", ") : "",
    ].filter(Boolean).join("; "));
  }
});

await check("profile-image-storage", async () => {
  const configured = productionEnv.PROFILE_IMAGE_DIR?.trim();
  if (!configured) throw new Error("PROFILE_IMAGE_DIR is required");
  const root = resolve(configured);
  await mkdir(root, { recursive: true });
  await access(root, constants.R_OK | constants.W_OK);
  const probe = join(root, ".preflight-" + randomUUID());
  await writeFile(probe, "ok", { flag: "wx" });
  await unlink(probe);
});

await database?.$disconnect();

const ok = checks.every(item => item.ok);
console.log(JSON.stringify({
  mode: technicalOnly ? "technical" : "production",
  status: ok ? "ready" : "blocked",
  checks,
}, null, 2));

if (!ok) process.exitCode = 1;
