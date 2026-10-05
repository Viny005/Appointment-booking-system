import { describe, expect, it } from "vitest";
import { PUBLIC_RESOURCES } from "@/content/public-resources";

const allowedHosts = new Set([
  "kundenportal.dvag",
  "www.dvag.de",
  "www.dvag-karriere.de",
  "www.generali.de",
  "europa.eu",
]);

describe("public external resources", () => {
  it("uses only HTTPS destinations on the approved official host allowlist", () => {
    for (const resource of Object.values(PUBLIC_RESOURCES)) {
      const url = new URL(resource.url);
      expect(url.protocol, resource.label).toBe("https:");
      expect(allowedHosts.has(url.hostname), resource.label + " -> " + url.hostname).toBe(true);
      expect(url.username, resource.label).toBe("");
      expect(url.password, resource.label).toBe("");
    }
  });

  it("keeps resource URLs unique", () => {
    const urls = Object.values(PUBLIC_RESOURCES).map(resource => resource.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
