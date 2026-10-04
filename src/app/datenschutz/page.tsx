import Link from "next/link";
import styles from "../legal.module.css";

export default function Datenschutz(){
  return <main className={styles.page}>
    <h1>Datenschutzinformation</h1>
    <p className={styles.notice}><strong>Entwicklungsstand – nicht zur Produktionsfreigabe.</strong></p>
    <p>Für die Terminbuchung werden die von Ihnen eingegebenen Kontakt- und Termindaten ausschließlich für den Buchungsablauf verarbeitet. Die Anwendung setzt keine Marketing- oder Tracking-Funktionen ein.</p>
    <p>Vor einem produktiven Betrieb müssen Verantwortlicher, Datenschutzkontakt, Rechtsgrundlagen, Empfänger, Speicherdauern, mögliche Drittlandtransfers, Betroffenenrechte und Beschwerdestelle mit den tatsächlichen Betreiber- und Dienstleisterdaten freigegeben werden. Diese Angaben werden nicht erfunden.</p>
    <p><Link href="/book">Zur Buchung</Link></p>
  </main>;
}
