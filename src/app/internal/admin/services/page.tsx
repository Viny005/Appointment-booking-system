import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { internalCatalog } from "@/shared/web/profile-catalog";
import type { ServiceDetails } from "@/modules/profiles/domain/model";
import { ServiceFieldsEditor } from "@/app/internal/service-fields-editor";
import { serviceCatalogAction } from "./actions";
import styles from "../../internal.module.css";

export const dynamic="force-dynamic";

function modeSummary(service:ServiceDetails){
  return service.allowedMeetingModes.map(mode=>mode==="IN_PERSON"?"Vor Ort":mode==="PHONE"?"Telefon":"Online").join(" · ");
}

export default async function ServiceCatalogPage({searchParams}:{searchParams:Promise<{updated?:string,error?:string}>}){
  const query=await searchParams;
  const api=await internalCatalog(await headers());
  if(!api)redirect("/login");
  if(api.role!=="ADMIN")redirect("/internal/advisor");

  const [templatesResult,profilesResult]=await Promise.all([
    api.queries.listServiceTemplates(),
    api.queries.listProfiles(),
  ]);

  if(!templatesResult.ok||!profilesResult.ok){
    const message=!templatesResult.ok?templatesResult.error.message:!profilesResult.ok?profilesResult.error.message:"Katalog nicht verfügbar.";
    return <main id="main" className={styles.main}><p role="alert" className={styles.error}>{message}</p></main>;
  }

  const templates=templatesResult.value;
  const profiles=profilesResult.value;

  return <main id="main" className={styles.main}>
    <p><Link href="/internal/admin">← Administration</Link></p>

    <section className={styles.hero}>
      <h1>Leistungskatalog</h1>
      <p>Leistungen einmal zentral anlegen und anschließend gezielt für einzelne Beraterprofile freischalten.</p>
      <div className={styles.meta}>
        <span>{templates.length} zentrale Leistungen</span>
        <span>{profiles.length} Profile</span>
      </div>
      {query.updated&&<p role="status" className={styles.success}>Änderung gespeichert.</p>}
      {query.error&&<p role="alert" className={styles.error}>{query.error}</p>}
    </section>

    <section className={styles.panel}>
      <h2>Neue zentrale Leistung</h2>
      <p>Die Leistung wird zunächst nur im globalen Katalog gespeichert. Danach entscheiden Sie pro Profil, ob sie freigeschaltet wird.</p>
      <form action={serviceCatalogAction} className={styles.toolbar}>
        <input type="hidden" name="operation" value="template-create"/>
        <ServiceFieldsEditor operationalRequired={true} defaultMode="PHONE"/>
        <button className={styles.button}>Leistung im Katalog anlegen</button>
      </form>
    </section>

    <section className={styles.panel}>
      <h2>Zentrale Leistungen verwalten</h2>
      {templates.length===0?<p className={styles.empty}>Noch keine zentrale Leistung angelegt.</p>:
      <div className={styles.grid}>{templates.map(({template,profileServices})=>{
        const activeCount=profileServices.filter(service=>service.active).length;
        return <article className={styles.card} key={template.id}>
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          <div className={styles.meta}>
            <span>{template.durationMinutes} Minuten</span>
            <span>{modeSummary(template)}</span>
            <span>{activeCount} aktiv freigeschaltet</span>
            <span>Version {template.version}</span>
          </div>

          <details>
            <summary>Leistung bearbeiten</summary>
            <form action={serviceCatalogAction} className={styles.toolbar}>
              <input type="hidden" name="operation" value="template-update"/>
              <input type="hidden" name="templateId" value={template.id}/>
              <input type="hidden" name="templateVersion" value={template.version}/>
              <ServiceFieldsEditor value={template} operationalRequired={true} defaultMode="PHONE"/>
              <button className={styles.button}>Zentrale Leistung speichern</button>
            </form>
            <p className={styles.empty}>Änderungen werden automatisch auf alle mit dieser Katalogleistung verbundenen Profil-Leistungen übertragen.</p>
          </details>

          <h4>Freischaltung nach Profil</h4>
          {profiles.length===0?<p className={styles.empty}>Noch keine Profile vorhanden.</p>:
          <div className={styles.grid}>{profiles.map(({profile})=>{
            const linked=profileServices.find(service=>service.advisorProfileId===profile.id);
            const active=linked?.active??false;
            return <form action={serviceCatalogAction} className={styles.card} key={profile.id}>
              <input type="hidden" name="operation" value="template-profile-toggle"/>
              <input type="hidden" name="templateId" value={template.id}/>
              <input type="hidden" name="templateVersion" value={template.version}/>
              <input type="hidden" name="profileId" value={profile.id}/>
              <input type="hidden" name="serviceVersion" value={linked?.version??""}/>
              <input type="hidden" name="active" value={String(!active)}/>
              <strong>{profile.name}</strong>
              <div className={styles.meta}>
                <span>{profile.status}</span>
                <span>{linked?(active?"Freigeschaltet":"Gesperrt"):"Nicht freigeschaltet"}</span>
              </div>
              <button className={styles.button}>{active?"Für Profil sperren":"Für Profil freischalten"}</button>
            </form>;
          })}</div>}

          <form action={serviceCatalogAction} className={styles.toolbar}>
            <input type="hidden" name="operation" value="template-delete"/>
            <input type="hidden" name="templateId" value={template.id}/>
            <input type="hidden" name="templateVersion" value={template.version}/>
            <label>
              <input type="checkbox" required disabled={activeCount>0}/>
              {activeCount>0
                ?" Löschen erst möglich, wenn die Leistung in allen Profilen gesperrt ist."
                :" Zentrale Leistung wirklich löschen. Inaktive Profilkopien bleiben aus historischen Gründen als lokale, inaktive Leistung erhalten."}
            </label>
            <button className={styles.button} disabled={activeCount>0}>Zentrale Leistung löschen</button>
          </form>
        </article>;
      })}</div>}
    </section>

    <section className={styles.panel}>
      <h2>Zwei Wege bleiben möglich</h2>
      <p><strong>Global:</strong> Hier Leistung anlegen und für beliebige Profile freischalten.</p>
      <p><strong>Profilbezogen:</strong> Im jeweiligen Profil weiterhin eine individuelle Leistung anlegen, die nur diesem Profil gehört.</p>
      <p><Link href="/internal/admin/catalog">Zu den Beraterprofilen →</Link></p>
    </section>
  </main>;
}
