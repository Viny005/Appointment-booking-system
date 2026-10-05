/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvisorShell } from "../advisor-shell";
import { loadPublicAdvisor, phoneHref, whatsappHref } from "../public-advisor";
import styles from "../public-subpage.module.css";
import { CardActions } from "./card-actions";

export const dynamic = "force-dynamic";

export default async function CardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  if (!advisor.digitalCardEnabled) notFound();
  const vcardHref = "/api/public/advisors/" + encodeURIComponent(slug) + "/vcard";
  const qrHref = "/api/public/advisors/" + encodeURIComponent(slug) + "/qr";
  const whatsapp = advisor.publicPhone ? whatsappHref(advisor.publicPhone) : null;

  return <AdvisorShell advisor={advisor} slug={slug} current="karte">
    <section className={styles.hero}>
      <div>
        <p className={styles.eyebrow}>Digitale Visitenkarte</p>
        <h1>{advisor.profile.name}</h1>
        <p className={styles.lead}>{advisor.profile.title}</p>
        <CardActions vcardHref={vcardHref}/>
        <p className={styles.small}>Die heruntergeladene vCard enthält nur Daten, die für dieses Profil öffentlich freigegeben wurden.</p>
      </div>
      <div className={styles.cardAside}>
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            {advisor.profile.imageKey
              ? <img src={"/api/profile-images/"+encodeURIComponent(advisor.profile.imageKey)} alt={"Profilbild von "+advisor.profile.name} width={220} height={220}/>
              : <span className={styles.avatarFallback}>{advisor.profile.name.slice(0,1).toUpperCase()}</span>}
          </div>
          <div><h2>{advisor.profile.name}</h2><p>{advisor.profile.title}</p><p>{advisor.profile.shortDescription}</p></div>
        </div>
        <div className={styles.qrBox}><img src={qrHref} alt={"QR-Code zur digitalen Karte von "+advisor.profile.name} width={180} height={180}/><span>QR-Code zur öffentlichen Karte</span></div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionIntro}><p className={styles.eyebrow}>Kontakt</p><h2>Direkte Aktionen</h2></div>
      <div className={styles.contactGrid}>
        {advisor.publicEmail&&<a className={styles.contact} href={"mailto:"+advisor.publicEmail}><span>E-Mail</span><strong>{advisor.publicEmail}</strong></a>}
        {advisor.publicPhone&&<a className={styles.contact} href={phoneHref(advisor.publicPhone)}><span>Telefon</span><strong>{advisor.publicPhone}</strong></a>}
        {whatsapp&&<a className={styles.contact} href={whatsapp} target="_blank" rel="noreferrer"><span>WhatsApp</span><strong>Chat öffnen</strong></a>}
        {advisor.publicWebsite&&<a className={styles.contact} href={advisor.publicWebsite} target="_blank" rel="noreferrer"><span>Website</span><strong>Website öffnen</strong></a>}
        {advisor.publicAddress&&<div className={styles.contact}><span>Adresse</span><strong>{advisor.publicAddress}</strong></div>}
      </div>
      <div className={styles.actions}><Link className={styles.primary} href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Termin buchen</Link></div>
    </section>
  </AdvisorShell>;
}
