# N1 — Nichtfunktionale Anforderungen

## Sicherheit

| ID | Anforderung |
|---|---|
| <a id="nfr-sec-01"></a>NFR-SEC-01 | Jede private Route prüft serverseitig Authentifizierung und Autorisierung. |
| <a id="nfr-sec-02"></a>NFR-SEC-02 | Passwörter werden ausschließlich mit einem modernen Passwort-Hash gespeichert. |
| <a id="nfr-sec-03"></a>NFR-SEC-03 | Session-Cookies sind `HttpOnly`, `Secure` in Produktion und angemessen `SameSite` geschützt. |
| <a id="nfr-sec-04"></a>NFR-SEC-04 | Session endet nach 30 Minuten Inaktivität oder spätestens nach 8 Stunden. |
| <a id="nfr-sec-05"></a>NFR-SEC-05 | Login und Passwortreset sind rate-limitiert. |
| <a id="nfr-sec-06"></a>NFR-SEC-06 | Formulare und Mutationen sind gegen CSRF und manipulierte Eingaben geschützt. |
| <a id="nfr-sec-07"></a>NFR-SEC-07 | Verwaltungslinks verwenden kryptografisch zufällige Tokens; in der Datenbank liegt nur ein Hash. |
| <a id="nfr-sec-08"></a>NFR-SEC-08 | Geheimnisse werden nie im Browser oder Repository abgelegt. |

## Konsistenz

| ID | Anforderung |
|---|---|
| <a id="nfr-con-01"></a>NFR-CON-01 | Doppelbuchung eines Beraters im gleichen Zeitraum ist auch bei parallelen Requests ausgeschlossen. |
| <a id="nfr-con-02"></a>NFR-CON-02 | Verfügbarkeit wird unmittelbar vor finaler Buchung erneut geprüft. |
| <a id="nfr-con-03"></a>NFR-CON-03 | Änderung eines Termins ist atomar: alter Slot wird nur freigegeben, wenn der neue erfolgreich reserviert ist. |

## Usability

| ID | Anforderung |
|---|---|
| <a id="nfr-ux-01"></a>NFR-UX-01 | Nicht buchbare Kalendertage sind sichtbar deaktiviert und nicht klickbar. |
| <a id="nfr-ux-02"></a>NFR-UX-02 | Zeiten werden erst nach Tagesauswahl angezeigt. |
| <a id="nfr-ux-03"></a>NFR-UX-03 | Überlappende Verfügbarkeiten führen zu verständlichem Fusionsvorschlag statt generischem Fehler. |
| <a id="nfr-ux-04"></a>NFR-UX-04 | Buchungsprozess ist auf Smartphone und Desktop vollständig nutzbar. |
| <a id="nfr-ux-05"></a>NFR-UX-05 | Fehler führen nicht zum Verlust bereits eingegebener, weiterhin gültiger Buchungsdaten. |

## Performance

| ID | Anforderung |
|---|---|
| <a id="nfr-perf-01"></a>NFR-PERF-01 | Monatsverfügbarkeit soll bei normaler Teamgröße interaktiv ohne spürbare Wartezeiten nutzbar sein; Ziel p95 < 1 s serverseitig. |
| <a id="nfr-perf-02"></a>NFR-PERF-02 | Finale Terminpersistenz soll nicht auf erfolgreichen E-Mail-Versand warten müssen. |

## Accessibility

| ID | Anforderung |
|---|---|
| <a id="nfr-a11y-01"></a>NFR-A11Y-01 | Tastaturbedienung für zentrale Flows. |
| <a id="nfr-a11y-02"></a>NFR-A11Y-02 | Semantische Labels und verständliche Fehlermeldungen. |
| <a id="nfr-a11y-03"></a>NFR-A11Y-03 | Ziel: WCAG 2.2 AA. |

## Datenschutz

| ID | Anforderung |
|---|---|
| <a id="nfr-priv-01"></a>NFR-PRIV-01 | Datenminimierung: keine Kundenkonten, kein CRM, keine unnötigen Pflichtfelder. |
| <a id="nfr-priv-02"></a>NFR-PRIV-02 | Keine Werbe-/Tracking-Skripte in V1. |
| <a id="nfr-priv-03"></a>NFR-PRIV-03 | Personenbezogene Historiedaten werden nach definierter Frist anonymisiert. |
| <a id="nfr-priv-04"></a>NFR-PRIV-04 | Gäste erhalten beim ersten Kontakt Informationen zur Datenverarbeitung. |
| <a id="nfr-priv-05"></a>NFR-PRIV-05 | Rechtliche Seiten sind dauerhaft erreichbar. |

## Wartbarkeit/Testbarkeit

| ID | Anforderung |
|---|---|
| <a id="nfr-mnt-01"></a>NFR-MNT-01 | Verfügbarkeitslogik ist von UI und E-Mail-Versand getrennt testbar. |
| <a id="nfr-mnt-02"></a>NFR-MNT-02 | Externe Dienste liegen hinter eigenen Adaptern. |
| <a id="nfr-mnt-03"></a>NFR-MNT-03 | Use-Case-IDs aus dieser Spezifikation werden in Tests/Dokumentation referenziert. |
