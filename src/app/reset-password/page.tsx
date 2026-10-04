"use client";
import Link from "next/link";
import { useSearchParams,useRouter } from "next/navigation";
import { useEffect,useState,useSyncExternalStore } from "react";
import styles from "../auth.module.css";

const subscribe=()=>()=>{};
function useHydrated(){return useSyncExternalStore(subscribe,()=>true,()=>false)}

export default function ResetPasswordPage(){
  const params=useSearchParams(),router=useRouter(),token=params.get("token");
  const [error,setError]=useState(""),[busy,setBusy]=useState(false),ready=useHydrated();
  useEffect(()=>{window.history.replaceState(null,"",window.location.pathname)},[]);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");
    if(!token){setError("Der Link ist ungültig oder abgelaufen.");return}
    const form=new FormData(event.currentTarget),password=String(form.get("password")??""),confirm=String(form.get("confirm")??"");
    if(password!==confirm){setError("Die Passwörter stimmen nicht überein.");return}
    setBusy(true);
    try{
      const response=await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,newPassword:password})});
      if(!response.ok){setError("Der Link ist ungültig oder abgelaufen.");return}
      router.replace("/login?password-reset=1");
    }catch{setError("Passwort konnte momentan nicht gespeichert werden. Bitte erneut versuchen.")}
    finally{setBusy(false)}
  }
  return <main className={styles.page}><section className={styles.card}>
    <h1>Neues Passwort</h1><p className={styles.lead}>Vergeben Sie ein neues Passwort mit mindestens 16 Zeichen.</p>
    <form method="post" onSubmit={submit} className={styles.form}>
      <label className={styles.field} htmlFor="password">Neues Passwort<input id="password" name="password" type="password" minLength={16} autoComplete="new-password" required/></label>
      <label className={styles.field} htmlFor="confirm">Passwort wiederholen<input id="confirm" name="confirm" type="password" minLength={16} autoComplete="new-password" required/></label>
      {error&&<p className={styles.error} role="alert">{error}</p>}<button className={styles.button} type="submit" disabled={!ready||busy}>{busy?"Speichern …":"Passwort speichern"}</button>
    </form>
    <div className={styles.links}><Link href="/login">Zur Anmeldung</Link></div>
  </section></main>;
}
