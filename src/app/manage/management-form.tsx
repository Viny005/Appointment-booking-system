"use client";
import { useEffect, useRef, useState } from "react";
import type { customerView, CustomerCommand } from "@/modules/appointments/domain/customer-management";
import type { Slot } from "@/modules/availability/domain/values";
import styles from "./manage.module.css";

type View = ReturnType<typeof customerView>;
const labels = { IN_PERSON: "Vor Ort", PHONE: "Telefon", ONLINE: "Online" };
const weekdays = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const pad = (n:number) => String(n).padStart(2,"0");

function berlinToday(){
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const get=(t:string)=>p.find(x=>x.type===t)?.value??"";
  return get("year")+"-"+get("month")+"-"+get("day");
}
function monthBounds(month:string){
  const [y,m]=month.split("-").map(Number), last=new Date(Date.UTC(y,m,0)).getUTCDate();
  return [month+"-01",month+"-"+pad(last)] as const;
}
function shiftMonth(month:string,delta:number){
  const [y,m]=month.split("-").map(Number), d=new Date(Date.UTC(y,m-1+delta,1));
  return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1);
}
function monthCells(month:string){
  const [y,m]=month.split("-").map(Number), first=new Date(Date.UTC(y,m-1,1));
  const leading=(first.getUTCDay()+6)%7, count=new Date(Date.UTC(y,m,0)).getUTCDate();
  return [...Array<null>(leading).fill(null),...Array.from({length:count},(_,i)=>month+"-"+pad(i+1))];
}
function monthLabel(month:string){
  const [y,m]=month.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,1)));
}

export function ManagementForm() {
  const token = useRef(""), command = useRef<{ key: string; payload: CustomerCommand } | null>(null);
  const today=berlinToday(), initialMonth=today.slice(0,7);
  const [view, setView] = useState<View | null>(null), [message, setMessage] = useState("Link wird geprüft …"), [busy, setBusy] = useState(true);
  const [available, setAvailable] = useState<Slot[]>([]), [date, setDate] = useState(""), [start, setStart] = useState(""), [mode, setMode] = useState<View["meetingMode"]>("PHONE");
  const [month,setMonth]=useState(initialMonth), [bookableDays,setBookableDays]=useState<string[]>([]), [daysBusy,setDaysBusy]=useState(false);
  const [cancel, setCancel] = useState(false), feedback = useRef<HTMLParagraphElement>(null);

  async function request(body: object) {
    const response = await fetch("/api/customer-appointment", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", referrerPolicy: "no-referrer", body: JSON.stringify({ ...body, token: token.current }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.message ?? "Anfrage fehlgeschlagen. Bitte erneut versuchen."); return result.value;
  }
  async function loadDays(targetMonth:string){
    const [from,to]=monthBounds(targetMonth);
    setDaysBusy(true); setAvailable([]); setDate(""); setStart("");
    try { setBookableDays(await request({action:"days",from,to})); }
    catch(e){ setBookableDays([]); setMessage(e instanceof Error?e.message:"Verfügbarkeit konnte nicht geladen werden."); }
    finally { setDaysBusy(false); }
  }

  useEffect(() => {
    if (!token.current) token.current = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    window.history.replaceState(null, "", window.location.pathname);
    let active = true;
    request({ action: "read" }).then((value: View) => {
      if (!active) return;
      setView(value); setMode(value.meetingMode); setMessage("");
      if(value.canChange) void loadDays(initialMonth);
    }).catch((e: Error) => { if (active) setMessage(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  // Capability is intentionally consumed once from the fragment.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function perform(work: () => Promise<void>) {
    setBusy(true); setMessage(""); try { await work(); } catch (e) { setMessage(e instanceof Error ? e.message : "Anfrage fehlgeschlagen."); }
    finally { setBusy(false); feedback.current?.focus(); }
  }
  async function submit(payload: CustomerCommand) {
    if (!command.current || JSON.stringify(command.current.payload) !== JSON.stringify(payload)) command.current = { key: crypto.randomUUID(), payload };
    const result = await request({ action: "change", commandKey: command.current.key, command: command.current.payload });
    if (result.status === "CANCELLED") { setView(null); token.current = ""; setMessage("Ihr Termin wurde abgesagt."); }
    else {
      const updated:View = await request({ action: "read" });
      setView(updated); setMode(updated.meetingMode); setAvailable([]); setDate(""); setStart("");
      await loadDays(month); setMessage("Ihr Termin wurde aktualisiert.");
    }
    command.current = null;
  }
  async function chooseDate(value:string){
    if(!bookableDays.includes(value))return;
    await perform(async()=>{
      const values: Slot[] = await request({ action: "slots", date:value });
      setDate(value); setAvailable(values); setStart("");
      setMessage(values.length ? "Bitte wählen Sie eine Uhrzeit." : "An diesem Tag ist kein Termin mehr verfügbar.");
    });
  }
  async function moveMonth(delta:number){
    const next=shiftMonth(month,delta); if(next<initialMonth)return;
    setMonth(next); await loadDays(next);
  }

  const cells=monthCells(month), enabled=new Set(bookableDays);
  return <section className={styles.card} aria-busy={busy}>
    <p role="status" aria-live="polite" tabIndex={-1} ref={feedback}>{message}</p>
    {view && <>
      <div className={styles.summary}>
        <h2>{view.serviceName}</h2>
        <p><strong>Teilnehmende:</strong> {view.participantNames.join(", ")}</p>
        <p><strong>Termin:</strong> {new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "full", timeStyle: "short" }).format(new Date(view.startUtc))} · {view.durationMinutes} Minuten</p>
        <p><strong>Terminart:</strong> {labels[view.meetingMode]}</p>
        {view.placeName&&<p><strong>Ort:</strong> {view.placeName}{view.visitAddress?", "+view.visitAddress:""}</p>}
        {view.advisorPhone&&<p><strong>Telefon:</strong> {view.advisorPhone}</p>}
        {view.onlineProvider&&<p><strong>Online:</strong> {view.onlineProvider}</p>}
        {view.onlineUrl && <a href={view.onlineUrl} rel="noreferrer">Online-Termin öffnen</a>}
      </div>
      {!view.canChange && <p className={styles.notice}>Die Selbstbedienung ist für diesen Termin gesperrt. Bitte kontaktieren Sie Ihre Beratungsstelle.</p>}
      {view.canChange && <>
        <fieldset disabled={busy||daysBusy} className={styles.calendarPanel}>
          <legend>Anderen Termin wählen</legend>
          <div className={styles.calendarHeader}>
            <button type="button" disabled={month<=initialMonth||daysBusy} onClick={()=>void moveMonth(-1)} aria-label="Vorheriger Monat">←</button>
            <strong>{monthLabel(month)}</strong>
            <button type="button" disabled={daysBusy} onClick={()=>void moveMonth(1)} aria-label="Nächster Monat">→</button>
          </div>
          <div className={styles.weekdays} aria-hidden="true">{weekdays.map(d=><span key={d}>{d}</span>)}</div>
          <div className={styles.calendarGrid}>
            {cells.map((d,i)=>!d?<span key={"blank"+i}/>:<button type="button" key={d} className={styles.day} disabled={d<today||!enabled.has(d)||daysBusy} aria-pressed={date===d} aria-label={d+(enabled.has(d)?" verfügbar":" nicht verfügbar")} onClick={()=>void chooseDate(d)}>{Number(d.slice(-2))}</button>)}
          </div>
          {daysBusy&&<p aria-live="polite">Verfügbare Tage werden geladen …</p>}
          {!daysBusy&&bookableDays.length===0&&<p>In diesem Monat sind keine Umbuchungstermine verfügbar.</p>}
        </fieldset>

        <form onSubmit={e => { e.preventDefault(); void perform(() => submit({ type: "reschedule", version: view.version, startUtc: start || view.startUtc, meetingMode: mode })); }}>
          <fieldset disabled={busy}>
            <legend>Termin ändern</legend>
            <label htmlFor="slot">Uhrzeit (Europe/Berlin)</label>
            <select id="slot" value={start} onChange={e => setStart(e.target.value)}>
              <option value="">Bisherigen Zeitpunkt behalten</option>
              {available.map(s => <option key={s.startUtc} value={s.startUtc}>{s.localTime} Uhr (UTC{s.offset})</option>)}
            </select>
            <label htmlFor="mode">Besprechungsart</label>
            <select id="mode" value={mode} onChange={e => setMode(e.target.value as View["meetingMode"])}>{view.allowedModes.map(m => <option key={m} value={m}>{labels[m]}</option>)}</select>
            <button>Änderung bestätigen</button>
          </fieldset>
        </form>

        <form onSubmit={e => { e.preventDefault(); if (cancel) void perform(() => submit({ type: "cancel", version: view.version })); }}>
          <fieldset disabled={busy}><legend>Termin absagen</legend><label><input type="checkbox" required checked={cancel} onChange={e => setCancel(e.target.checked)} /> Ich möchte diesen Termin absagen.</label><button className={styles.danger}>Absage bestätigen</button></fieldset>
        </form>
      </>}
      <button disabled={busy} onClick={() => void perform(async () => {
        const current: View = await request({ action: "read" }); setView(current); setMode(current.meetingMode); setStart(""); setAvailable([]); command.current = null;
        if(current.canChange) await loadDays(month); setMessage("Aktueller Termin geladen.");
      })}>Termin neu laden</button>
    </>}
  </section>;
}
