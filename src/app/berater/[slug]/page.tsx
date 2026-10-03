import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { publicCatalog } from "@/shared/web/profile-catalog";
import { DVAG_PARTNERS, DVAG_PARTNER_SOURCE } from "@/content/dvag-partners";
import styles from "./advisor.module.css";
import { Faq } from "../../faq";

export const dynamic = "force-dynamic";

export default async function AdvisorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await publicCatalog().getPublicAdvisorBySlug(slug);
  if (!result.ok || !result.value) notFound();

  const advisor = result.value;
  const productPartners = DVAG_PARTNERS.filter(item => item.category === "PRODUCT_PARTNER");
  const cooperations = DVAG_PARTNERS.filter(item => item.category === "COOPERATION");
  const accent = advisor.accentColor ?? "#1F5F8B";
  const bookingHref = "/book?advisor=" + encodeURIComponent(advisor.profile.id);
  const vcardHref = "/api/public/advisors/" + encodeURIComponent(slug) + "/vcard";

  return <div className={styles.page} style={{"--accent":accent} as CSSProperties}>
    <a className={styles.skip} href="#main">Zum Inhalt springen</a>
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <a className={styles.brand} href="#top" aria-label={advisor.profile.name+" – Start"}>
          <span className={styles.brandMark}>{advisor.profile.name.slice(0,1).toUpperCase()}</span>
          <span><strong>{advisor.profile.name}</strong><small>{advisor.profile.title}</small></span>
        </a>
        <nav className={styles.nav} aria-label="Seitennavigation">
          <a href="#beratung">Beratung</a>
          <a href="#ueber-mich">Über mich</a>
          <a href="#kontakt">Kontakt</a>
          <a href="#faq">FAQ</a>
          {advisor.showDvagPartners&&<a href="#partner">Netzwerk</a>}
        </nav>
        <Link className={styles.headerCta} href={bookingHref}>Termin buchen</Link>
      </div>
    </header>

    <main id="main">
      <section id="top" className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Persönliche Beratung · individuell planbar</p>
          <h1>{advisor.profile.name}</h1>
          <p className={styles.role}>{advisor.profile.title}</p>
          <p className={styles.lead}>{advisor.profile.shortDescription}</p>
          <div className={styles.actions}>
            <Link className={styles.button} href={bookingHref}>Termin vereinbaren <span aria-hidden="true">→</span></Link>
            {advisor.digitalCardEnabled&&<a className={styles.button+" "+styles.secondary} href={vcardHref}>Kontakt speichern</a>}
          </div>
          <ul className={styles.trustList} aria-label="Vorteile">
            <li>Direkte Online-Terminwahl</li>
            <li>Keine Kontoerstellung nötig</li>
            <li>Sichere Terminverwaltung per persönlichem Link</li>
          </ul>
        </div>
        <div className={styles.portraitFrame}>
          {advisor.profile.imageKey
            ? <Image className={styles.portrait} unoptimized src={"/api/profile-images/"+encodeURIComponent(advisor.profile.imageKey)}
                alt={"Profilbild von "+advisor.profile.name} width={640} height={800} priority/>
            : <div className={styles.portraitFallback} aria-hidden="true">{advisor.profile.name.slice(0,1).toUpperCase()}</div>}
        </div>
      </section>

      <section id="beratung" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>Accompagnement</p>
          <h2>Beratung und Leistungen</h2>
          <p>Wählen Sie das Gespräch, das zu Ihrem Anliegen passt. Die tatsächlich verfügbaren Zeiten werden anschließend live berechnet.</p>
        </div>
        <div className={styles.serviceGrid}>
          {advisor.services.map(service=><article className={styles.serviceCard} key={service.id}>
            <span className={styles.duration}>{service.durationMinutes} Min.</span>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <Link href={bookingHref}>Termin auswählen <span aria-hidden="true">→</span></Link>
          </article>)}
        </div>
      </section>

      <section id="ueber-mich" className={styles.section+" "+styles.softSection}>
        <div className={styles.twoColumns}>
          <div><p className={styles.kicker}>Über mich</p><h2>Persönliche Begleitung</h2></div>
          <div><p className={styles.largeText}>{advisor.aboutText||advisor.profile.shortDescription}</p></div>
        </div>
      </section>

      <section id="kontakt" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>Kontakt</p>
          <h2>Direkt erreichbar</h2>
          <p>Für Terminänderungen verwenden Kundinnen und Kunden den sicheren Link aus ihrer Terminbestätigung.</p>
        </div>
        <div className={styles.contactGrid}>
          {advisor.publicEmail&&<a className={styles.contactCard} href={"mailto:"+advisor.publicEmail}><span>E-Mail</span><strong>{advisor.publicEmail}</strong></a>}
          {advisor.publicPhone&&<a className={styles.contactCard} href={"tel:"+advisor.publicPhone.replace(/[^+\d]/g,"")}><span>Telefon</span><strong>{advisor.publicPhone}</strong></a>}
          {advisor.publicWebsite&&<a className={styles.contactCard} href={advisor.publicWebsite} target="_blank" rel="noreferrer"><span>Website</span><strong>Website öffnen</strong></a>}
          {advisor.publicAddress&&<div className={styles.contactCard}><span>Adresse</span><strong>{advisor.publicAddress}</strong></div>}
        </div>
        {advisor.digitalCardEnabled&&<div id="karte" className={styles.digitalCard}>
          <div><p className={styles.kicker}>Digitale Visitenkarte</p><h3>Kontakt mit einem Klick speichern</h3><p>Die vCard enthält nur die öffentlichen Kontaktdaten dieses Profils.</p></div>
          <a className={styles.button+" "+styles.secondary} href={vcardHref}>vCard herunterladen</a>
        </div>}
      </section>
      <div id="faq"><Faq title="Fragen vor dem Termin" /></div>

      {advisor.showDvagPartners&&<section id="partner" className={styles.section+" "+styles.partnerSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>Netzwerk</p>
          <h2>Produktpartner und Kooperationen der DVAG</h2>
          <p className={styles.partnerNote}>Die Darstellung beschreibt das Netzwerk der Deutschen Vermögensberatung und keine individuelle persönliche Partnerschaft des einzelnen Beraters. Quelle: <a href={DVAG_PARTNER_SOURCE.url} target="_blank" rel="noreferrer">{DVAG_PARTNER_SOURCE.label}</a>, geprüft am {DVAG_PARTNER_SOURCE.verifiedAt}.</p>
        </div>
        <div className={styles.partnerGroup}><h3>Produktpartner</h3><div className={styles.partnerGrid}>
          {productPartners.map(item=><a className={styles.partnerCard} key={item.name} href={item.url} target="_blank" rel="noreferrer"><strong>{item.name}</strong><span>{item.field}</span></a>)}
        </div></div>
        <div className={styles.partnerGroup}><h3>Weitere Kooperationen</h3><div className={styles.partnerGrid}>
          {cooperations.map(item=><a className={styles.partnerCard} key={item.name} href={item.url} target="_blank" rel="noreferrer"><strong>{item.name}</strong><span>{item.field}</span></a>)}
        </div></div>
      </section>}

      <section className={styles.finalCta}>
        <div><p className={styles.kicker}>Nächster Schritt</p><h2>Passenden Termin finden</h2><p>Die verfügbaren Tage und Uhrzeiten werden aus dem Kalender des gewählten Beraters berechnet.</p></div>
        <Link className={styles.button+" "+styles.lightButton} href={bookingHref}>Termin buchen</Link>
      </section>
    </main>

    <footer className={styles.footer}>
      <span>{advisor.profile.name}</span>
      <nav aria-label="Rechtliche Informationen"><Link href="/datenschutz">Datenschutz</Link><Link href="/impressum">Impressum</Link></nav>
    </footer>
  </div>;
}
