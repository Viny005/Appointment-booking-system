import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
import { internalAppointmentApi } from "@/shared/web/internal-appointments";
import styles from "../internal.module.css";

export const dynamic = "force-dynamic";
type Params = { date?: string; view?: string; cursorStart?: string; cursorId?: string };

function berlinToday(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const get=(type:string)=>parts.find(part=>part.type===type)?.value??"";
  return get("year")+"-"+get("month")+"-"+get("day");
}
const statusLabel={CONFIRMED:"Bestätigt",CANCELLED:"Abgesagt",COMPLETED:"Abgeschlossen",NO_SHOW:"Nicht erschienen"} as const;

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const requestHeaders=await headers();
  if(!await getInternalSession(requestHeaders))redirect("/login");
  const q = await searchParams, date = /^\d{4}-\d{2}-\d{2}$/.test(q.date ?? "") ? q.date! : berlinToday();
  const view = q.view === "week" || q.view === "month" ? q.view : "day";
  const cursor=q.cursorStart&&q.cursorId?{startUtc:q.cursorStart,id:q.cursorId}:undefined;
  const api = await internalAppointmentApi(requestHeaders);
  const result = await api.list(date, view, 100, cursor);

  const nextHref=result.next?"/internal/appointments?"+new URLSearchParams({
    date,view,cursorStart:result.next.startUtc,cursorId:result.next.id,
  }).toString():null;

  return <main id="main" className={styles.main}>
    <section className={styles.hero}><h1>Termine</h1><p>Tages-, Wochen- und Monatsansicht. Es werden nur Termine angezeigt, für die Ihr Konto berechtigt ist.</p>
      <form className={styles.toolbar}>
        <label className={styles.field}>Datum<input name="date" type="date" defaultValue={date}/></label>
        <label className={styles.field}>Ansicht<select name="view" defaultValue={view}><option value="day">Tag</option><option value="week">Woche</option><option value="month">Monat</option></select></label>
        <button className={styles.button} type="submit">Anzeigen</button>
      </form>
    </section>
    <section className={styles.panel} aria-labelledby="appointments-heading"><h2 id="appointments-heading">{result.items.length} Termine auf dieser Seite</h2>
      {result.items.length === 0 ? <p className={styles.empty}>Keine Termine in diesem Zeitraum.</p> :
      <div className={styles.grid}>{result.items.map(item => <Link className={styles.card} key={item.id} href={"/internal/appointments/"+encodeURIComponent(item.id)}>
        <strong>{item.firstName??"—"} {item.lastName??""}</strong><p>{item.serviceName}</p>
        <div className={styles.meta}><span>{new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Berlin"}).format(new Date(item.startUtc))}</span><span className={styles.status}>{statusLabel[item.status]}</span></div>
      </Link>)}</div>}
      {nextHref&&<p><Link className={styles.button} href={nextHref}>Weitere Termine anzeigen →</Link></p>}
    </section>
  </main>;
}
