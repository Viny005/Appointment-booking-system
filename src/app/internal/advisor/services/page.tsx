import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { internalCatalog } from "@/shared/web/profile-catalog";
import { internalAvailability } from "@/shared/web/availability";
import { ServiceFieldsEditor } from "@/app/internal/service-fields-editor";
import { advisorServicesAction } from "./actions";
import styles from "../../internal.module.css";

export const dynamic="force-dynamic";
const dayNames=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const clock=(value:number)=>value===1440?"24:00":String(Math.floor(value/60)).padStart(2,"0")+":"+String(value%60).padStart(2,"0");
const rangeText=(ranges:{start:number;end:number}[])=>ranges.map(r=>clock(r.start)+"-"+clock(r.end)).join(", ");

export default async function AdvisorServices({searchParams}:{searchParams:Promise<{updated?:string,error?:string}>}){
  const q=await searchParams,api=await internalCatalog(await headers());
  if(!api)redirect("/login");
  if(api.role!=="ADVISOR")redirect("/internal/admin");
  if(!api.profileId)return <main id="main" className={styles.main}>
    <p><Link href="/internal/advisor">← Beraterbereich</Link></p>
    <section className={styles.hero}><h1>Leistungen und Verfügbarkeit</h1><p role="status" className={styles.error}>Ihr Konto ist noch keinem Beraterprofil zugeordnet. Bitte wenden Sie sich an die Administration.</p></section>
  </main>;

  const result=await api.queries.getProfile(api.profileId);
  if(!result.ok||!result.value.aggregate)return <main className={styles.main}><p role="alert">Ihr zugeordnetes Profil ist nicht verfügbar.</p></main>;
  const {profile,services}=result.value.aggregate;
  const availability=await internalAvailability(await headers());
  const [weekly,exceptions]=availability?await Promise.all([
    availability.management.getWeeklyAvailability(availability.actorId,profile.id),
    availability.management.getExceptions(availability.actorId,profile.id),
  ]):[null,null];

  return <main id="main" className={styles.main}>
    <p><Link href="/internal/advisor">← Beraterbereich</Link></p>
    <section className={styles.hero}>
      <h1>Leistungen und Verfügbarkeit</h1>
      <p>{profile.name} · {profile.title}</p>
      <div className={styles.meta}><span>{profile.status}</span><span>{api.canManageOwnServices?"Leistungsverwaltung freigegeben":"Leistungsverwaltung gesperrt"}</span></div>
      {q.updated&&<p role="status" className={styles.success}>Änderung gespeichert.</p>}
      {q.error&&<p role="alert" className={styles.error}>{q.error}</p>}
    </section>

    <section className={styles.panel}>
      <h2>Leistungen</h2>
      {!api.canManageOwnServices&&<p className={styles.empty}>Sie können die bestehenden Leistungen sehen, aber Änderungen müssen von der Administration freigegeben werden.</p>}
      <div className={styles.grid}>{services.map(service=><article className={styles.card} key={service.id}>
        <h3>{service.name}</h3>
        <div className={styles.meta}>
          <span>{service.active?"Aktiv":"Inaktiv"}</span>
          <span>{service.durationMinutes} Minuten</span>
          <span>{service.serviceTemplateId?"Zentraler Leistungskatalog":"Individuell"}</span>
        </div>
        {service.serviceTemplateId?<>
          <p>{service.description}</p>
          <p className={styles.empty}>Diese Leistung wird zentral durch die Administration verwaltet. Inhalt und Freischaltung können hier nicht geändert werden.</p>
        </>:api.canManageOwnServices?<>
          <form action={advisorServicesAction} className={styles.toolbar}>
            <input type="hidden" name="operation" value="service-update"/><input type="hidden" name="serviceId" value={service.id}/><input type="hidden" name="version" value={service.version}/>
            <ServiceFieldsEditor value={service} operationalRequired={service.active} defaultMode="IN_PERSON"/><button className={styles.button}>Leistung speichern</button>
          </form>
          <form action={advisorServicesAction}>
            <input type="hidden" name="operation" value="service-toggle"/><input type="hidden" name="serviceId" value={service.id}/><input type="hidden" name="version" value={service.version}/><input type="hidden" name="active" value={String(!service.active)}/>
            <button className={styles.button}>{service.active?"Deaktivieren":"Aktivieren"}</button>
          </form>
          <form action={advisorServicesAction} className={styles.toolbar}>
            <input type="hidden" name="operation" value="service-delete"/><input type="hidden" name="serviceId" value={service.id}/><input type="hidden" name="version" value={service.version}/>
            <label><input type="checkbox" required/> Individuelle Leistung wirklich löschen</label>
            <button className={styles.button}>Leistung löschen</button>
          </form>
        </>:<p>{service.description}</p>}
      </article>)}</div>
      {api.canManageOwnServices&&<><h3>Neue individuelle Leistung</h3><form action={advisorServicesAction} className={styles.toolbar}>
        <input type="hidden" name="operation" value="service-create"/><ServiceFieldsEditor operationalRequired={false} defaultMode="IN_PERSON"/><button className={styles.button}>Individuelle Leistung anlegen</button>
      </form><p className={styles.empty}>Diese Leistung gehört nur zu Ihrem Profil. Zentrale Leistungen werden ausschließlich von der Administration freigeschaltet.</p></>}
    </section>

    <section className={styles.panel}>
      <h2>Wöchentliche Verfügbarkeit</h2>
      {!weekly||!weekly.ok?<p role="alert" className={styles.error}>{weekly&&!weekly.ok?weekly.error.message:"Nicht verfügbar."}</p>:<div className={styles.grid}>
        {dayNames.map((name,index)=>{
          const rules=weekly.value.weekly.filter(r=>r.weekday===index+1);
          return <form action={advisorServicesAction} className={styles.card} key={name}>
            <input type="hidden" name="operation" value="weekly-set"/><input type="hidden" name="version" value={weekly.value.version}/><input type="hidden" name="weekday" value={index+1}/>
            <strong>{name}</strong>
            <label className={styles.field}>Zeitbereiche<input name="ranges" defaultValue={rangeText(rules)} placeholder="08:00-12:00, 13:00-17:00"/></label>
            <small>Leer lassen, um den Wochentag zu schließen.</small>
            <button className={styles.button}>Tag speichern</button>
          </form>;
        })}
      </div>}
    </section>

    <section className={styles.panel}>
      <h2>Ausnahmen und Abwesenheiten</h2>
      {!exceptions||!exceptions.ok?<p role="alert" className={styles.error}>{exceptions&&!exceptions.ok?exceptions.error.message:"Nicht verfügbar."}</p>:<>
        <div className={styles.grid}>{exceptions.value.exceptions.length===0?<p className={styles.empty}>Keine Ausnahmen hinterlegt.</p>:exceptions.value.exceptions.map(ex=><article className={styles.card} key={ex.id}>
          <strong>{ex.type==="BLOCK_DAY"?"Gesperrt":ex.type==="REPLACE_DAY"?"Sonderöffnungszeit":"Zusätzlicher Zeitraum"}</strong>
          <p>{ex.startDate}{ex.endDate!==ex.startDate?" bis "+ex.endDate:""}</p>{ex.ranges.length>0&&<p>{rangeText(ex.ranges)}</p>}
          <div className={styles.meta}><span>{ex.active?"Aktiv":"Inaktiv"}</span><span>Version {ex.version}</span></div>
          {ex.active&&<form action={advisorServicesAction}><input type="hidden" name="operation" value="exception-deactivate"/><input type="hidden" name="version" value={exceptions.value.version}/><input type="hidden" name="exceptionId" value={ex.id}/><button className={styles.button}>Ausnahme deaktivieren</button></form>}
        </article>)}</div>
        <h3>Zeitraum sperren</h3>
        <form action={advisorServicesAction} className={styles.toolbar}><input type="hidden" name="operation" value="exception-block"/><input type="hidden" name="version" value={exceptions.value.version}/><label className={styles.field}>Von<input name="from" type="date" required/></label><label className={styles.field}>Bis<input name="to" type="date" required/></label><button className={styles.button}>Zeitraum sperren</button></form>
        <h3>Sondertag oder zusätzlicher Zeitraum</h3>
        <form action={advisorServicesAction} className={styles.toolbar}><input type="hidden" name="operation" value="exception-day"/><input type="hidden" name="version" value={exceptions.value.version}/><label className={styles.field}>Art<select name="type" defaultValue="REPLACE_DAY"><option value="REPLACE_DAY">Wochentag für dieses Datum ersetzen</option><option value="ADD_INTERVAL">Zusätzliche Zeit hinzufügen</option></select></label><label className={styles.field}>Datum<input name="date" type="date" required/></label><label className={styles.field}>Zeitbereiche<input name="ranges" placeholder="09:00-12:00, 13:00-16:00" required/></label><button className={styles.button}>Ausnahme speichern</button></form>
      </>}
    </section>
  </main>;
}
