import Link from "next/link";
import { Faq } from "../../../faq";
import { PUBLIC_RESOURCES, PUBLIC_RESOURCE_VERIFICATION } from "@/content/public-resources";
import { AdvisorShell } from "../advisor-shell";
import { advisorPath, loadPublicAdvisor, phoneHref, whatsappHref } from "../public-advisor";
import styles from "../public-subpage.module.css";

export const dynamic = "force-dynamic";

export default async function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  const whatsapp = advisor.publicPhone ? whatsappHref(advisor.publicPhone) : null;
  return <AdvisorShell advisor={advisor} slug={slug} current="kontakt">
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>Kontakt</p><h1>Der passende Weg für Ihr Anliegen.</h1><p className={styles.lead}>Es werden nur Kontaktdaten angezeigt, die für dieses Profil ausdrücklich als öffentlich hinterlegt wurden.</p>
      <div className={styles.actions}><Link className={styles.primary} href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Termin buchen</Link>{advisor.digitalCardEnabled&&<Link className={styles.secondary} href={advisorPath(slug,"karte")}>Digitale Karte</Link>}</div></div>
      <aside className={styles.heroAside}><strong>Termin ändern oder absagen?</strong><p>Bitte verwenden Sie den persönlichen Verwaltungslink aus Ihrer Terminbestätigung. Der Token wird nicht öffentlich auf dieser Seite abgefragt.</p></aside>
    </section>
    <section className={styles.section}>
      <div className={styles.sectionIntro}><p className={styles.eyebrow}>Direkt erreichbar</p><h2>Öffentliche Kontaktwege</h2></div>
      <div className={styles.contactGrid}>
        {advisor.publicEmail&&<a className={styles.contact} href={"mailto:"+advisor.publicEmail}><span>E-Mail</span><strong>{advisor.publicEmail}</strong></a>}
        {advisor.publicPhone&&<a className={styles.contact} href={phoneHref(advisor.publicPhone)}><span>Telefon</span><strong>{advisor.publicPhone}</strong></a>}
        {whatsapp&&<a className={styles.contact} href={whatsapp} target="_blank" rel="noreferrer"><span>WhatsApp</span><strong>Chat öffnen</strong></a>}
        {advisor.publicWebsite&&<a className={styles.contact} href={advisor.publicWebsite} target="_blank" rel="noreferrer"><span>Website</span><strong>Website öffnen</strong></a>}
        {advisor.publicAddress&&<div className={styles.contact}><span>Adresse</span><strong>{advisor.publicAddress}</strong></div>}
      </div>
      {!advisor.publicEmail&&!advisor.publicPhone&&!advisor.publicWebsite&&!advisor.publicAddress&&<p className={styles.notice}>Für dieses Profil wurden noch keine direkten öffentlichen Kontaktdaten freigeschaltet. Die Online-Terminbuchung bleibt verfügbar.</p>}
    </section>
    <Faq title="Häufige Fragen vor dem Termin" />
    <section className={styles.section}>
      <div className={styles.sectionIntro}><p className={styles.eyebrow}>Service</p><h2>Offizielle externe Anlaufstellen</h2><p>Die folgenden Ziele sind externe Angebote der jeweiligen Betreiber und keine Funktionen dieser Terminplattform.</p></div>
      <div className={styles.linkList}>
        {[PUBLIC_RESOURCES.dvagCustomerPortal,PUBLIC_RESOURCES.generaliContact].map(item=><a className={styles.linkRow} key={item.url} href={item.url} target="_blank" rel="noreferrer"><strong>{item.label}</strong><span>{item.description} →</span></a>)}
      </div>
      <p className={styles.small}>Externe Links geprüft am {PUBLIC_RESOURCE_VERIFICATION.verifiedAt}.</p>
    </section>
  </AdvisorShell>;
}
