import Link from "next/link";
import styles from "../legal.module.css";

export default function Impressum(){
  return <main className={styles.page}>
    <h1>Impressum</h1>
    <p className={styles.notice}><strong>Entwicklungsstand – nicht zur Produktionsfreigabe.</strong></p>
    <p>Die nach § 5 DDG erforderlichen Anbieterangaben sind noch nicht durch den späteren Betreiber freigegeben. Der Produktionsstart bleibt bis zur Eintragung und Prüfung der tatsächlichen Angaben gesperrt.</p>
    <p><Link href="/book">Zur Buchung</Link></p>
  </main>;
}
