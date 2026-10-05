import { publicCatalog } from "@/shared/web/profile-catalog";

const esc = (value: string) => value
  .replace(/\\/g, "\\\\")
  .replace(/\r\n?|\n/g, "\\n")
  .replace(/,/g, "\\,")
  .replace(/;/g, "\\;");

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  const result = await publicCatalog().getPublicAdvisorBySlug(normalized);
  if (!result.ok || !result.value || !result.value.digitalCardEnabled) {
    return new Response("Not found", { status: 404 });
  }

  const a = result.value;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(a.profile.name)}`,
    `TITLE:${esc(a.profile.title)}`,
  ];
  if (a.publicEmail) lines.push(`EMAIL;TYPE=INTERNET:${esc(a.publicEmail)}`);
  if (a.publicPhone) lines.push(`TEL;TYPE=WORK,VOICE:${esc(a.publicPhone)}`);
  if (a.publicWebsite) lines.push(`URL:${esc(a.publicWebsite)}`);
  if (a.publicAddress) lines.push(`ADR;TYPE=WORK:;;${esc(a.publicAddress)};;;;`);
  lines.push("END:VCARD");

  const safeFilename = normalized.replace(/[^a-z0-9-]/g, "") || "kontakt";
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}.vcf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
