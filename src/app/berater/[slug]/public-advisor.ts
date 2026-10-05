import { notFound } from "next/navigation";
import { publicCatalog } from "@/shared/web/profile-catalog";

export async function loadPublicAdvisor(slug: string) {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  const result = await publicCatalog().getPublicAdvisorBySlug(normalized);
  if (!result.ok || !result.value) notFound();
  return result.value;
}

export function advisorPath(slug: string, suffix = "") {
  const root = "/berater/" + encodeURIComponent(slug);
  return suffix ? root + "/" + suffix.replace(/^\/+/, "") : root;
}

export function phoneHref(phone: string) {
  return "tel:" + phone.replace(/[^+\d]/g, "");
}

export function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? "https://wa.me/" + digits : null;
}

export type PublicAdvisorView = Awaited<ReturnType<typeof loadPublicAdvisor>>;
