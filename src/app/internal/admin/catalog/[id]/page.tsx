/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { internalCatalog } from "@/shared/web/profile-catalog";
import { internalAvailability } from "@/shared/web/availability";
import { internalAdminService } from "@/shared/web/internal-admin";
import { ServiceFieldsEditor } from "@/app/internal/service-fields-editor";
import { catalogAction } from "./actions";
import { uploadProfileImage } from "./image-action";
import styles from "../../../internal.module.css";

export const dynamic="force-dynamic";
const dayNames=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const clock=(value:number)=>value===1440?"24:00":String(Math.floor(value/60)).padStart(2,"0")+":"+String(value%60).padStart(2,"0");
const rangeText=(ranges:{start:number;end:number}[])=>ranges.map(r=>clock(r.start)+"-"+clock(r.end)).join(", ");

export default async function ProfileManagement({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{updated?:string,error?:string}>}){
  const {id}=await params,q=await searchParams,api=await internalCatalog(await headers());
  if(!api)redirect("/login");
  if(api.role!=="ADMIN")redirect("/internal/advisor");
  const [result,allProfiles,users,av,serviceTemplates]=await Promise.all([
    api.queries.getProfile(id),
    api.queries.listProfiles(),
    internalAdminService().list(api.actorId),
    internalAvailability(await headers()),
    api.queries.listServiceTemplates(),
  ]);
  if(!result.ok||!result.value.aggregate)return <main className={styles.main}><p role="alert">Profil nicht gefunden.</p></main>;

  const {profile,services}=result.value.aggregate,relations=result.value.relations;
  const [weekly,exceptions]=av?await Promise.all([
    av.management.getWeeklyAvailability(av.actorId,id),
    av.management.getExceptions(av.actorId,id),
  ]):[null,null];
  const action=catalogAction.bind(null,id);
  const profileNames=new Map(allProfiles.ok?allProfiles.value.map(x=>[x.profile.id,x.profile.name]):[]);
  const relationTargets=allProfiles.ok?allProfiles.value.filter(x=>x.profile.id!==id):[];
  const advisorUsers=users.ok?users.value.filter(u=>u.role==="ADVISOR"):[];
  const templates=serviceTemplates.ok?serviceTemplates.value:[];
  const templateById=new Map(templates.map(item=>[item.template.id,item.template]));
  const unlinkedTemplates=templates.filter(item=>!services.some(service=>service.serviceTemplateId===item.template.id));

  return <main id="main" className={styles.main}>
    <p><Link href="/internal/admin/catalog">← Profile</Link></p>
    <section className={styles.hero}>
      <h1>{profile.name}</h1>
      <div className={styles.meta}><span>{profile.status}</span><span>Version {profile.version}</span></div>
      {q.updated&&<p role="status" className={styles.success}>Änderung gespeichert.</p>}
      {q.error&&<p role="alert" className={styles.error}>{q.error}</p>}
    </section>

    <section className={styles.panel}>
      <h2>Profilbild</h2>
      {profile.imageKey&&<img src={"/api/profile-images/"+encodeURIComponent(profile.imageKey)} alt={"Profilbild von "+profile.name} width={160} height={160} loading="lazy" decoding="async"/>}
      <form action={uploadProfileImage.bind(null,id)} encType="multipart/form-data" className={styles.toolbar}>
        <label className={styles.field}>Neues Profilbild (JPEG, PNG oder WebP; max. 5 MiB)<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required/></label>
        <button className={styles.button}>Bild sicher ersetzen</button>
      </form>
    </section>

    <section className={styles.panel}>
      <h2>Profildaten</h2>
      <form action={action} className={styles.toolbar}>
        <input type="hidden" name="operation" value="profile-update"/><input type="hidden" name="version" value={profile.version}/><input type="hidden" name="imageKey" value={profile.imageKey??""}/>
        <label className={styles.field}>Name<input name="name" defaultValue={profile.name} required/></label>
        <label className={styles.field}>Titel<input name="title" defaultValue={profile.title} required/></label>
        <label className={styles.field}>Beschreibung<input name="description" defaultValue={profile.shortDescription} required/></label>
        <label className={styles.field}>Benachrichtigungs-E-Mail<input name="email" type="email" defaultValue={profile.notificationEmail} required/></label>
        <button className={styles.button}>Speichern</button>
      </form>
      <form action={action}><input type="hidden" name="operation" value="profile-status"/><input type="hidden" name="version" value={profile.version}/><input type="hidden" name="status" value={profile.status==="ACTIVE"?"INACTIVE":"ACTIVE"}/><button className={styles.button}>{profile.status==="ACTIVE"?"Profil deaktivieren":"Profil aktivieren"}</button></form>
    </section>

    {users.ok&&<section className={styles.panel}>
      <h2>Internes Beraterkonto</h2>
      <p>Das zugeordnete ADVISOR-Konto erhält den profilbezogenen internen Zugriff.</p>
      <form action={action} className={styles.toolbar}>
        <input type="hidden" name="operation" value="profile-user"/><input type="hidden" name="version" value={profile.version}/>
        <label className={styles.field}>Konto<select name="userId" defaultValue={profile.userId??""}><option value="">Keine Zuordnung</option>{advisorUsers.map(u=><option key={u.id} value={u.id}>{u.name} — {u.email}{u.profileId&&u.profileId!==id?" (anderem Profil zugeordnet)":""}</option>)}</select></label>
        <button className={styles.button}>Zuordnung speichern</button>
      </form>
    </section>}

    <section className={styles.panel}>
      <h2>Öffentliche Beraterseite</h2>
      <p>Eigener Link, Kontaktangaben, Über-mich-Inhalt und digitale Visitenkarte. Produktpartner werden als DVAG-Netzwerk gekennzeichnet.</p>
      <form action={action} className={styles.toolbar}>
        <input type="hidden" name="operation" value="public-presence"/><input type="hidden" name="version" value={profile.version}/>
        <label className={styles.field}>Öffentlicher Linkname<input name="publicSlug" defaultValue={profile.publicSlug??""} placeholder="vorname-nachname" pattern="[a-z0-9]+(?:-[a-z0-9]+)*"/></label>
        <label className={styles.field}>Über mich<textarea name="aboutText" defaultValue={profile.aboutText??""} maxLength={5000}/></label>
        <label className={styles.field}>Öffentliche E-Mail<input name="publicEmail" type="email" defaultValue={profile.publicEmail??""}/></label>
        <label className={styles.field}>Öffentliches Telefon<input name="publicPhone" type="tel" defaultValue={profile.publicPhone??""}/></label>
        <label className={styles.field}>Website<input name="publicWebsite" type="url" defaultValue={profile.publicWebsite??""} placeholder="https://..."/></label>
        <label className={styles.field}>Adresse<textarea name="publicAddress" defaultValue={profile.publicAddress??""} maxLength={1000}/></label>
        <label className={styles.field}>Akzentfarbe<input name="accentColor" defaultValue={profile.accentColor??""} placeholder="#1F5F8B" pattern="#[0-9A-Fa-f]{6}"/></label>
        <label><input name="showDvagPartners" type="checkbox" defaultChecked={profile.showDvagPartners??true}/> DVAG-Produktpartner und Kooperationen anzeigen</label>
        <label><input name="digitalCardEnabled" type="checkbox" defaultChecked={profile.digitalCardEnabled??true}/> Digitale Visitenkarte aktivieren</label>
        <button className={styles.button}>Öffentliche Seite speichern</button>
      </form>
      {profile.publicSlug&&<p><Link href={"/berater/"+encodeURIComponent(profile.publicSlug)} target="_blank">Öffentliche Seite ansehen</Link></p>}
    </section>

    <section className={styles.panel}>
      <h2>Leistungen</h2>
      <p>Dieses Profil kann individuelle Leistungen besitzen und zusätzlich zentrale Leistungen aus dem <Link href="/internal/admin/services">Leistungskatalog</Link> erhalten.</p>

      <div className={styles.grid}>{services.map(service=>{
        const template=service.serviceTemplateId?templateById.get(service.serviceTemplateId):undefined;
        if(template){
          return <article className={styles.card} key={service.id}>
            <h3>{service.name}</h3>
            <div className={styles.meta}>
              <span>{service.active?"Freigeschaltet":"Gesperrt"}</span>
              <span>Zentral verwaltet</span>
              <span>{service.durationMinutes} Minuten</span>
              <span>Version {service.version}</span>
            </div>
            <p>{service.description}</p>
            <p className={styles.empty}>Die Inhalte dieser Leistung werden zentral im Leistungskatalog bearbeitet. Änderungen werden automatisch auf dieses Profil übernommen.</p>
            <div className={styles.toolbar}>
              <Link href="/internal/admin/services">Im Leistungskatalog bearbeiten</Link>
            </div>
            <form action={action}>
              <input type="hidden" name="operation" value="template-profile-toggle"/>
              <input type="hidden" name="templateId" value={template.id}/>
              <input type="hidden" name="templateVersion" value={template.version}/>
              <input type="hidden" name="serviceVersion" value={service.version}/>
              <input type="hidden" name="active" value={String(!service.active)}/>
              <button className={styles.button}>{service.active?"Für dieses Profil sperren":"Für dieses Profil freischalten"}</button>
            </form>
          </article>;
        }
        return <article className={styles.card} key={service.id}>
          <h3>{service.name}</h3>
          <div className={styles.meta}>
            <span>{service.active?"Aktiv":"Inaktiv"}</span>
            <span>Individuell für dieses Profil</span>
            <span>Version {service.version}</span>
          </div>
          <form action={action} className={styles.toolbar}>
            <input type="hidden" name="operation" value="service-update"/>
            <input type="hidden" name="serviceId" value={service.id}/>
            <input type="hidden" name="version" value={service.version}/>
            <ServiceFieldsEditor value={service} operationalRequired={service.active} defaultMode="IN_PERSON"/>
            <button className={styles.button}>Individuelle Leistung speichern</button>
          </form>
          <form action={action} className={styles.toolbar}>
            <input type="hidden" name="operation" value="service-toggle"/>
            <input type="hidden" name="serviceId" value={service.id}/>
            <input type="hidden" name="version" value={service.version}/>
            <input type="hidden" name="active" value={String(!service.active)}/>
            <button className={styles.button}>{service.active?"Deaktivieren":"Aktivieren"}</button>
          </form>
          <form action={action} className={styles.toolbar}>
            <input type="hidden" name="operation" value="service-delete"/>
            <input type="hidden" name="serviceId" value={service.id}/>
            <input type="hidden" name="version" value={service.version}/>
            <label><input type="checkbox" required/> Individuelle Leistung wirklich löschen</label>
            <button className={styles.button}>Leistung löschen</button>
          </form>
        </article>;
      })}</div>

      <h3>Zentrale Leistung für dieses Profil freischalten</h3>
      {unlinkedTemplates.length===0?<p className={styles.empty}>Alle zentralen Leistungen sind diesem Profil bereits zugeordnet oder es gibt noch keine zentralen Leistungen.</p>:
      <div className={styles.grid}>{unlinkedTemplates.map(({template})=><form action={action} className={styles.card} key={template.id}>
        <input type="hidden" name="operation" value="template-profile-toggle"/>
        <input type="hidden" name="templateId" value={template.id}/>
        <input type="hidden" name="templateVersion" value={template.version}/>
        <input type="hidden" name="serviceVersion" value=""/>
        <input type="hidden" name="active" value="true"/>
        <strong>{template.name}</strong>
        <p>{template.description}</p>
        <div className={styles.meta}><span>{template.durationMinutes} Minuten</span><span>Zentraler Katalog</span></div>
        <button className={styles.button}>Für dieses Profil freischalten</button>
      </form>)}</div>}

      <h3>Individuelle Leistung nur für dieses Profil anlegen</h3>
      <form action={action} className={styles.toolbar}>
        <input type="hidden" name="operation" value="service-create"/>
        <ServiceFieldsEditor operationalRequired={false} defaultMode="IN_PERSON"/>
        <button className={styles.button}>Individuelle Leistung anlegen</button>
      </form>
      <p className={styles.empty}>Individuelle Leistungen gehören nur zu diesem Profil. Zentrale Leistungen werden stattdessen im Leistungskatalog angelegt.</p>
    </section>

    <section className={styles.panel}>
      <h2>Teilnehmer-Beziehungen</h2>
      <p>Hier wird festgelegt, welche weiteren Berater bei einer Buchung vorgeschlagen oder verpflichtend einbezogen werden.</p>
      {relations.map(rel=><form action={action} className={styles.toolbar} key={rel.id}>
        <input type="hidden" name="operation" value="relation-update"/><input type="hidden" name="targetId" value={rel.targetProfileId}/><input type="hidden" name="version" value={rel.version}/>
        <strong>{profileNames.get(rel.targetProfileId)??rel.targetProfileId}</strong>
        <label><input name="active" type="checkbox" defaultChecked={rel.active}/> Aktiv</label>
        <label><input name="proposed" type="checkbox" defaultChecked={rel.proposedToClient}/> Dem Kunden anzeigen</label>
        <label><input name="defaultSelected" type="checkbox" defaultChecked={rel.defaultSelected}/> Vorausgewählt</label>
        <label><input name="removable" type="checkbox" defaultChecked={rel.clientCanRemove}/> Kunde darf entfernen</label>
        <button className={styles.button}>Beziehung speichern</button>
      </form>)}
      <h3>Beziehung anlegen</h3>
      <form action={action} className={styles.toolbar}>
        <input type="hidden" name="operation" value="relation-create"/>
        <label className={styles.field}>Zielprofil<select name="targetId" required defaultValue=""><option value="" disabled>Profil wählen</option>{relationTargets.filter(x=>!relations.some(r=>r.targetProfileId===x.profile.id)).map(x=><option key={x.profile.id} value={x.profile.id}>{x.profile.name}</option>)}</select></label>
        <label><input name="proposed" type="checkbox" defaultChecked/> Dem Kunden anzeigen</label>
        <label><input name="defaultSelected" type="checkbox"/> Vorausgewählt</label>
        <label><input name="removable" type="checkbox" defaultChecked/> Kunde darf entfernen</label>
        <button className={styles.button}>Beziehung anlegen</button>
      </form>
    </section>

    <section className={styles.panel}>
      <h2>Wöchentliche Verfügbarkeit</h2>
      {!weekly||!weekly.ok?<p role="alert" className={styles.error}>{weekly&&!weekly.ok?weekly.error.message:"Nicht verfügbar."}</p>:<div className={styles.grid}>
        {dayNames.map((name,index)=>{
          const rules=weekly.value.weekly.filter(r=>r.weekday===index+1);
          return <form action={action} className={styles.card} key={name}>
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
          <p>{ex.startDate}{ex.endDate!==ex.startDate?" bis "+ex.endDate:""}</p>
          {ex.ranges.length>0&&<p>{rangeText(ex.ranges)}</p>}
          <div className={styles.meta}><span>{ex.active?"Aktiv":"Inaktiv"}</span><span>Version {ex.version}</span></div>
          {ex.active&&<form action={action}><input type="hidden" name="operation" value="exception-deactivate"/><input type="hidden" name="version" value={exceptions.value.version}/><input type="hidden" name="exceptionId" value={ex.id}/><button className={styles.button}>Ausnahme deaktivieren</button></form>}
        </article>)}</div>

        <h3>Zeitraum sperren</h3>
        <form action={action} className={styles.toolbar}>
          <input type="hidden" name="operation" value="exception-block"/><input type="hidden" name="version" value={exceptions.value.version}/>
          <label className={styles.field}>Von<input name="from" type="date" required/></label>
          <label className={styles.field}>Bis<input name="to" type="date" required/></label>
          <button className={styles.button}>Zeitraum sperren</button>
        </form>

        <h3>Sondertag oder zusätzlicher Zeitraum</h3>
        <form action={action} className={styles.toolbar}>
          <input type="hidden" name="operation" value="exception-day"/><input type="hidden" name="version" value={exceptions.value.version}/>
          <label className={styles.field}>Art<select name="type" defaultValue="REPLACE_DAY"><option value="REPLACE_DAY">Wochentag für dieses Datum ersetzen</option><option value="ADD_INTERVAL">Zusätzliche Zeit hinzufügen</option></select></label>
          <label className={styles.field}>Datum<input name="date" type="date" required/></label>
          <label className={styles.field}>Zeitbereiche<input name="ranges" placeholder="09:00-12:00, 13:00-16:00" required/></label>
          <button className={styles.button}>Ausnahme speichern</button>
        </form>
      </>}
    </section>
  </main>;
}
