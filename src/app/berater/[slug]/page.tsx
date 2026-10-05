/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { publicCatalog } from "@/shared/web/profile-catalog";
import { DVAG_PARTNERS, DVAG_PARTNER_SOURCE } from "@/content/dvag-partners";
import styles from "./advisor.module.css";
import { Faq } from "../../faq";
import { advisorPath } from "./public-advisor";

export const dynamic = "force-dynamic";

export default async function AdvisorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await publicCatalog().getPublicAdvisorBySlug(slug);
  if (!result.ok || !result.value) notFound();

  const advisor = result.value;
  const productPartners = DVAG_PARTNERS.filter(item => item.category === "PRODUCT_PARTNER");
  const cooperations = DVAG_PARTNERS.filter(item => item.category === "COOPERATION");
  const accent = /^#[0-9A-Fa-f]{6}$/.test(advisor.accentColor ?? "") ? advisor.accentColor! : "#1F5F8B";
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const bookingHref = "/book?advisor=" + encodeURIComponent(advisor.profile.id);

  return <div id="advisor-page" className={styles.page}>
    <style nonce={nonce}>{`#advisor-page{--accent:${accent}}`}</style>
    <a className={styles.skip} href="#main">Zum Inhalt springen</a>
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <a className={styles.brand} href="#top" aria-label={advisor.profile.name+" – Start"}>
          <span className={styles.brandMark}>{advisor.profile.name.slice(0,1).toUpperCase()}</span>
          <span><strong>{advisor.profile.name}</strong><small>{advisor.profile.title}</small></span>
        </a>
        <nav className={styles.nav} aria-label="Seitennavigation">
          <Link prefetch={false} href={advisorPath(slug,"themen")}>Themen</Link>
          <Link prefetch={false} href={advisorPath(slug,"ansatz")}>Ansatz</Link>
          <Link prefetch={false} href={advisorPath(slug,"ueber-mich")}>Über mich</Link>
          <Link prefetch={false} href={advisorPath(slug,"kontakt")}>Kontakt</Link>
          <Link prefetch={false} href={advisorPath(slug,"kundenbereich")}>Kundenbereich</Link>
          <Link prefetch={false} href={advisorPath(slug,"rechner")}>Rechner</Link>
          <Link prefetch={false} href={advisorPath(slug,"sos")}>SOS</Link>
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
            {advisor.digitalCardEnabled&&<Link className={styles.button+" "+styles.secondary} prefetch={false} href={advisorPath(slug,"karte")}>Digitale Karte</Link>}
          </div>
          <ul className={styles.trustList} aria-label="Vorteile">
            <li>Direkte Online-Terminwahl</li>
            <li>Keine Kontoerstellung nötig</li>
            <li>Sichere Terminverwaltung per persönlichem Link</li>
          </ul>
        </div>
        <div className={styles.portraitFrame}>
          {advisor.profile.imageKey
            ? <img className={styles.portrait} src={"/api/profile-images/"+encodeURIComponent(advisor.profile.imageKey)}
                alt={"Profilbild von "+advisor.profile.name} width={640} height={800} fetchPriority="high" decoding="async"/>
            : <div className={styles.portraitFallback} aria-hidden="true">{advisor.profile.name.slice(0,1).toUpperCase()}</div>}
        </div>
      </section>

      <section id="beratung" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>Begleitung</p>
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
          <Link className={styles.button+" "+styles.secondary} prefetch={false} href={advisorPath(slug,"karte")}>Digitale Karte öffnen</Link>
        </div>}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>Mehr entdecken</p>
          <h2>Informationen und Werkzeuge</h2>
          <p>Wie auf einer persönlichen Beratungsseite sind die wichtigsten Bereiche direkt miteinander verknüpft.</p>
        </div>
        <div className={styles.serviceGrid}>
          <article className={styles.serviceCard}><h3>Über mich</h3><p>Profil, Arbeitsweise und persönliche Begleitung.</p><Link prefetch={false} href={advisorPath(slug,"ueber-mich")}>Mehr erfahren →</Link></article>
          <article className={styles.serviceCard}><h3>Ansatz</h3><p>So wird ein Gespräch strukturiert vorbereitet.</p><Link prefetch={false} href={advisorPath(slug,"ansatz")}>Ablauf ansehen →</Link></article>
          <article className={styles.serviceCard}><h3>Kundenbereich</h3><p>Termin, Vorbereitung und offizielles DVAG Kundenportal.</p><Link prefetch={false} href={advisorPath(slug,"kundenbereich")}>Kundenbereich →</Link></article>
          <article className={styles.serviceCard}><h3>Vorbereitung</h3><p>Vier datensparsame Fragen für ein strukturiertes Gespräch.</p><Link prefetch={false} href={advisorPath(slug,"vorbereitung")}>Checkliste öffnen →</Link></article>
          <article className={styles.serviceCard}><h3>Rechner</h3><p>Budget, Sparziel und Reserve lokal im Browser berechnen.</p><Link prefetch={false} href={advisorPath(slug,"rechner")}>Rechner öffnen →</Link></article>
          <article className={styles.serviceCard}><h3>Service & Hilfe</h3><p>Verifizierte Links zu offiziellen Kunden- und Serviceangeboten.</p><Link prefetch={false} href={advisorPath(slug,"service-hilfe")}>Serviceübersicht →</Link></article>
          <article className={styles.serviceCard}><h3>SOS & Assistance</h3><p>Notruf 112 klar von vertraglichen Assistance- und Servicefällen trennen.</p><Link prefetch={false} href={advisorPath(slug,"sos")}>SOS-Seite öffnen →</Link></article>
          <article className={styles.serviceCard}><h3>Karriere</h3><p>Verifizierte Links zu den offiziellen DVAG-Karriereseiten.</p><Link prefetch={false} href={advisorPath(slug,"karriere")}>Karriereinfos →</Link></article>
        </div>
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
