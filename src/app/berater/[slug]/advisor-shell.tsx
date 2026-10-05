import Link from "next/link";
import type { ReactNode } from "react";
import { advisorPath, type PublicAdvisorView } from "./public-advisor";
import styles from "./public-subpage.module.css";

type Props = {
  advisor: PublicAdvisorView;
  slug: string;
  current?: string;
  children: ReactNode;
};

const nav = [
  ["themen", "Themen"],
  ["ansatz", "Ansatz"],
  ["ueber-mich", "Über mich"],
  ["kontakt", "Kontakt"],
  ["karte", "Karte"],
  ["kundenbereich", "Kundenbereich"],
  ["service-hilfe", "Service"],
  ["rechner", "Rechner"],
  ["karriere", "Karriere"],
  ["sos", "SOS & Hilfe"],
] as const;

export function AdvisorShell({ advisor, slug, current, children }: Props) {
  const bookingHref = "/book?advisor=" + encodeURIComponent(advisor.profile.id);
  return <div className={styles.page}>
    <a className={styles.skip} href="#main">Zum Inhalt springen</a>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href={advisorPath(slug)} prefetch={false}>
          <span className={styles.mark} aria-hidden="true">{advisor.profile.name.slice(0, 1).toUpperCase()}</span>
          <span><strong>{advisor.profile.name}</strong><small>{advisor.profile.title}</small></span>
        </Link>
        <nav className={styles.nav} aria-label="Öffentliche Profilnavigation">
          {nav.filter(([path]) => path !== "karte" || advisor.digitalCardEnabled).map(([path, label]) =>
            <Link key={path} aria-current={current === path ? "page" : undefined} href={advisorPath(slug, path)} prefetch={false}>{label}</Link>
          )}
        </nav>
        <Link className={styles.headerCta} href={bookingHref} prefetch={false}>Termin buchen</Link>
      </div>
    </header>

    <main id="main">{children}</main>

    <footer className={styles.footer}>
      <div><strong>{advisor.profile.name}</strong><span>{advisor.profile.title}</span></div>
      <nav aria-label="Footer-Navigation">
        <Link href={advisorPath(slug)} prefetch={false}>Profil</Link>
        <Link href={advisorPath(slug,"vorbereitung")} prefetch={false}>Vorbereitung</Link>
        <Link href={advisorPath(slug,"service-hilfe")} prefetch={false}>Service & Hilfe</Link>
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/impressum">Impressum</Link>
      </nav>
    </footer>
  </div>;
}
