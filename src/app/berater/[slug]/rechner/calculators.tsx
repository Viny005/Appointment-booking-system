"use client";

import { useMemo, useState } from "react";
import styles from "./calculators.module.css";
import { budgetBalance, futureValue, monthlyForGoal, nonNegativeNumber, reserveTarget } from "./calculator-math";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

type Tool = "budget" | "savings" | "goal" | "reserve";

export function Calculators() {
  const [tool, setTool] = useState<Tool>("budget");
  const [income, setIncome] = useState("2500");
  const [fixed, setFixed] = useState("1500");
  const [variable, setVariable] = useState("500");
  const [initial, setInitial] = useState("5000");
  const [monthly, setMonthly] = useState("200");
  const [rate, setRate] = useState("3");
  const [years, setYears] = useState("10");
  const [target, setTarget] = useState("30000");
  const [essential, setEssential] = useState("1500");
  const [months, setMonths] = useState("3");

  const result = useMemo(() => {
    if (tool === "budget") return budgetBalance(nonNegativeNumber(income), nonNegativeNumber(fixed), nonNegativeNumber(variable));
    if (tool === "savings") return futureValue(nonNegativeNumber(initial), nonNegativeNumber(monthly), nonNegativeNumber(rate), nonNegativeNumber(years));
    if (tool === "goal") return monthlyForGoal(nonNegativeNumber(target), nonNegativeNumber(initial), nonNegativeNumber(rate), nonNegativeNumber(years));
    return reserveTarget(nonNegativeNumber(essential), nonNegativeNumber(months));
  }, [tool, income, fixed, variable, initial, monthly, rate, years, target, essential, months]);

  const labels: Record<Tool, string> = {
    budget: "Monatlich übrig",
    savings: "Rechnerischer Endwert",
    goal: "Erforderliche Monatsrate",
    reserve: "Zielgröße der Reserve",
  };

  return <div className={styles.wrap}>
    <div className={styles.tabs} role="tablist" aria-label="Rechner auswählen">
      {([
        ["budget","Budget"],
        ["savings","Sparen"],
        ["goal","Ziel"],
        ["reserve","Reserve"],
      ] as const).map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tool===id} onClick={()=>setTool(id)}>{label}</button>)}
    </div>

    <div className={styles.panel}>
      {tool==="budget"&&<>
        <label>Nettoeinnahmen pro Monat<input inputMode="decimal" value={income} onChange={e=>setIncome(e.target.value)}/></label>
        <label>Feste Ausgaben<input inputMode="decimal" value={fixed} onChange={e=>setFixed(e.target.value)}/></label>
        <label>Variable Ausgaben<input inputMode="decimal" value={variable} onChange={e=>setVariable(e.target.value)}/></label>
      </>}
      {tool==="savings"&&<>
        <label>Startkapital<input inputMode="decimal" value={initial} onChange={e=>setInitial(e.target.value)}/></label>
        <label>Monatliche Sparrate<input inputMode="decimal" value={monthly} onChange={e=>setMonthly(e.target.value)}/></label>
        <label>Rechnerische Rendite p. a. (%)<input inputMode="decimal" value={rate} onChange={e=>setRate(e.target.value)}/></label>
        <label>Laufzeit in Jahren<input inputMode="decimal" value={years} onChange={e=>setYears(e.target.value)}/></label>
      </>}
      {tool==="goal"&&<>
        <label>Zielbetrag<input inputMode="decimal" value={target} onChange={e=>setTarget(e.target.value)}/></label>
        <label>Vorhandenes Startkapital<input inputMode="decimal" value={initial} onChange={e=>setInitial(e.target.value)}/></label>
        <label>Rechnerische Rendite p. a. (%)<input inputMode="decimal" value={rate} onChange={e=>setRate(e.target.value)}/></label>
        <label>Zeitraum in Jahren<input inputMode="decimal" value={years} onChange={e=>setYears(e.target.value)}/></label>
      </>}
      {tool==="reserve"&&<>
        <label>Notwendige Monatsausgaben<input inputMode="decimal" value={essential} onChange={e=>setEssential(e.target.value)}/></label>
        <label>Gewünschte Anzahl Monate<input inputMode="decimal" value={months} onChange={e=>setMonths(e.target.value)}/></label>
      </>}

      <div className={styles.result} aria-live="polite">
        <span>{labels[tool]}</span>
        <strong>{eur.format(result)}</strong>
      </div>
    </div>

    <p className={styles.note}>Die Berechnungen laufen ausschließlich im Browser und werden nicht an den Server übertragen. Sie sind unverbindliche Rechenhilfen, keine Prognose, Produktinformation oder individuelle Finanzberatung. Renditeannahmen sind frei gewählte Rechenwerte und nicht garantiert.</p>
  </div>;
}
