import { redirect } from "next/navigation";
import { advisorPath } from "../public-advisor";

export const dynamic = "force-dynamic";

export default async function ServiceRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(advisorPath(slug, "service-hilfe"));
}
