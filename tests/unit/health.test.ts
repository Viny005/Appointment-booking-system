import { expect, it } from "vitest";
import { checkHealth } from "@/shared/application/check-health";

it("reports a successful DB probe", async () => expect(await checkHealth({ check: async () => {} })).toBe(true));
it("does not expose database errors", async () => expect(await checkHealth({ check: async () => { throw new Error("private connection details"); } })).toBe(false));
