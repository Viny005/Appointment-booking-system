import Image from "next/image";
import Link from "next/link";
import { publicCatalog } from "@/shared/web/profile-catalog";
import styles from "./home.module.css";
import { Faq } from "./faq";

export const dynamic = "force-dynamic";

export default async function Home(){
  const result=await publicCatalog().listBookableProfiles();
  const profiles=result.ok?result.value:[];

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link className={styles.brand} href="/">Terminverwaltung</Link>
      <nav aria-label="Hauptnavigation">
        <a href="#beratung">Beratung</a>
        <a href="#ablauf">Ablauf</a>
        <a href="#faq">FAQ</a>
        <Link href="/book">Termin buchen</Link>
      </nav>
    </header>

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>Persönlich · planbar · digital</p>
        <h1>Beratung beginnt mit einem Termin, der wirklich passt.</h1>
        <p>Wählen Sie eine Ansprechperson, das passende Gesprächsthema und anschließend nur aus tatsächlich verfügbaren Tagen und Uhrzeiten.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/book">Termin buchen</Link>
          <a className={styles.secondary} href="#beratung">Beratung auswählen</a>
        </div>
      </div>
      <div className={styles.heroPanel} aria-label="Ablauf der Online-Terminbuchung">
        <span>01</span><strong>Beratung wählen</strong>
        <span>02</span><strong>Verfügbarkeit prüfen</strong>
        <span>03</span><strong>Termin sicher bestätigen</strong>
      </div>
    </section>
    <section id="beratung" className={styles.section}>
      <div className={styles.sectionIntro}>
        <p className={styles.eyebrow}>Ansprechpersonen</p>
        <h2>Passende Beratung auswählen</h2>
        <p>Aktive Beraterprofile erscheinen hier automatisch. Persönliche Profilseiten zeigen nur ausdrücklich veröffentlichte Kontaktdaten.</p>
      </div>

      {profiles.length>0?<div className={styles.grid}>
        {profiles.map(profile=>{
          const href=profile.publicSlug?"/berater/"+encodeURIComponent(profile.publicSlug):"/book?advisor="+encodeURIComponent(profile.id);
          return <article className={styles.card} key={profile.id}>
            <div className={styles.avatar}>
              {profile.imageKey?<Image unoptimized src={"/api/profile-images/"+encodeURIComponent(profile.imageKey)} alt="" width={96} height={96}/>:<span aria-hidden="true">{profile.name.slice(0,1).toUpperCase()}</span>}
            </div>
            <div><h3>{profile.name}</h3><p className={styles.role}>{profile.title}</p><p>{profile.shortDescription}</p></div>
            <Link href={href}>{profile.publicSlug?"Profil ansehen":"Termin auswählen"} <span aria-hidden="true">→</span></Link>
          </article>;
        })}
      </div>:<div className={styles.empty}><h3>Aktuell keine öffentliche Beratung verfügbar</h3><p>Sobald ein vollständiges Profil aktiviert ist, wird es hier angezeigt.</p></div>}
    </section>

    <section id="ablauf" className={styles.process}>
      <div className={styles.sectionIntro}>
        <p className={styles.eyebrow}>So funktioniert es</p>
        <h2>Von der Auswahl bis zum Termin</h2>
        <p>Der Ablauf bleibt transparent: erst Ansprechperson und Thema, dann nur tatsächlich verfügbare Termine.</p>
      </div>
      <div className={styles.processGrid}>
        <article><span>01</span><h3>Anliegen wählen</h3><p>Wählen Sie Berater und Gesprächsthema passend zu Ihrem Bedarf.</p></article>
        <article><span>02</span><h3>Verfügbarkeit sehen</h3><p>Nicht buchbare Tage sind bereits gesperrt; freie Uhrzeiten werden live berechnet.</p></article>
        <article><span>03</span><h3>Termin bestätigen</h3><p>Kontaktdaten werden erst am Ende des Buchungsprozesses abgefragt.</p></article>
        <article><span>04</span><h3>Termin verwalten</h3><p>Änderungen oder Absagen erfolgen über den persönlichen Link aus der Bestätigung.</p></article>
      </div>
    </section>

    <div id="faq"><Faq /></div>

    <section className={styles.values}>
      <article><strong>Nur verfügbare Tage</strong><p>Im Kalender sind nicht buchbare Tage bereits gesperrt.</p></article>
      <article><strong>Kein Kundenkonto nötig</strong><p>Die Terminbuchung funktioniert ohne vorherige Registrierung.</p></article>
      <article><strong>Persönliche Verwaltung</strong><p>Änderungen erfolgen über den sicheren Link aus der Terminbestätigung.</p></article>
    </section>

    <footer className={styles.footer}>
      <span>Terminverwaltung</span>
      <nav aria-label="Rechtliche Informationen"><Link href="/datenschutz">Datenschutz</Link><Link href="/impressum">Impressum</Link></nav>
    </footer>
  </main>;
}
