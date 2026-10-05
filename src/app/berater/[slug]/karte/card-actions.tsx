"use client";

import { useState } from "react";
import styles from "./card-actions.module.css";

export function CardActions({ vcardHref }: { vcardHref: string }) {
  const [message, setMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Link kopiert.");
    } catch {
      setMessage("Link konnte nicht automatisch kopiert werden.");
    }
  }

  async function share() {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title: document.title, url: window.location.href });
      setMessage("Teilen geöffnet.");
    } catch {
      setMessage("");
    }
  }

  return <div className={styles.wrap}>
    <a className={styles.primary} href={vcardHref}>Kontakt speichern (.vcf)</a>
    <button type="button" onClick={share}>Teilen</button>
    <button type="button" onClick={copyLink}>Link kopieren</button>
    <span className={styles.status} aria-live="polite">{message}</span>
  </div>;
}
