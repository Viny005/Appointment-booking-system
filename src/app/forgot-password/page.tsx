"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import styles from "../auth.module.css";

const subscribe=()=>()=>{};
function useHydrated(){return useSyncExternalStore(subscribe,()=>true,()=>false)}

export default function ForgotPasswordPage(){
  const [sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),ready=useHydrated();
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");
    try{
      const form=new FormData(event.currentTarget);
      const response=await fetch("/api/auth/request-password-reset",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.get("email"),redirectTo:"/reset-password"})});
      if(!response.ok){setError("Die Anfrage konnte momentan nicht verarbeitet werden. Bitte später erneut versuchen.");return}
      setSent(true);
    }catch{setError("Die Anfrage konnte momentan nicht verarbeitet werden. Bitte später erneut versuchen.")}
    finally{setBusy(false)}
  }
  return <main className={styles.page}><section className={styles.card}>
    <h1>Passwort zurücksetzen</h1><p className={styles.lead}>Geben Sie die E-Mail-Adresse Ihres internen Kontos ein.</p>
    {!sent?<form method="post" onSubmit={submit} className={styles.form}><label className={styles.field} htmlFor="email">E-Mail-Adresse<input id="email" name="email" type="email" autoComplete="email" required/></label>{error&&<p className={styles.error} role="alert">{error}</p>}<button className={styles.button} type="submit" disabled={!ready||busy}>{busy?"Anfrage läuft …":"Link anfordern"}</button></form>:<p className={styles.success} role="status">Falls das Konto existiert und aktiv ist, wurde ein Link angefordert.</p>}
    <div className={styles.links}><Link href="/login">Zur Anmeldung</Link><Link href="/">Zur Startseite</Link></div>
  </section></main>;
}
