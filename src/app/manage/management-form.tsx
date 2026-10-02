"use client";
import { useEffect, useRef, useState } from "react";
import type { customerView, CustomerCommand } from "@/modules/appointments/domain/customer-management";
import type { Slot } from "@/modules/availability/domain/values";
type View = ReturnType<typeof customerView>;
const labels = { IN_PERSON: "Vor Ort", PHONE: "Telefon", ONLINE: "Online" };
export function ManagementForm() {
  const token = useRef(""), command = useRef<{ key: string; payload: CustomerCommand } | null>(null);
  const [view, setView] = useState<View | null>(null), [message, setMessage] = useState("Link wird geprüft …"), [busy, setBusy] = useState(true);
  const [available, setAvailable] = useState<Slot[]>([]), [date, setDate] = useState(""), [start, setStart] = useState(""), [mode, setMode] = useState<View["meetingMode"]>("PHONE");
  const [cancel, setCancel] = useState(false), feedback = useRef<HTMLParagraphElement>(null);
  async function request(body: object) {
    const response = await fetch("/api/customer-appointment", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", referrerPolicy: "no-referrer", body: JSON.stringify({ ...body, token: token.current }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.message ?? "Anfrage fehlgeschlagen. Bitte erneut versuchen."); return result.value;
  }
  useEffect(() => {
    // Fragment never reaches the server; remove it before the first capability request.
    if (!token.current) token.current = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    window.history.replaceState(null, "", window.location.pathname);
    let active = true;
    request({ action: "read" }).then((value: View) => { if (active) { setView(value); setMode(value.meetingMode); setMessage(""); } })
      .catch((e: Error) => { if (active) setMessage(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  async function perform(work: () => Promise<void>) {
    setBusy(true); setMessage(""); try { await work(); } catch (e) { setMessage(e instanceof Error ? e.message : "Anfrage fehlgeschlagen."); }
    finally { setBusy(false); feedback.current?.focus(); }
  }
  async function submit(payload: CustomerCommand) {
    // Keep command identity on network retries; changing input creates a deliberate new command.
    if (!command.current || JSON.stringify(command.current.payload) !== JSON.stringify(payload)) command.current = { key: crypto.randomUUID(), payload };
    const result = await request({ action: "change", commandKey: command.current.key, command: command.current.payload });
    if (result.status === "CANCELLED") { setView(null); token.current = ""; setMessage("Ihr Termin wurde abgesagt."); }
    else { const updated = await request({ action: "read" }); setView(updated); setAvailable([]); setStart(""); setMessage("Ihr Termin wurde aktualisiert."); }
    command.current = null;
  }
  return <section aria-busy={busy}>
    <p role="status" aria-live="polite" tabIndex={-1} ref={feedback}>{message}</p>
    {view && <><h2>{view.serviceName}</h2><p>{view.participantNames.join(", ")}</p>
      <p>{new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "full", timeStyle: "long" }).format(new Date(view.startUtc))} · {view.durationMinutes} Minuten</p>
      <p>{labels[view.meetingMode]} {view.placeName} {view.visitAddress} {view.advisorPhone} {view.onlineProvider}</p>
      {view.onlineUrl && <a href={view.onlineUrl} rel="noreferrer">Online-Termin öffnen</a>}
      {!view.canChange && <p>Die Selbstbedienung ist für diesen Termin gesperrt. Bitte kontaktieren Sie Ihre Beratungsstelle.</p>}
      {view.canChange && <><form onSubmit={e => { e.preventDefault(); void perform(async () => { const values: Slot[] = await request({ action: "slots", date }); setAvailable(values); setStart(""); setMessage(values.length ? "Bitte wählen Sie eine Uhrzeit." : "An diesem Tag ist kein Termin verfügbar."); }); }}>
        <fieldset disabled={busy}><legend>Anderen Zeitpunkt wählen</legend><label htmlFor="date">Datum</label><input id="date" type="date" required value={date} onChange={e => { setDate(e.target.value); setAvailable([]); setStart(""); }} /><button>Freie Zeiten anzeigen</button></fieldset>
      </form>
      <form onSubmit={e => { e.preventDefault(); void perform(() => submit({ type: "reschedule", version: view.version, startUtc: start || view.startUtc, meetingMode: mode })); }}>
        <fieldset disabled={busy}><legend>Termin ändern</legend><label htmlFor="slot">Uhrzeit (Europe/Berlin)</label><select id="slot" value={start} onChange={e => setStart(e.target.value)}><option value="">Bisherigen Zeitpunkt behalten</option>{available.map(s => <option key={s.startUtc} value={s.startUtc}>{s.localTime} UTC{s.offset}</option>)}</select>
        <label htmlFor="mode">Besprechungsart</label><select id="mode" value={mode} onChange={e => setMode(e.target.value as View["meetingMode"])}>{view.allowedModes.map(m => <option key={m} value={m}>{labels[m]}</option>)}</select><button>Änderung bestätigen</button></fieldset>
      </form>
      <form onSubmit={e => { e.preventDefault(); if (cancel) void perform(() => submit({ type: "cancel", version: view.version })); }}><fieldset disabled={busy}><legend>Termin absagen</legend><label><input type="checkbox" required checked={cancel} onChange={e => setCancel(e.target.checked)} /> Ich möchte diesen Termin absagen.</label><button>Absage bestätigen</button></fieldset></form></>}
      <button disabled={busy} onClick={() => void perform(async () => { const current: View = await request({ action: "read" }); setView(current); setMode(current.meetingMode); setStart(""); setAvailable([]); command.current = null; setMessage("Aktueller Termin geladen."); })}>Termin neu laden</button>
    </>}
  </section>;
}
