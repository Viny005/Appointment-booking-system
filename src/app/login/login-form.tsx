"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

const subscribe=()=>()=>{};
function useHydrated(){return useSyncExternalStore(subscribe,()=>true,()=>false)}

export function LoginForm(){
  const router=useRouter(),[error,setError]=useState(""),[busy,setBusy]=useState(false),ready=useHydrated();
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");setBusy(true);
    try{
      const form=new FormData(event.currentTarget);
      const response=await fetch("/api/auth/sign-in/email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.get("email"),password:form.get("password")})});
      if(!response.ok){setError("E-Mail-Adresse oder Passwort ist falsch.");return}
      router.replace("/internal");router.refresh();
    }catch{setError("Anmeldung ist momentan nicht erreichbar. Bitte erneut versuchen.")}
    finally{setBusy(false)}
  }
  return <>
    <form method="post" onSubmit={submit} className={styles.form}>
      <label className={styles.field} htmlFor="email">E-Mail-Adresse<input id="email" name="email" type="email" autoComplete="username" required/></label>
      <label className={styles.field} htmlFor="password">Passwort<input id="password" name="password" type="password" autoComplete="current-password" minLength={16} required/></label>
      {error&&<p className={styles.error} role="alert">{error}</p>}
      <button className={styles.button} type="submit" disabled={!ready||busy}>{busy?"Anmeldung läuft …":"Anmelden"}</button>
    </form>
    <div className={styles.links}><Link href="/forgot-password">Passwort vergessen?</Link><Link href="/">Zur Startseite</Link></div>
  </>;
}
