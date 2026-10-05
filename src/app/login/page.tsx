import { LoginForm } from "./login-form";
import styles from "../auth.module.css";

export default async function LoginPage({searchParams}:{searchParams:Promise<{"password-reset"?:string}>}){
  const query=await searchParams;
  return <main className={styles.page}><section className={styles.card}>
    <h1>Interne Anmeldung</h1>
    <p className={styles.lead}>Zugang für Administratoren und autorisierte Berater.</p>
    {query["password-reset"]&&<p className={styles.success} role="status">Das Passwort wurde gespeichert. Sie können sich jetzt anmelden.</p>}
    <LoginForm/>
  </section></main>;
}
