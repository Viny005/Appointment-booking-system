import sharp from "sharp";
import type { ImageProcessor } from "../application/images";

function significantAlphaBounds(data: Buffer, width: number, height: number) {
  const rowMinimum = Math.max(4, Math.ceil(width * 0.03));
  const columnMinimum = Math.max(4, Math.ceil(height * 0.03));
  const rows = new Uint32Array(height);
  const columns = new Uint32Array(width);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 128) continue;
      rows[y]++;
      columns[x]++;
    }
  }

  let top = 0;
  while (top < height && rows[top] < rowMinimum) top++;
  let bottom = height - 1;
  while (bottom >= top && rows[bottom] < rowMinimum) bottom--;
  let left = 0;
  while (left < width && columns[left] < columnMinimum) left++;
  let right = width - 1;
  while (right >= left && columns[right] < columnMinimum) right--;

  if (top > bottom || left > right) return null;
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

export const sharpImageProcessor: ImageProcessor = {
  async sanitize(input) {
    const source = sharp(input, { limitInputPixels: 16_777_216, animated: false, failOn: "warning" });
    const metadata = await source.metadata();

    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
      throw new Error("Nicht unterstütztes Bildformat.");
    }
    if (!metadata.width || !metadata.height || metadata.width > 4096 || metadata.height > 4096 || metadata.width * metadata.height > 16_777_216) {
      throw new Error("Bildabmessungen überschreiten die zulässige Grenze.");
    }
    if ((metadata.pages ?? 1) !== 1) {
      throw new Error("Animierte oder mehrseitige Bilder sind nicht erlaubt.");
    }

    const rotated = await sharp(input, { limitInputPixels: 16_777_216, animated: false, failOn: "warning" })
      .rotate()
      .toBuffer();

    const { data, info } = await sharp(rotated).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const bounds = info.width >= 3 && info.height >= 3
      ? significantAlphaBounds(data, info.width, info.height)
      : null;

    let normalized = sharp(rotated);
    if (bounds && (bounds.left !== 0 || bounds.top !== 0 || bounds.width !== info.width || bounds.height !== info.height)) {
      normalized = normalized.extract(bounds);
    }

    return normalized.webp({ quality: 85, effort: 4 }).toBuffer();
  },
};
