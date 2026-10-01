import styles from "./manage.module.css";
import { ManagementForm } from "./management-form";
export const dynamic = "force-dynamic";
export const metadata = { title: "Termin verwalten", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function ManagePage() {
  return <main className={styles.page}><h1>Termin verwalten</h1><p>Änderungen und Absagen sind mehr als 24 Stunden vor Beginn möglich. Andernfalls kontaktieren Sie bitte Ihre Beratungsstelle über den Ihnen bekannten Kontaktweg.</p><ManagementForm /></main>;
}
