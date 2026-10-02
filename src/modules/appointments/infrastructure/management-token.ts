import { createHash, randomBytes } from "node:crypto";

export function generateManagementToken() {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: createHash("sha256").update(raw, "utf8").digest("hex") };
}
