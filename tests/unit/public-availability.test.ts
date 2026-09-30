import { describe, expect, it, vi } from "vitest";
import { PublicAvailability, type Selection } from "@/modules/availability/application/availability";
import type { AvailabilityRepository, AvailabilityReader, OccupancyReader } from "@/modules/availability/application/ports";
import { instant, timeRange } from "@/modules/availability/domain/values";
import type { Schedule } from "@/modules/availability/domain/engine";

const selection: Selection = { primaryProfileId: "a", serviceId: "service", participantIds: ["a"] };
function setup(busy = [] as { start: number; end: number }[], duration: number | null = 60) {
  const a: Schedule = { version: 0, weekly: [{ weekday: 1, ...timeRange("09:00", "12:00") }], exceptions: [] };
  const b: Schedule = { version: 0, weekly: [{ weekday: 1, ...timeRange("11:00", "14:00") }], exceptions: [] };
  const reader: AvailabilityReader = { actor: async () => null, publicSelection: async () => duration,
    schedules: async ids => new Map(ids.map(id => [id, id === "a" ? a : b])) };
  const repository: AvailabilityRepository = { read: work => work(reader), write: async () => { throw new Error("No public mutations"); } };
  const occupancy = { read: vi.fn<OccupancyReader["read"]>(async () => busy) }, now = vi.fn(() => instant("2026-10-01T00:00:00Z"));
  return { api: new PublicAvailability(repository, occupancy, now), occupancy, now };
}
describe("UC-04 public availability projections", () => {
  it("returns only days that have a complete eligible slot", async () => {
    const { api, now } = setup(); expect(await api.getBookableDays(selection, "2026-10-05", "2026-10-06")).toEqual({ ok: true, value: ["2026-10-05"] }); expect(now).toHaveBeenCalledTimes(1);
  });
  it("reads only actual participants and changes intersection when explicitly added", async () => {
    const { api, occupancy } = setup();
    const result = await api.getBookableSlots({ ...selection, participantIds: ["a", "b"] }, "2026-10-05");
    expect(result.ok && result.value.map(s => s.localTime)).toEqual(["11:00"]);
    expect(occupancy.read.mock.calls[0][0]).toEqual(["a", "b"]);
  });
  it("removes occupancy and exposes no administration data", async () => {
    const { api } = setup([{ start: instant("2026-10-05T07:00:00Z"), end: instant("2026-10-05T09:00:00Z") }]);
    const result = await api.getBookableSlots(selection, "2026-10-05");
    expect(result.ok && result.value.map(s => s.localTime)).toEqual(["11:00"]);
    if (result.ok) expect(Object.keys(result.value[0]).sort()).toEqual(["startUtc", "endUtc", "localDate", "localTime", "offset", "timeZone"].sort());
  });
  it("fails closed for inactive/missing selection", async () => expect(await setup([], null).api.getBookableSlots(selection, "2026-10-05")).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } }));
  it("validates ranges and primary participant", async () => {
    const { api } = setup();
    expect(await api.getBookableDays(selection, "2026-10-06", "2026-10-05")).toMatchObject({ ok: false });
    expect(await api.getBookableDays(selection, "2026-01-01", "2027-01-01")).toMatchObject({ ok: false });
    expect(await api.getBookableSlots({ ...selection, participantIds: ["a", "a"] }, "2026-10-05")).toMatchObject({ ok: false });
    expect(await api.getBookableSlots({ ...selection, participantIds: ["b"] }, "2026-10-05")).toMatchObject({ ok: false });
  });
});
