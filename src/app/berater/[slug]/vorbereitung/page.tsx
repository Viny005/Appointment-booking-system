import Link from "next/link";
import { AdvisorShell } from "../advisor-shell";
import { loadPublicAdvisor } from "../public-advisor";
import styles from "../public-subpage.module.css";

export const dynamic = "force-dynamic";

const prompts = [
  ["Ziel des Gesprächs","Welche Frage oder Entscheidung möchten Sie nach dem Termin klarer sehen?"],
  ["Aktuelle Situation","Welche Rahmenbedingungen sind für das Thema wichtig? Notieren Sie nur, was Sie selbst im Gespräch ansprechen möchten."],
  ["Prioritäten","Was ist besonders wichtig: Flexibilität, Sicherheit, Zeitrahmen, Liquidität oder etwas anderes?"],
  ["Offene Fragen","Welche Begriffe, Annahmen oder Optionen möchten Sie erklärt bekommen?"],
] as const;

export default async function PreparationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const advisor = await loadPublicAdvisor(slug);
  return <AdvisorShell advisor={advisor} slug={slug}>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>Termin vorbereiten</p><h1>Mit den richtigen Fragen in das Gespräch gehen.</h1><p className={styles.lead}>Diese Vorbereitung bleibt absichtlich offline: Die Seite speichert keine Antworten und fordert keine sensiblen Dokumente an.</p>
      <div className={styles.actions}><Link className={styles.primary} href={"/book?advisor="+encodeURIComponent(advisor.profile.id)}>Termin buchen</Link></div></div>
      <aside className={styles.heroAside}><strong>Keine Dateneingabe erforderlich</strong><p>Nutzen Sie die Fragen als persönliche Checkliste. Notizen bleiben bei Ihnen und werden nicht automatisch übertragen.</p></aside>
    </section>
    <section className={styles.section}>
      <div className={styles.sectionIntro}><p className={styles.eyebrow}>Checkliste</p><h2>Vier Punkte reichen für den Start</h2></div>
      <div className={styles.grid}>{prompts.map(([title,text],i)=><article className={styles.card} key={title}><span className={styles.number}>{String(i+1).padStart(2,"0")}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      <p className={styles.notice}>Bitte senden Sie über die öffentliche Terminseite keine Ausweisdokumente, Kontoauszüge, Gesundheitsdaten oder andere besonders schützenswerte Unterlagen. Falls Unterlagen erforderlich sind, wird der geeignete Übermittlungsweg im persönlichen Gespräch geklärt.</p>
    </section>
  </AdvisorShell>;
}
