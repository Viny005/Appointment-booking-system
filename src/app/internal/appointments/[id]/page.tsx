import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
import { internalAppointmentApi } from "@/shared/web/internal-appointments";
import { appointmentAction } from "./actions";
import { RescheduleForm } from "./reschedule-form";
import styles from "../../internal.module.css";

export const dynamic="force-dynamic";
const modeLabel={IN_PERSON:"Vor Ort",PHONE:"Telefon",ONLINE:"Online"} as const;
const statusLabel={CONFIRMED:"Bestätigt",CANCELLED:"Abgesagt",COMPLETED:"Abgeschlossen",NO_SHOW:"Nicht erschienen"} as const;

export default async function AppointmentDetail({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{updated?:string,error?:string}>}){
  const {id}=await params,q=await searchParams,requestHeaders=await headers();
  if(!await getInternalSession(requestHeaders))redirect("/login");
  const api=await internalAppointmentApi(requestHeaders);
  let appointment;
  try{appointment=await api.detail(id)}catch{return notFound()}
  const a=appointment, action=appointmentAction.bind(null,id), ended=a.ended;

  return <main id="main" className={styles.main}>
    <p><Link href="/internal/appointments">← Zur Terminübersicht</Link></p>
    <section className={styles.hero}>
      <h1>Termin: {a.firstName??"—"} {a.lastName??""}</h1>
      {q.updated&&<p role="status" className={styles.success}>Änderung wurde gespeichert.</p>}
      {q.error&&<p role="alert" className={styles.error}>{q.error}</p>}
      <div className={styles.meta}><span className={styles.status}>{statusLabel[a.status]}</span><span>Version {a.version}</span></div>
    </section>

    <section className={styles.panel}>
      <h2>Termindetails</h2>
      <dl>
        <dt>Leistung</dt><dd>{a.serviceName}</dd>
        <dt>Beginn</dt><dd>{new Intl.DateTimeFormat("de-DE",{dateStyle:"full",timeStyle:"short",timeZone:"Europe/Berlin"}).format(new Date(a.startUtc))}</dd>
        <dt>Ende</dt><dd>{new Intl.DateTimeFormat("de-DE",{dateStyle:"full",timeStyle:"short",timeZone:"Europe/Berlin"}).format(new Date(a.endUtc))}</dd>
        <dt>Modus</dt><dd>{modeLabel[a.meetingMode]}</dd>
        <dt>E-Mail</dt><dd>{a.email??"—"}</dd>
        <dt>Telefon</dt><dd>{a.phone??"—"}</dd>
        <dt>Adresse</dt><dd>{a.address??"—"}</dd>
        <dt>Bemerkung</dt><dd>{a.remarks||"—"}</dd>
        <dt>Teilnehmende</dt><dd>{a.participants.map(p=>p.profileName).join(", ")}</dd>
        <dt>Gäste</dt><dd>{a.guests.length?a.guests.map(g=>g.email).join(", "):"—"}</dd>
      </dl>
    </section>

    {a.status==="CONFIRMED"&&<>
      {!ended&&<section className={styles.panel}>
        <h2>Termin bearbeiten</h2>
        <RescheduleForm id={id} version={a.version} currentStartUtc={a.startUtc} currentMode={a.meetingMode} allowedModes={a.allowedModes}/>
        <form action={action} className={styles.toolbar}>
          <input type="hidden" name="version" value={a.version}/>
          <label className={styles.field}>Gäste (E-Mail, Komma-getrennt)<input name="emails" defaultValue={a.guests.map(g=>g.email).join(", ")}/></label>
          <button className={styles.button} name="action" value="guests">Gäste speichern</button>
        </form>
        <form action={action} className={styles.toolbar}>
          <input type="hidden" name="version" value={a.version}/>
          <label className={styles.field}>Bemerkung<input name="remarks" defaultValue={a.remarks??""}/></label>
          <button className={styles.button} name="action" value="details">Details speichern</button>
        </form>
      </section>}

      <section className={styles.panel}>
        <h2>Weitere Aktionen</h2>
        {!ended&&<><form action={action} className={styles.toolbar}>
          <input type="hidden" name="version" value={a.version}/>
          <button className={styles.button} name="action" value="resend">Bestätigung erneut senden</button>
        </form>
        <form action={action} className={styles.toolbar}>
          <input type="hidden" name="version" value={a.version}/>
          <label><input type="checkbox" required/> Absage wirklich bestätigen</label>
          <button className={styles.button} name="action" value="cancel">Termin absagen</button>
        </form></>}
        {ended&&<div className={styles.grid}>
          <form action={action} className={styles.card}>
            <input type="hidden" name="version" value={a.version}/>
            <label><input type="checkbox" required/> Abschluss bestätigen</label>
            <button className={styles.button} name="action" value="complete">Als abgeschlossen markieren</button>
          </form>
          <form action={action} className={styles.card}>
            <input type="hidden" name="version" value={a.version}/>
            <label><input type="checkbox" required/> Nicht-Erscheinen bestätigen</label>
            <button className={styles.button} name="action" value="no-show">Als nicht erschienen markieren</button>
          </form>
        </div>}
      </section>
    </>}
  </main>;
}
