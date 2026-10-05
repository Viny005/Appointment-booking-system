/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./booking.module.css";

type Profile={id:string;name:string;title:string;shortDescription:string};
type Service={id:string;name:string;description:string;durationMinutes:number;allowedMeetingModes:string[]};
type Slot={startUtc:string;endUtc:string;localDate:string;localTime:string;offset:string};
type Draft={payload:any;version:number;expiresAt:string};

const steps=["Beratung","Leistung","Teilnehmende","Termin","Modus","Kontaktdaten","Prüfen"];
const weekdays=["Mo","Di","Mi","Do","Fr","Sa","So"];
const pad=(n:number)=>String(n).padStart(2,"0");

async function json(url:string,init?:RequestInit){
  const r=await fetch(url,init),x=await r.json();
  if(!r.ok||x.ok===false)throw new Error(x.error?.message??x.error??"Anfrage fehlgeschlagen.");
  return x.value??x;
}

function berlinToday(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const get=(type:string)=>parts.find(p=>p.type===type)?.value??"";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function monthBounds(month:string){
  const [year,number]=month.split("-").map(Number);
  const last=new Date(Date.UTC(year,number,0)).getUTCDate();
  return [`${month}-01`,`${month}-${pad(last)}`] as const;
}

function shiftMonth(month:string,delta:number){
  const [year,number]=month.split("-").map(Number);
  const next=new Date(Date.UTC(year,number-1+delta,1));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth()+1)}`;
}

function monthCells(month:string){
  const [year,number]=month.split("-").map(Number);
  const first=new Date(Date.UTC(year,number-1,1));
  const leading=(first.getUTCDay()+6)%7;
  const count=new Date(Date.UTC(year,number,0)).getUTCDate();
  return [...Array<null>(leading).fill(null),...Array.from({length:count},(_,i)=>`${month}-${pad(i+1)}`)];
}

function monthLabel(month:string){
  const [year,number]=month.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(year,number-1,1)));
}

function selectionQuery(payload:any){
  const participants=(payload.participantIds??[]).map(encodeURIComponent).join(",");
  return `primary=${encodeURIComponent(payload.primaryProfileId)}&service=${encodeURIComponent(payload.serviceId)}&participants=${participants}`;
}

export function BookingWizard({initialProfileId}:{initialProfileId?:string}){
 const today=berlinToday();
 const initialMonth=today.slice(0,7);
 const [step,setStep]=useState(0);
 const [profiles,setProfiles]=useState<Profile[]>([]);
 const [services,setServices]=useState<Service[]>([]);
 const [options,setOptions]=useState<any>(null);
 const [slots,setSlots]=useState<Slot[]>([]);
 const [draft,setDraft]=useState<Draft|null>(null);
 const draftRef=useRef<Draft|null>(null);
 const [review,setReview]=useState<any>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [success,setSuccess]=useState<any>(null);
 const [loaded,setLoaded]=useState(false);
 const [calendarMonth,setCalendarMonth]=useState(initialMonth);
 const [bookableDays,setBookableDays]=useState<string[]>([]);
 const [daysBusy,setDaysBusy]=useState(false);
 const autoStarted=useRef(false);
 const primaryRef=useRef<(id:string)=>Promise<void>>(async()=>{});

 useEffect(()=>{
   Promise.all([
     json("/api/public/catalog"),
     fetch("/api/booking/draft").then(async r=>r.ok?(await r.json()).value:null),
   ]).then(([p,d])=>{setProfiles(p);if(d){draftRef.current=d;setDraft(d)}setLoaded(true)})
     .catch(e=>{setError(e.message);setLoaded(true)});
 },[]);
 useEffect(()=>{
   if(!autoStarted.current&&loaded&&initialProfileId&&profiles.some(x=>x.id===initialProfileId)){
     autoStarted.current=true;
     void primaryRef.current(initialProfileId);
   }
 },[loaded,initialProfileId,profiles]);

 function rememberDraft(value:Draft){
   draftRef.current=value;
   setDraft(value);
   return value;
 }

 async function ensureDraft(){
   if(draftRef.current)return draftRef.current;
   const d=await json("/api/booking/draft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create"})});
   return rememberDraft(d);
 }

 async function change(command:any){
   setBusy(true);setError("");
   try{
     const d=await ensureDraft();
     const n=await json("/api/booking/draft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"change",version:d.version,command})});
     return rememberDraft(n);
   }catch(e:any){setError(e.message);throw e}
   finally{setBusy(false)}
 }
 async function primary(id:string){
   try{
     await change({type:"primary",profileId:id});
     const [s,o]=await Promise.all([
       json("/api/public/catalog?profile="+encodeURIComponent(id)),
       json("/api/public/catalog?kind=participants&profile="+encodeURIComponent(id)),
     ]);
     setServices(s);setOptions(o);setStep(1);
   }catch{}
 }

 useEffect(()=>{primaryRef.current=primary});

 async function service(id:string){
   try{
     const d=await change({type:"service",serviceId:id});
     setStep(2);
     if(!options&&d.payload.primaryProfileId){
       setOptions(await json("/api/public/catalog?kind=participants&profile="+encodeURIComponent(d.payload.primaryProfileId)));
     }
   }catch{}
 }

 async function loadBookableDays(payload:any,month:string){
   if(!payload?.primaryProfileId||!payload?.serviceId||!(payload.participantIds??[]).length)return;
   const [from,to]=monthBounds(month);
   setDaysBusy(true);setError("");setSlots([]);
   try{
     const days=await json(`/api/public/availability?kind=days&${selectionQuery(payload)}&from=${from}&to=${to}`);
     setBookableDays(days);
   }catch(e:any){setBookableDays([]);setError(e.message)}
   finally{setDaysBusy(false)}
 }
 async function participants(ids:string[]){
   try{
     const d=await change({type:"participants",participantIds:ids});
     setCalendarMonth(initialMonth);
     await loadBookableDays(d.payload,initialMonth);
     setStep(3);
   }catch{}
 }

 async function moveMonth(delta:number){
   const next=shiftMonth(calendarMonth,delta);
   if(next<initialMonth)return;
   setCalendarMonth(next);
   if(draft?.payload)await loadBookableDays(draft.payload,next);
 }

 async function loadSlots(date:string){
   if(!bookableDays.includes(date))return;
   try{
     const d=await change({type:"date",date});
     const p=d.payload;
     setSlots(await json(`/api/public/availability?${selectionQuery(p)}&date=${date}`));
   }catch{}
 }

 async function slot(s:Slot){try{await change({type:"slot",startUtc:s.startUtc});setStep(4)}catch{}}
 async function mode(m:string){try{await change({type:"mode",meetingMode:m});setStep(5)}catch{}}
 async function customer(fd:FormData){
   try{
     let d=await change({type:"customer",customer:{
       firstName:fd.get("firstName"),lastName:fd.get("lastName"),email:fd.get("email"),
       phone:fd.get("phone"),address:fd.get("address")||null,remarks:fd.get("remarks")||null,
     }});
     const guests=String(fd.get("guests")??"").split(",").map(x=>x.trim()).filter(Boolean);
     if(guests.length)d=await change({type:"guests",guests});
     const x=await json("/api/booking/draft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"review"})});
     setReview(x);rememberDraft(d);setStep(6);
   }catch{}
 }

 async function confirm(){
   const current=draftRef.current;
   if(!review||!current)return;
   setBusy(true);setError("");
   try{
     const x=await json("/api/booking/draft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
       action:"confirm",version:current.version,payloadHash:review.payloadHash,commandKey:crypto.randomUUID().replaceAll("-",""),
     })});
     draftRef.current=null;setDraft(null);setSuccess(x);
   }catch(e:any){setError(e.message)}
   finally{setBusy(false)}
 }
 function restart(){
   draftRef.current=null;setDraft(null);setReview(null);setSuccess(null);setError("");setServices([]);setOptions(null);setSlots([]);setBookableDays([]);setStep(0);
 }
 if(success)return <section id="booking" className={styles.wizard} aria-live="polite">
   <div className={styles.successMark}>✓</div>
   <h2>Termin erfolgreich gebucht</h2>
   <p>Ihre Terminbestätigung wird per E-Mail versendet. Darin befindet sich auch der sichere Link zum späteren Ändern oder Absagen.</p>
   <dl className={styles.summary}>
     <dt>Terminnummer</dt><dd>{success.appointmentId}</dd>
     {review&&<><dt>Leistung</dt><dd>{review.service.name} · {review.service.durationMinutes} Minuten</dd><dt>Teilnehmende</dt><dd>{review.participants.map((x:any)=>x.name).join(", ")}</dd><dt>Termin</dt><dd>{new Intl.DateTimeFormat("de-DE",{dateStyle:"full",timeStyle:"short",timeZone:"Europe/Berlin"}).format(new Date(success.startUtc))}</dd><dt>Terminart</dt><dd>{review.payload.meetingMode==="IN_PERSON"?"Vor Ort":review.payload.meetingMode==="PHONE"?"Telefon":"Online"}</dd></>}
   </dl>
   <div className={styles.actions}><button type="button" className={styles.button} onClick={restart}>Neuen Termin buchen</button><Link className={styles.linkButton} href="/">Zur Startseite</Link></div>
 </section>;

 const p=draft?.payload;
 const available=new Set(bookableDays);
 const cells=monthCells(calendarMonth);
 return <section id="booking" className={styles.wizard}>
   <nav className={styles.progress} aria-label="Buchungsfortschritt">
     <ol>{steps.map((s,i)=><li key={s} aria-current={i===step?"step":undefined}>{i+1}. {s}</li>)}</ol>
   </nav>
   {error&&<p className={styles.error} role="alert">{error}</p>}
 {step===0&&<div><div className={styles.stepHeading}><span>01</span><div><h2>Beratung auswählen</h2><p>Wählen Sie Ihre persönliche Ansprechperson.</p></div></div>
   <div className={styles.grid}>{profiles.map(x=><button disabled={busy} className={styles.choice} key={x.id} onClick={()=>primary(x.id)}>
     <strong>{x.name}</strong><span>{x.title}</span><small>{x.shortDescription}</small>
   </button>)}</div>
 </div>}

 {step===1&&<div><div className={styles.stepHeading}><span>02</span><div><h2>Leistung auswählen</h2><p>Wählen Sie das passende Gesprächsthema.</p></div></div>
   <div className={styles.grid}>{services.map(x=><button disabled={busy} className={styles.choice} key={x.id} onClick={()=>service(x.id)}>
     <strong>{x.name}</strong><span>{x.description}</span><small>{x.durationMinutes} Minuten</small>
   </button>)}</div>
 </div>}

 {step===2&&options&&<Participants options={options} busy={busy} submit={participants}/>}
 {step===3&&<div>
   <div className={styles.stepHeading}><span>04</span><div><h2>Datum und Uhrzeit</h2><p>Nicht verfügbare Tage sind bereits gesperrt.</p></div></div>
   <div className={styles.calendarPanel}>
     <div className={styles.calendarHeader}>
       <button type="button" className={styles.calendarNav} disabled={calendarMonth<=initialMonth||daysBusy} onClick={()=>void moveMonth(-1)} aria-label="Vorheriger Monat">←</button>
       <h3 aria-live="polite">{monthLabel(calendarMonth)}</h3>
       <button type="button" className={styles.calendarNav} disabled={daysBusy} onClick={()=>void moveMonth(1)} aria-label="Nächster Monat">→</button>
     </div>
     <div className={styles.weekdays} aria-hidden="true">{weekdays.map(day=><span key={day}>{day}</span>)}</div>
     <div className={styles.calendarGrid} aria-label={"Verfügbare Tage im "+monthLabel(calendarMonth)}>
       {cells.map((date,index)=>{
         if(!date)return <span className={styles.calendarBlank} key={"blank-"+index}/>;
         const enabled=date>=today&&available.has(date)&&!daysBusy;
         const selected=p?.date===date;
         return <button type="button" key={date} className={styles.calendarDay} disabled={!enabled}
           aria-pressed={selected} aria-label={date+(enabled?" verfügbar":" nicht verfügbar")} onClick={()=>void loadSlots(date)}>
           {Number(date.slice(-2))}
         </button>;
       })}
     </div>
     {daysBusy&&<p className={styles.calendarStatus} role="status">Verfügbare Tage werden geladen …</p>}
     {!daysBusy&&bookableDays.length===0&&<p className={styles.calendarStatus}>In diesem Monat sind keine Termine verfügbar.</p>}
     <div className={styles.legend}><span><i className={styles.legendAvailable}/> verfügbar</span><span><i className={styles.legendUnavailable}/> nicht verfügbar</span></div>
   </div>
   {p?.date&&<div className={styles.slotSection}>
     <h3>Freie Uhrzeiten am {new Intl.DateTimeFormat("de-DE",{dateStyle:"long",timeZone:"Europe/Berlin"}).format(new Date(p.date+"T12:00:00+02:00"))}</h3>
     <div className={styles.grid}>{slots.map(s=><button className={styles.choice} key={s.startUtc} onClick={()=>slot(s)}>
       <strong>{s.localTime} Uhr</strong><small>Zeitzone {s.offset}</small>
     </button>)}</div>
     {slots.length===0&&!busy&&<p>Für diesen Tag sind aktuell keine freien Uhrzeiten mehr vorhanden.</p>}
   </div>}
 </div>}

 {step===4&&<div><div className={styles.stepHeading}><span>05</span><div><h2>Terminart</h2><p>Wie möchten Sie beraten werden?</p></div></div>
   <div className={styles.grid}>{(services.find(x=>x.id===p?.serviceId)?.allowedMeetingModes??[]).map(m=><button className={styles.choice} key={m} onClick={()=>mode(m)}>
     <strong>{m==="IN_PERSON"?"Vor Ort":m==="PHONE"?"Telefon":"Online"}</strong>
   </button>)}</div>
 </div>}
 {step===5&&<div><div className={styles.stepHeading}><span>06</span><div><h2>Kontaktdaten</h2><p>Nur die für den Termin notwendigen Angaben.</p></div></div>
   <div className={styles.notice}><strong>Datenschutzhinweis vor der Dateneingabe</strong><p>Die folgenden Angaben werden zur Durchführung und Kommunikation Ihres Termins verarbeitet. Pflichtfelder sind für die Terminabwicklung erforderlich; optionale Angaben können leer bleiben. Details, Rechtsgrundlagen, Empfänger und Aufbewahrung werden in der <a href="/datenschutz">Datenschutzinformation</a> beschrieben. Die Betreiberangaben und finalen Rechtstexte müssen vor Produktionsstart freigegeben sein.</p></div>
   <form action={customer} className={styles.formGrid}>
     <label className={styles.field}>Vorname *<input name="firstName" required maxLength={100}/></label>
     <label className={styles.field}>Nachname *<input name="lastName" required maxLength={100}/></label>
     <label className={styles.field}>E-Mail *<input name="email" type="email" required maxLength={254}/></label>
     <label className={styles.field}>Telefon *<input name="phone" type="tel" required maxLength={32}/></label>
     <label className={styles.field}>Adresse (optional)<input name="address" maxLength={500}/></label>
     <label className={styles.field}>Bemerkungen (optional)<textarea name="remarks" maxLength={2000}/></label>
     <label className={styles.field}>Gäste-E-Mails (optional)<input name="guests" placeholder="name@example.de, …"/></label>
     <div><button disabled={busy} className={styles.button}>Weiter zur Prüfung</button></div>
   </form>
 </div>}
 {step===6&&review&&<div><div className={styles.stepHeading}><span>07</span><div><h2>Angaben prüfen</h2><p>Kontrollieren Sie alles vor der verbindlichen Buchung.</p></div></div>
   <dl className={styles.summary}>
     <dt>Leistung</dt><dd>{review.service.name} · {review.service.durationMinutes} Minuten</dd>
     <dt>Teilnehmende</dt><dd>{review.participants.map((x:any)=>x.name).join(", ")}</dd>
     <dt>Termin</dt><dd>{new Intl.DateTimeFormat("de-DE",{dateStyle:"full",timeStyle:"short",timeZone:"Europe/Berlin"}).format(new Date(review.payload.startUtc))}</dd>
     <dt>Terminart</dt><dd>{review.payload.meetingMode}</dd>
     <dt>Name</dt><dd>{review.payload.customer.firstName} {review.payload.customer.lastName}</dd>
     <dt>E-Mail</dt><dd>{review.payload.customer.email}</dd>
   </dl>
   <button disabled={busy} className={styles.button} onClick={confirm}>Termin verbindlich buchen</button>
 </div>}

 {step>0&&step<6&&<div className={styles.actions}><button type="button" className={styles.button+" "+styles.secondary} onClick={()=>setStep(Math.max(0,step-1))}>Zurück</button></div>}
 </section>;
}
function Participants({options,busy,submit}:{options:any,busy:boolean,submit:(ids:string[])=>void}){
 const fixed=[options.primary,...options.requiredParticipants].map((x:any)=>x.id);
 const [ids,setIds]=useState<string[]>(()=>[...new Set([...fixed,...options.options.filter((x:any)=>x.defaultSelected).map((x:any)=>x.profile.id)])]);
 return <div>
   <div className={styles.stepHeading}><span>03</span><div><h2>Teilnehmende</h2><p>{options.primary.name} nimmt immer teil.</p></div></div>
   <div className={styles.grid}>{options.options.map((o:any)=><label className={styles.choice} key={o.profile.id}>
     <input type="checkbox" checked={ids.includes(o.profile.id)} disabled={!o.clientCanRemove}
       onChange={e=>setIds(e.target.checked?[...new Set([...ids,o.profile.id])]:ids.filter(x=>x!==o.profile.id))}/>
     <strong>{o.profile.name}</strong>{!o.clientCanRemove&&<small>Erforderlich</small>}
   </label>)}</div>
   <div className={styles.actions}><button disabled={busy} className={styles.button} onClick={()=>submit([...new Set([...fixed,...ids])])}>Weiter</button></div>
 </div>;
}
