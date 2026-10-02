import Link from "next/link";
import { headers } from "next/headers";
import { internalAppointmentApi } from "@/shared/web/internal-appointments";
import styles from "../internal.module.css";

export const dynamic = "force-dynamic";
type Params = { date?: string; view?: string };
const isoToday = () => new Date().toISOString().slice(0,10);
export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const q = await searchParams, date = /^\d{4}-\d{2}-\d{2}$/.test(q.date ?? "") ? q.date! : isoToday();
  const view = q.view === "week" || q.view === "month" ? q.view : "day";
  const api = await internalAppointmentApi(await headers());
  const result = await api.list(date, view, 100);
  return <main id="main" className={styles.main}>
    <section className={styles.hero}><h1>Termine</h1><p>Tages-, Wochen- und Monatsansicht. Es werden nur Termine angezeigt, für die Ihr Konto berechtigt ist.</p>
      <form className={styles.toolbar}>
        <label className={styles.field}>Datum<input name="date" type="date" defaultValue={date}/></label>
        <label className={styles.field}>Ansicht<select name="view" defaultValue={view}><option value="day">Tag</option><option value="week">Woche</option><option value="month">Monat</option></select></label>
        <button className={styles.button} type="submit">Anzeigen</button>
      </form>
    </section>
    <section className={styles.panel} aria-labelledby="appointments-heading"><h2 id="appointments-heading">{result.items.length} Termine</h2>
      {result.items.length === 0 ? <p className={styles.empty}>Keine Termine in diesem Zeitraum.</p> :
      <div className={styles.grid}>{result.items.map(item => <Link className={styles.card} key={item.id} href={'/internal/appointments/'+encodeURIComponent(item.id)}>
        <strong>{item.firstName} {item.lastName}</strong><p>{item.serviceName}</p>
        <div className={styles.meta}><span>{new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Berlin"}).format(new Date(item.startUtc))}</span><span className={styles.status}>{item.status}</span></div>
      </Link>)}</div>}
    </section>
  </main>;
}
