import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "@/generated/prisma/client";
import { InternalAdmin } from "@/modules/identity/application/admin";
import { prismaAdminRepository } from "@/modules/identity/infrastructure/prisma-admin";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_test")) throw new Error("Separate TEST_DATABASE_URL required");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 10 }) });
const ids: string[] = [];
afterAll(async () => {
  await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { resource: "USER", resourceId: { in: ids } }] } });
  await db.user.deleteMany({ where: { id: { in: ids } } }); await db.$disconnect();
});
async function user(role: "ADMIN" | "ADVISOR", active = true) {
  const id = randomUUID(); ids.push(id);
  await db.user.create({ data: { id, name: role, email: `${id}@example.test`, role, active, emailVerified: true,
    accounts: { create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(randomBytes(20).toString("hex")) } } } });
  return id;
}
it("revokes sessions and audits an administrative account change atomically", async () => {
  const admin = await user("ADMIN"), advisor = await user("ADVISOR");
  const service = new InternalAdmin(prismaAdminRepository(db), randomUUID, hashPassword);
  await db.session.create({ data: { id: randomUUID(), token: randomUUID(), userId: advisor, expiresAt: new Date(Date.now() + 60000), securityGeneration: 0 } });
  const result = await service.update(admin, advisor, { active: false });
  expect(result.ok).toBe(true);
  expect(await db.session.count({ where: { userId: advisor } })).toBe(0);
  expect(await db.auditLog.count({ where: { actorId: admin, resource: "USER", resourceId: advisor, action: "USER_CHANGED" } })).toBe(1);
});
it("creates an advisor account and can grant own-service management", async () => { const admin = await user("ADMIN"), createdId=randomUUID(); ids.push(createdId); const service = new InternalAdmin(prismaAdminRepository(db), () => createdId, hashPassword); const created=await service.create(admin,{name:"New Advisor",email:`advisor-${createdId}@example.test`,role:"ADVISOR",initialPassword:"Sixteen-Characters-1!"}); if(!created.ok)throw new Error(JSON.stringify(created.error)); expect(created.ok).toBe(true); expect(created.value.active).toBe(true); expect(created.value.canManageOwnServices).toBe(false); const updated=await service.update(admin,createdId,{canManageOwnServices:true}); expect(updated.ok&&updated.value.canManageOwnServices).toBe(true); expect(await db.auditLog.count({where:{actorId:admin,resource:"USER",resourceId:createdId,action:"USER_CHANGED"}})).toBeGreaterThanOrEqual(2); });
it("enforces nonnegative security generations in PostgreSQL", async () => {
  const advisor = await user("ADVISOR");
  await expect(db.user.update({ where: { id: advisor }, data: { securityGeneration: -1 } })).rejects.toThrow();
});
