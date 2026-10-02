"use client";
import { useState } from "react";
export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/auth/request-password-reset", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), redirectTo: "/reset-password" }) });
    setSent(true);
  }
  return <main><form onSubmit={submit}><h1>Passwort zurücksetzen</h1>
    <label htmlFor="email">E-Mail-Adresse</label><input id="email" name="email" type="email" autoComplete="email" required />
    <button type="submit">Link anfordern</button>
    {sent && <p role="status">Falls das Konto existiert und aktiv ist, wurde ein Link angefordert.</p>}
  </form></main>;
}
