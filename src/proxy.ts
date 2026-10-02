import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = randomBytes(24).toString("base64"), development = process.env.NODE_ENV === "development";
  const csp = ["default-src 'self'", "base-uri 'none'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`, "img-src 'self'", "font-src 'self'", `connect-src 'self'${development ? " ws: wss:" : ""}`].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce); headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  if (process.env.HSTS_ENABLED === "true" && process.env.NODE_ENV === "production") {
    const origin = new URL(process.env.BETTER_AUTH_URL ?? "");
    if (origin.protocol !== "https:") throw new Error("HSTS requires approved HTTPS origin");
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
