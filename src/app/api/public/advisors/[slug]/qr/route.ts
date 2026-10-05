import QRCode from "qrcode";
import { publicCatalog } from "@/shared/web/profile-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  const result = await publicCatalog().getPublicAdvisorBySlug(normalized);
  if (!result.ok || !result.value || !result.value.digitalCardEnabled) {
    return new Response("Not found", { status: 404 });
  }

  let origin: string;
  try {
    origin = new URL(process.env.BETTER_AUTH_URL ?? new URL(request.url).origin).origin;
  } catch {
    return new Response("QR configuration unavailable", { status: 503 });
  }
  const publicUrl = new URL("/berater/" + encodeURIComponent(normalized) + "/karte", origin).toString();
  const svg = await QRCode.toString(publicUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: { dark: "#122737", light: "#ffffff" },
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
