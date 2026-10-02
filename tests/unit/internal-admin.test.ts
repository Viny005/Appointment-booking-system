import { expect, it } from "vitest";
import { InternalAdmin, type AdminRepository, type AdminWriter, type ManagedUser } from "@/modules/identity/application/admin";

function fixture() {
  const users = new Map<string, ManagedUser>([
    ["admin", { id: "admin", name: "Admin", email: "admin@example.test", role: "ADMIN", active: true, canManageOwnServices: false, profileId: null, securityGeneration: 0 }],
    ["advisor", { id: "advisor", name: "Advisor", email: "advisor@example.test", role: "ADVISOR", active: true, canManageOwnServices: false, profileId: null, securityGeneration: 0 }],
  ]);
  const revoked: string[] = [], audits: string[][] = [];
  const writer: AdminWriter = {
    getUser: async id => users.get(id) ?? null, listUsers: async () => [...users.values()],
    createUser: async input => { const u = { ...input, active: true, canManageOwnServices: false, profileId: null, securityGeneration: 0 }; users.set(u.id, u); return u; },
    updateUser: async (id, data) => { const u = { ...users.get(id)!, ...data }; users.set(id, u); return u; },
    revokeSessions: async id => { revoked.push(id); }, countActiveAdmins: async () => [...users.values()].filter(u => u.active && u.role === "ADMIN").length,
    audit: async (_actor, _target, fields) => { audits.push(fields); },
  };
  const repository: AdminRepository = { read: work => work(writer), write: (_actor, _targets, work) => work(writer) };
  return { service: new InternalAdmin(repository, () => "new", async p => `hash:${p}`), users, revoked, audits };
}
it("allows only active ADMIN to manage users", async () => {
  const { service } = fixture();
  expect((await service.list("advisor")).ok).toBe(false);
  const result = await service.create("admin", { name: " New User ", email: "NEW@EXAMPLE.TEST", role: "ADVISOR", initialPassword: "0123456789abcdef" });
  expect(result.ok && result.value.email).toBe("new@example.test");
});
it("protects the last active administrator", async () => {
  const { service } = fixture();
  const disabled = await service.update("admin", "admin", { active: false });
  expect(disabled).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  const demoted = await service.update("admin", "admin", { role: "ADVISOR" });
  expect(demoted).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
});
it("revokes sessions on deactivation or role change and audits changes", async () => {
  const { service, revoked, audits } = fixture();
  expect((await service.update("admin", "advisor", { active: false })).ok).toBe(true);
  expect(revoked).toEqual(["advisor"]);
  expect(audits.at(-1)).toEqual(["active"]);
});
