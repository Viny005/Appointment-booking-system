"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
export default function ResetPasswordPage() {
  const params = useSearchParams(), router = useRouter(), token = params.get("token"), [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!token) { setError("Der Link ist ungültig oder abgelaufen."); return; }
    const form = new FormData(event.currentTarget), password = String(form.get("password") ?? ""), confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) { setError("Die Passwörter stimmen nicht überein."); return; }
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword: password }) });
    if (!response.ok) { setError("Der Link ist ungültig oder abgelaufen."); return; }
    router.replace("/login");
  }
  return <main><form onSubmit={submit}><h1>Neues Passwort</h1>
    <label htmlFor="password">Neues Passwort</label><input id="password" name="password" type="password" minLength={16} autoComplete="new-password" required />
    <label htmlFor="confirm">Passwort wiederholen</label><input id="confirm" name="confirm" type="password" minLength={16} autoComplete="new-password" required />
    {error && <p role="alert">{error}</p>}<button type="submit">Passwort speichern</button>
  </form></main>;
}
