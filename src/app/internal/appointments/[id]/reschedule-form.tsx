"use client";
import { useState } from "react";
import type { MeetingMode } from "@/modules/profiles/domain/model";
import type { Slot } from "@/modules/availability/domain/values";
import { appointmentAction, appointmentSlotsAction } from "./actions";
import styles from "../../internal.module.css";

const labels:Record<MeetingMode,string>={IN_PERSON:"Vor Ort",PHONE:"Telefon",ONLINE:"Online"};

export function RescheduleForm({id,version,currentStartUtc,currentMode,allowedModes}:{id:string;version:number;currentStartUtc:string;currentMode:MeetingMode;allowedModes:MeetingMode[]}){
  const [date,setDate]=useState("");
  const [slots,setSlots]=useState<Slot[]>([]);
  const [start,setStart]=useState(currentStartUtc);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function load(){
    setBusy(true);setMessage("");setSlots([]);setStart(currentStartUtc);
    const result=await appointmentSlotsAction(id,date);
    if(result.ok){setSlots(result.value);setMessage(result.value.length?"Bitte freien Zeitpunkt auswählen.":"Für diesen Tag ist kein freier Termin verfügbar.");}
    else setMessage(result.error);
    setBusy(false);
  }

  return <section>
    <h3>Freien Zeitpunkt suchen</h3>
    <div className={styles.toolbar}>
      <label className={styles.field}>Datum<input type="date" value={date} onChange={e=>{setDate(e.target.value);setSlots([]);setStart(currentStartUtc)}} required/></label>
      <button type="button" className={styles.button} disabled={busy||!date} onClick={()=>void load()}>Freie Zeiten laden</button>
    </div>
    {message&&<p role="status">{message}</p>}
    <form action={appointmentAction.bind(null,id)} className={styles.toolbar}>
      <input type="hidden" name="version" value={version}/>
      <label className={styles.field}>Terminbeginn<select name="startUtc" value={start} onChange={e=>setStart(e.target.value)}>
        <option value={currentStartUtc}>Bisherigen Zeitpunkt behalten</option>
        {slots.map(slot=><option key={slot.startUtc} value={slot.startUtc}>{slot.localDate} · {slot.localTime} Uhr (UTC{slot.offset})</option>)}
      </select></label>
      <label className={styles.field}>Modus<select name="meetingMode" defaultValue={currentMode}>{allowedModes.map(mode=><option key={mode} value={mode}>{labels[mode]}</option>)}</select></label>
      <button className={styles.button} name="action" value="reschedule">Umbuchen</button>
    </form>
  </section>;
}
