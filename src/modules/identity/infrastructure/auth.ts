import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { PrismaClient } from "@/generated/prisma/client";
import { getDatabase } from "@/shared/infrastructure/database";
import { aesSecretBox } from "@/modules/notifications/infrastructure/secret-box";
import { queuePasswordReset } from "./password-reset";

export function authSettings(env: NodeJS.ProcessEnv = process.env) {
  const secret = env.BETTER_AUTH_SECRET;
  const baseURL = env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || secret.startsWith("REPLACE_")) throw new Error("Configure a random BETTER_AUTH_SECRET of at least 32 characters");
  if (!baseURL) throw new Error("BETTER_AUTH_URL is required");
  const url = new URL(baseURL);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("BETTER_AUTH_URL must be an origin");
  if (url.protocol !== "https:" && !(env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) throw new Error("Use HTTPS except for local development");
  return {
    secret, baseURL: url.origin, trustedOrigins: [url.origin],
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 16, revokeSessionsOnPasswordReset: true, resetPasswordTokenExpiresIn: 1800 },
    session: { expiresIn: 8 * 60 * 60, disableSessionRefresh: true, cookieCache: { enabled: false },
      additionalFields: { securityGeneration: { type: "number" as const, defaultValue: 0, input: false } } },
    verification: { storeIdentifier: "hashed" as const },
    user: { additionalFields: {
      role: { type: ["ADMIN", "ADVISOR"] as ("ADMIN" | "ADVISOR")[], defaultValue: "ADVISOR", input: false },
      active: { type: "boolean" as const, defaultValue: true, input: false },
    } },
  };
}
export function createAuth(database: PrismaClient, env: NodeJS.ProcessEnv = process.env) {
  const settings = authSettings(env);
  return betterAuth({
    ...settings,
    emailAndPassword: {
      ...settings.emailAndPassword,
      sendResetPassword: async ({ user, url, token }) => {
        await queuePasswordReset(database, aesSecretBox(env.OUTBOX_ENCRYPTION_KEY ?? ""), { userId: user.id, email: user.email, url, token });
      },
      onPasswordReset: async ({ user }) => {
        await database.$transaction(async tx => {
          await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
          await tx.verification.deleteMany({ where: { value: user.id } });
          await tx.notification.updateMany({ where: { type: "PASSWORD_RESET", recipientCategory: "USER", recipientEmail: user.email, status: "PENDING" },
            data: { status: "SUPERSEDED", secretCipher: null, secretExpiresAt: null, secretTokenHash: null } });
          await tx.user.update({ where: { id: user.id }, data: { passwordMutationPending: false } });
        });
      },
    },
    database: prismaAdapter(database, { provider: "postgresql" }),
    databaseHooks: {
      session: { create: { before: async (session) => {
        const user = await database.user.findUnique({ where: { id: session.userId }, select: { active: true, securityGeneration: true, passwordMutationPending: true } });
        if (!user?.active || user.passwordMutationPending) return false;
        return { data: { ...session, securityGeneration: user.securityGeneration } };
      } } },
    },
  });
}
let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return auth ??= createAuth(getDatabase()); }
