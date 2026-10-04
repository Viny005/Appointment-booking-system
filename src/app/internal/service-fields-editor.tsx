"use client";

import { useId, useState } from "react";
import type { MeetingMode, ServiceDetails } from "@/modules/profiles/domain/model";
import styles from "./internal.module.css";

type Props = {
  value?: Partial<ServiceDetails>;
  operationalRequired: boolean;
  defaultMode?: MeetingMode;
};

const allModes: MeetingMode[] = ["IN_PERSON", "PHONE", "ONLINE"];

export function ServiceFieldsEditor({ value, operationalRequired, defaultMode = "IN_PERSON" }: Props) {
  const baseId = useId();
  const initialModes = value?.allowedMeetingModes?.length
    ? [...value.allowedMeetingModes]
    : [defaultMode];

  const [modes, setModes] = useState<MeetingMode[]>(initialModes);
  const [policy, setPolicy] = useState(value?.meetingModePolicy ?? "CLIENT_CHOICE");
  const [phoneDirection, setPhoneDirection] = useState(value?.phoneDirection ?? "ADVISOR_CALLS_CLIENT");

  const has = (mode: MeetingMode) => modes.includes(mode);

  function toggleMode(mode: MeetingMode, checked: boolean) {
    setModes(current => {
      if (policy === "FIXED" && checked) return [mode];
      if (checked) return current.includes(mode) ? current : [...current, mode];
      return current.filter(item => item !== mode);
    });
  }

  function changePolicy(next: "FIXED" | "CLIENT_CHOICE") {
    setPolicy(next);
    if (next === "FIXED" && modes.length > 1) setModes([modes[0]]);
  }

  return <>
    <label className={styles.field}>
      Name
      <input name="name" defaultValue={value?.name ?? ""} required maxLength={200}/>
    </label>

    <label className={styles.field}>
      Beschreibung
      <textarea name="description" defaultValue={value?.description ?? ""} required maxLength={3000}/>
    </label>

    <label className={styles.field}>
      Dauer (Minuten)
      <input name="duration" type="number" min="1" max="480" step="1" defaultValue={value?.durationMinutes ?? 60} required/>
    </label>

    <label className={styles.field}>
      Modus-Regel
      <select
        name="policy"
        value={policy}
        onChange={event => changePolicy(event.target.value === "FIXED" ? "FIXED" : "CLIENT_CHOICE")}
      >
        <option value="CLIENT_CHOICE">Kunde wählt</option>
        <option value="FIXED">Fester Modus</option>
      </select>
    </label>

    <fieldset className={styles.field}>
      <legend>Erlaubte Terminarten</legend>
      {allModes.map(mode => {
        const label = mode === "IN_PERSON" ? "Vor Ort" : mode === "PHONE" ? "Telefon" : "Online";
        return <label key={mode}>
          <input
            name={"mode_" + mode}
            type="checkbox"
            checked={has(mode)}
            onChange={event => toggleMode(mode, event.target.checked)}
          />{" "}{label}
        </label>;
      })}
      {policy === "FIXED"
        ? <small>Bei „Fester Modus“ kann genau eine Terminart ausgewählt werden.</small>
        : <small>Bei „Kunde wählt“ können mehrere Terminarten angeboten werden.</small>}
    </fieldset>

    {has("IN_PERSON") && <>
      <label className={styles.field}>
        Ort (für Vor-Ort-Termine)
        <input
          name="placeName"
          defaultValue={value?.placeName ?? ""}
          required={operationalRequired}
          maxLength={500}
          aria-describedby={baseId + "-in-person-help"}
        />
      </label>
      <label className={styles.field}>
        Adresse (für Vor-Ort-Termine)
        <input
          name="address"
          defaultValue={value?.visitAddress ?? ""}
          required={operationalRequired}
          maxLength={500}
          aria-describedby={baseId + "-in-person-help"}
        />
      </label>
      <small id={baseId + "-in-person-help"}>
        {operationalRequired
          ? "Für eine aktive Vor-Ort-Leistung sind Ort und Adresse erforderlich."
          : "Ort und Adresse müssen spätestens vor der Aktivierung eingetragen sein."}
      </small>
    </>}

    {has("PHONE") && <>
      <label className={styles.field}>
        Telefonrichtung
        <select
          name="phoneDirection"
          value={phoneDirection}
          onChange={event => setPhoneDirection(event.target.value === "CLIENT_CALLS_ADVISOR" ? "CLIENT_CALLS_ADVISOR" : "ADVISOR_CALLS_CLIENT")}
        >
          <option value="ADVISOR_CALLS_CLIENT">Berater ruft Kunden an</option>
          <option value="CLIENT_CALLS_ADVISOR">Kunde ruft Berater an</option>
        </select>
      </label>

      {phoneDirection === "CLIENT_CALLS_ADVISOR" && <label className={styles.field}>
        Berater-Telefon
        <input
          name="advisorPhone"
          type="tel"
          defaultValue={value?.advisorPhone ?? ""}
          required={operationalRequired}
          maxLength={32}
          placeholder="+49 ..."
        />
        <small>
          {operationalRequired
            ? "Die Telefonnummer ist erforderlich, weil der Kunde den Berater anrufen soll."
            : "Die Telefonnummer muss spätestens vor der Aktivierung eingetragen sein."}
        </small>
      </label>}
    </>}

    {has("ONLINE") && <>
      <label className={styles.field}>
        Online-Anbieter
        <input
          name="onlineProvider"
          defaultValue={value?.onlineProvider ?? ""}
          required={operationalRequired}
          maxLength={100}
          placeholder="z. B. Microsoft Teams, Zoom oder Google Meet"
          aria-describedby={baseId + "-online-help"}
        />
      </label>

      <label className={styles.field}>
        Online-Link
        <input
          name="onlineUrl"
          type="url"
          inputMode="url"
          defaultValue={value?.onlineUrl ?? ""}
          required={operationalRequired}
          maxLength={2048}
          pattern="https://.*"
          placeholder="https://..."
          aria-describedby={baseId + "-online-help"}
        />
        <small id={baseId + "-online-help"}>
          {operationalRequired
            ? "Online ist aktiviert: Anbieter und vollständiger HTTPS-Link sind erforderlich, z. B. https://teams.microsoft.com/..."
            : "Für Online-Termine müssen Anbieter und HTTPS-Link spätestens vor der Aktivierung eingetragen sein."}
        </small>
      </label>
    </>}
  </>;
}
