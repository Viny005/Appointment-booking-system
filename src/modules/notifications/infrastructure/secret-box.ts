import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { SecretBox } from "../application/ports";
export function aesSecretBox(keyBase64: string): SecretBox {
  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== 32 || key.toString("base64") !== keyBase64) throw new Error("OUTBOX_ENCRYPTION_KEY must contain 32 random bytes encoded as base64");
  return {
    seal(plaintext, context) { const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key, iv); cipher.setAAD(Buffer.from(context)); const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]); return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join("."); },
    open(encoded, context) { const [version, iv, tag, data, extra] = encoded.split("."); if (version !== "v1" || !iv || !tag || !data || extra) throw new Error("Invalid secret payload"); const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url")); decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(Buffer.from(tag, "base64url")); return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8"); },
  };
}
export const secretContext = (id: string, appointmentId: string, recipient: string) => JSON.stringify([id, appointmentId, recipient]);
