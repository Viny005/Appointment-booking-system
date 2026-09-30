import { expect, it, vi } from "vitest";
import { PublicCatalog } from "@/modules/profiles/application/catalog";
import type { CatalogRepository } from "@/modules/profiles/application/ports";
import type { ProfileAggregate, ProfileRelation } from "@/modules/profiles/domain/model";
import { profile, relation, service } from "../fixtures/catalog";

function catalog(profiles: ProfileAggregate[], relations: ProfileRelation[] = []) {
  const getRelations = vi.fn(async (sourceProfileId: string) => relations.filter(row => row.sourceProfileId === sourceProfileId));
  const repo: CatalogRepository = { read: work => work({ listProfiles: async () => profiles, getProfile: async id => profiles.find(row => row.profile.id === id) ?? null, getRelations }), write: async () => { throw new Error("read only"); } };
  return { useCases: new PublicCatalog(repo), getRelations };
}
const primary = { profile: profile(), services: [service()] };
const secondary = { profile: profile({ id: "p2" }), services: [service({ id: "s2", advisorProfileId: "p2" })] };
it("only exposes active complete profiles with valid active services", async () => {
  const { useCases } = catalog([primary, { ...secondary, profile: profile({ id: "p2", status: "DRAFT" }) }, { profile: profile({ id: "p3", status: "INACTIVE" }), services: [service()] }, { profile: profile({ id: "p4" }), services: [] }]);
  const result = await useCases.listBookableProfiles();
  expect(result.ok && result.value.map(p => p.id)).toEqual(["p1"]);
  expect(JSON.stringify(result)).not.toMatch(/notificationEmail|userId|example.test/);
});
it.each(["DRAFT", "INACTIVE"] as const)("hides services of a %s profile", async status => expect(await catalog([{ ...primary, profile: profile({ status }) }]).useCases.listProfileServices("p1")).toEqual({ ok: true, value: [] }));
it("hides inactive services, other profiles and private meeting URLs", async () => {
  const { useCases } = catalog([{ ...primary, services: [service({ onlineUrl: "https://private.example.test" }), service({ id: "inactive", active: false })] }, secondary]);
  const result = await useCases.listProfileServices("p1");
  expect(result.ok && result.value.map(s => s.id)).toEqual(["s1"]); expect(JSON.stringify(result)).not.toContain("private.example.test");
});
it("only resolves direct active proposed relationships", async () => {
  const { useCases, getRelations } = catalog([primary, secondary, { profile: profile({ id: "p3" }), services: [service()] }], [relation(), relation({ id: "r2", sourceProfileId: "p2", targetProfileId: "p3" })]);
  const result = await useCases.resolveParticipantOptions("p1");
  expect(result.ok && result.value.options.map(o => o.profile.id)).toEqual(["p2"]);
  expect(getRelations).toHaveBeenCalledExactlyOnceWith("p1");
});
it("does not synthesize a reverse relation", async () => expect((await catalog([primary, secondary], [relation()]).useCases.resolveParticipantOptions("p2"))).toMatchObject({ ok: true, value: { options: [] } }));
it.each([{ active: false }, { proposedToClient: false }])("ignores optional relations not offered: %j", async patch => expect(await catalog([primary, secondary], [relation(patch)]).useCases.resolveParticipantOptions("p1")).toMatchObject({ ok: true, value: { options: [] } }));
it("hides inactive optional targets", async () => expect(await catalog([primary, { ...secondary, profile: profile({ id: "p2", status: "INACTIVE" }) }], [relation()]).useCases.resolveParticipantOptions("p1")).toMatchObject({ ok: true, value: { options: [] } }));
it("blocks unavailable mandatory targets even when not proposed", async () => expect(await catalog([primary, { ...secondary, profile: profile({ id: "p2", status: "INACTIVE" }) }], [relation({ clientCanRemove: false, defaultSelected: true, proposedToClient: false })]).useCases.resolveParticipantOptions("p1")).toMatchObject({ ok: false, error: { code: "REQUIRED_PARTICIPANT_UNAVAILABLE" } }));
it("retains hidden mandatory participants separately from selectable options", async () => {
  const result = await catalog([primary, secondary], [relation({ clientCanRemove: false, defaultSelected: true, proposedToClient: false })]).useCases.resolveParticipantOptions("p1");
  expect(result).toMatchObject({ ok: true, value: { options: [], requiredParticipants: [{ id: "p2" }] } });
});
it("preserves default/removable flags", async () => expect(await catalog([primary, secondary], [relation({ defaultSelected: true })]).useCases.resolveParticipantOptions("p1")).toMatchObject({ ok: true, value: { options: [{ defaultSelected: true, clientCanRemove: true }] } }));
