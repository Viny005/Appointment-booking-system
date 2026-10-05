import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { ProfileImages } from "@/modules/profile-images/application/images";
import { sharpImageProcessor } from "@/modules/profile-images/infrastructure/sharp";

describe("profile image pipeline", () => {
  it("re-encodes a bounded PNG to metadata-free WebP", async () => {
    const png = await sharp({
      create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 255, b: 255 } },
    }).png().toBuffer();

    const out = await sharpImageProcessor.sanitize(png);
    expect(out.subarray(8, 12).toString()).toBe("WEBP");
  });

  it("trims transparent padding from uploaded portraits", async () => {
    const portrait = await sharp({
      create: { width: 100, height: 100, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([
      {
        input: await sharp({
          create: { width: 30, height: 40, channels: 4, background: { r: 220, g: 220, b: 220, alpha: 1 } },
        }).png().toBuffer(),
        left: 0,
        top: 60,
      },
      {
        input: await sharp({
          create: { width: 1, height: 1, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
        }).png().toBuffer(),
        left: 99,
        top: 0,
      },
    ]).png().toBuffer();

    const out = await sharpImageProcessor.sanitize(portrait);
    const metadata = await sharp(out).metadata();
    expect(metadata.width).toBe(30);
    expect(metadata.height).toBe(40);
  });

  it("rejects disallowed media before storage", async () => {
    let writes = 0;
    const api = new ProfileImages(
      { put: async () => { writes++; }, remove: async () => {}, read: async () => null },
      sharpImageProcessor,
      () => "00000000-0000-4000-8000-000000000000",
    );
    await expect(api.prepare({
      size: 20,
      type: "image/svg+xml",
      arrayBuffer: async () => new ArrayBuffer(20),
    })).rejects.toThrow();
    expect(writes).toBe(0);
  });

  it("rejects files over five MiB before decode", async () => {
    const api = new ProfileImages(
      { put: async () => {}, remove: async () => {}, read: async () => null },
      sharpImageProcessor,
      () => "00000000-0000-4000-8000-000000000000",
    );
    await expect(api.prepare({
      size: 5 * 1024 * 1024 + 1,
      type: "image/png",
      arrayBuffer: async () => new ArrayBuffer(0),
    })).rejects.toThrow(/5 MiB/);
  });
});
