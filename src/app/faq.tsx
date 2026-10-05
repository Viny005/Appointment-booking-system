"use client";

import { useMemo, useState } from "react";
import styles from "./faq.module.css";

const ITEMS = [
  { q:"Wie läuft der erste Termin ab?", a:"Sie wählen zuerst die passende Beratung, anschließend einen tatsächlich verfügbaren Termin. Die konkrete Gesprächsstruktur besprechen Sie direkt mit Ihrer Ansprechperson." },
  { q:"Brauche ich für die Terminbuchung Unterlagen?", a:"Für die reine Online-Terminbuchung sind keine Unterlagen erforderlich. Ob für das Gespräch Unterlagen sinnvoll sind, hängt vom gewählten Thema ab." },
  { q:"Kann die Beratung auch telefonisch oder online stattfinden?", a:"Welche Terminarten verfügbar sind, hängt vom gewählten Service ab. Angeboten werden nur die für diesen Service freigeschalteten Optionen." },
  { q:"Muss ich ein Kundenkonto erstellen?", a:"Nein. Für die öffentliche Terminbuchung ist kein Kundenkonto erforderlich. Änderungen erfolgen über den persönlichen Verwaltungslink aus der Terminbestätigung." },
  { q:"Kann ich einen Termin später ändern oder absagen?", a:"Ja, sofern die für den Termin geltenden Regeln dies zulassen. Den sicheren Verwaltungslink erhalten Sie mit der Terminbestätigung." },
  { q:"Warum sind manche Kalendertage nicht anklickbar?", a:"Nicht anklickbare Tage enthalten aktuell keinen vollständig buchbaren Termin. Verfügbarkeit, Dauer, Beteiligte und bereits belegte Zeiten werden serverseitig berücksichtigt." },
  { q:"Welche Daten werden bei der Buchung benötigt?", a:"Es werden nur die für Terminabwicklung und Kommunikation vorgesehenen Angaben abgefragt. Optionale Felder können leer bleiben; weitere Details stehen in der Datenschutzinformation." },
  { q:"Kann ich direkt einen bestimmten Berater auswählen?", a:"Ja. Über eine veröffentlichte Beraterseite kann die Terminbuchung direkt mit dieser Ansprechperson vorausgewählt geöffnet werden." },
] as const;

export function Faq({ title="Häufige Fragen" }: { title?: string }) {
  const [query,setQuery]=useState("");
  const filtered=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase("de");
    if(!needle)return ITEMS;
    return ITEMS.filter(item=>(item.q+" "+item.a).toLocaleLowerCase("de").includes(needle));
  },[query]);

  return <section className={styles.wrap} aria-labelledby="faq-title">
    <div className={styles.intro}>
      <p className={styles.kicker}>FAQ</p>
      <h2 id="faq-title">{title}</h2>
      <p>Antworten rund um Terminwahl, Ablauf und Verwaltung.</p>
    </div>
    <label className={styles.search}>
      <span>FAQ durchsuchen</span>
      <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="z. B. online, Unterlagen, ändern"/>
    </label>
    <div className={styles.list}>
      {filtered.map(item=><details key={item.q} className={styles.item}>
        <summary>{item.q}<span aria-hidden="true">+</span></summary>
        <p>{item.a}</p>
      </details>)}
    </div>
    {filtered.length===0&&<p className={styles.empty} role="status">Keine passende Frage gefunden.</p>}
  </section>;
}
