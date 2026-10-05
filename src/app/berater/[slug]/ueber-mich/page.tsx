/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { AdvisorShell } from "../advisor-shell";
import { advisorPath, loadPublicAdvisor } from "../public-advisor";
import styles from "../public-subpage.module.css";

export const dynamic = "force-dynamic";

export default async function AboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  return <AdvisorShell advisor={advisor} slug={slug} current="ueber-mich">
    <section className={styles.hero}>
      <div>
        <p className={styles.eyebrow}>Über mich</p>
        <h1>Persönlich begleiten. Verständlich bleiben.</h1>
        <p className={styles.lead}>{advisor.aboutText || advisor.profile.shortDescription}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Termin vereinbaren</Link>
          <Link className={styles.secondary} href={advisorPath(slug,"kontakt")}>Kontakt</Link>
        </div>
      </div>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          {advisor.profile.imageKey
            ? <img src={"/api/profile-images/"+encodeURIComponent(advisor.profile.imageKey)} alt={"Profilbild von "+advisor.profile.name} width={220} height={220}/>
            : <span className={styles.avatarFallback}>{advisor.profile.name.slice(0,1).toUpperCase()}</span>}
        </div>
        <div><h2>{advisor.profile.name}</h2><p>{advisor.profile.title}</p><p>{advisor.profile.shortDescription}</p></div>
      </div>
    </section>
    <section className={styles.section}>
      <div className={styles.sectionIntro}><p className={styles.eyebrow}>Zusammenarbeit</p><h2>Was im Gespräch zählt</h2><p>Der Termin soll Orientierung schaffen: Ausgangslage verstehen, Ziele ordnen, Optionen nachvollziehbar machen und die nächsten Schritte gemeinsam festhalten.</p></div>
      <div className={styles.grid}>
        <article className={styles.card}><h3>Persönlich</h3><p>Die Beratung richtet sich nach der konkreten Situation und den Zielen der jeweiligen Person.</p></article>
        <article className={styles.card}><h3>Nachvollziehbar</h3><p>Begriffe, Zusammenhänge und Entscheidungen werden so erklärt, dass Fragen ausdrücklich Platz haben.</p></article>
        <article className={styles.card}><h3>Planbar</h3><p>Termine, Themen und Kommunikationswege bleiben transparent und können online vorbereitet werden.</p></article>
      </div>
    </section>
  </AdvisorShell>;
}
