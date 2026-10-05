import type { Metadata } from "next";
import { publicCatalog } from "@/shared/web/profile-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  const result = await publicCatalog().getPublicAdvisorBySlug(normalized);
  if (!result.ok || !result.value) return { title: "Beraterprofil" };

  const advisor = result.value;
  return {
    title: advisor.profile.name + " | " + advisor.profile.title,
    description: advisor.profile.shortDescription,
  };
}

export default function PublicAdvisorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
