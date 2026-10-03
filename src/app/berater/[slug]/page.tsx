import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { publicCatalog } from "@/shared/web/profile-catalog";
import { DVAG_PARTNERS, DVAG_PARTNER_SOURCE } from "@/content/dvag-partners";
import styles from "./advisor.module.css";

export const dynamic = "force-dynamic";

export default async function AdvisorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await publicCatalog().getPublicAdvisorBySlug(slug);
  if (!result.ok || !result.value) notFound();
  const advisor = result.value;
  const productPartners = DVAG_PARTNERS.filter(item => item.category === "PRODUCT_PARTNER");
  const cooperations = DVAG_PARTNERS.filter(item => item.category === "COOPERATION");
  const accent = advisor.accentColor ?? "#1F5F8B";
  return <main className={styles.page} style={{"--accent":accent} as CSSProperties}>
    <section className={styles.hero}>
      <div>
        <p className={styles.eyebrow}>Persönliche Beratung</p>
        <h1>{advisor.profile.name}</h1>
        <p className={styles.lead}>{advisor.profile.title}</p>
        <p>{advisor.profile.shortDescription}</p>
        <div className={styles.actions}>
          <Link className={styles.button} href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Termin buchen</Link>
          {advisor.digitalCardEnabled && <a className={styles.button+" "+styles.secondary} href={"/api/public/advisors/"+encodeURIComponent(slug)+"/vcard"}>Kontakt speichern</a>}
        </div>
      </div>
      {advisor.profile.imageKey && <Image className={styles.portrait} unoptimized src={"/api/profile-images/"+encodeURIComponent(advisor.profile.imageKey)} alt={"Profilbild von "+advisor.profile.name} width={640} height={800}/>}
    </section>
    <section className={styles.section}><h2>Über mich</h2><p className={styles.lead}>{advisor.aboutText || advisor.profile.shortDescription}</p></section>
    <section className={styles.section}><h2>Kontakt</h2><div className={styles.contact}>
      {advisor.publicEmail && <a href={"mailto:"+advisor.publicEmail}>{advisor.publicEmail}</a>}
      {advisor.publicPhone && <a href={"tel:"+advisor.publicPhone.replace(/[^+\d]/g,"")}>{advisor.publicPhone}</a>}
      {advisor.publicWebsite && <a href={advisor.publicWebsite} target="_blank" rel="noreferrer">Website</a>}
      {advisor.publicAddress && <address>{advisor.publicAddress}</address>}
    </div></section>
    <section className={styles.section}><h2>Begleitung und Termine</h2><div className={styles.grid}>{advisor.services.map(service=><article className={styles.card} key={service.id}><h3>{service.name}</h3><p>{service.description}</p><p>{service.durationMinutes} Minuten</p></article>)}</div></section>
    {advisor.showDvagPartners && <section className={styles.section}><h2>Produktpartner und Kooperationen der DVAG</h2><p className={styles.partnerNote}>Diese Unternehmen werden als Netzwerk der Deutschen Vermögensberatung dargestellt; daraus wird keine individuelle persönliche Partnerschaft des einzelnen Beraters abgeleitet. Quelle: <a href={DVAG_PARTNER_SOURCE.url} target="_blank" rel="noreferrer">{DVAG_PARTNER_SOURCE.label}</a>, geprüft am {DVAG_PARTNER_SOURCE.verifiedAt}.</p>
      <div className={styles.partnerGroup}><h3>Produktpartner</h3><div className={styles.grid}>{productPartners.map(item=><article className={styles.card} key={item.name}><h4>{item.name}</h4><p>{item.field}</p><a href={item.url} target="_blank" rel="noreferrer">Offizielle Website</a></article>)}</div></div>
      <div className={styles.partnerGroup}><h3>Weitere Kooperationen</h3><div className={styles.grid}>{cooperations.map(item=><article className={styles.card} key={item.name}><h4>{item.name}</h4><p>{item.field}</p><a href={item.url} target="_blank" rel="noreferrer">Offizielle Website</a></article>)}</div></div>
    </section>}
  </main>;
}
