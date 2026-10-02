"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/sign-in/email", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    if (!response.ok) { setError("E-Mail-Adresse oder Passwort ist falsch."); return; }
    router.replace("/internal"); router.refresh();
  }
  return <form onSubmit={submit}>
    <h1>Interne Anmeldung</h1>
    <label htmlFor="email">E-Mail-Adresse</label>
    <input id="email" name="email" type="email" autoComplete="username" required />
    <label htmlFor="password">Passwort</label>
    <input id="password" name="password" type="password" autoComplete="current-password" minLength={16} required />
    {error && <p role="alert">{error}</p>}
    <button type="submit">Anmelden</button>
    <p><a href="/forgot-password">Passwort vergessen?</a></p>
  </form>;
}
