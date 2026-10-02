"use client";
import { useRouter } from "next/navigation";
export function LogoutButton() {
  const router = useRouter();
  return <button type="button" onClick={async () => {
    await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    router.replace("/login"); router.refresh();
  }}>Abmelden</button>;
}
