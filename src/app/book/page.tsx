import Link from "next/link";
import { BookingWizard } from "./wizard";
import styles from "./booking.module.css";
export const metadata={title:"Termin buchen"};
export default async function BookingPage({searchParams}:{searchParams:Promise<{advisor?:string}>}){const q=await searchParams;return <main className={styles.main}><a className={styles.skip} href="#booking">Zum Buchungsformular</a><header className={styles.hero}><p className={styles.eyebrow}>Online-Termin</p><h1>Termin buchen</h1><p>Wählen Sie Schritt für Schritt den passenden Termin. Ein Kundenkonto ist nicht erforderlich.</p></header><BookingWizard initialProfileId={q.advisor}/><footer className={styles.footer}><Link href="/datenschutz">Datenschutz</Link><Link href="/impressum">Impressum</Link></footer></main>}
