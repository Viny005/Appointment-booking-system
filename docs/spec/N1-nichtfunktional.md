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
| <a id="nfr-sec-08"></a>NFR-SEC-08 | Provider-/Serversecrets liegen nie im Browser oder Repository. Notwendige Sessioncookies und explizite kurzlebige Management-/Reset-Capabilities sind begrenzte Ausnahmen; keine Tokens in Logs, Drittinhalten oder dauerhaftem Browserstorage. |

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
| <a id="nfr-a11y-03"></a>NFR-A11Y-03 | WCAG 2.2 AA ist verbindliches Projektziel, unabhängig von der rechtlichen BFSG-Anwendbarkeit. |

## Datenschutz

| ID | Anforderung |
|---|---|
| <a id="nfr-priv-01"></a>NFR-PRIV-01 | Datenminimierung: keine Kundenkonten, kein CRM, keine unnötigen Pflichtfelder. |
| <a id="nfr-priv-02"></a>NFR-PRIV-02 | Keine Werbe-/Tracking-Skripte in V1. |
| <a id="nfr-priv-03"></a>NFR-PRIV-03 | Personenbezogene Historiedaten werden nach definierter Frist anonymisiert. |
| <a id="nfr-priv-04"></a>NFR-PRIV-04 | Gäste erhalten beim ersten Kontakt Art.-14-Information mit tatsächlicher Datenquelle, Zweck, Rechtsgrundlage und Rechten. |
| <a id="nfr-priv-05"></a>NFR-PRIV-05 | Impressum/Datenschutz sind auf jeder öffentlichen Seite leicht erkennbar, unmittelbar erreichbar und ständig verfügbar; reale DDG-Pflichtangaben vor Produktion. |

## Wartbarkeit/Testbarkeit

| ID | Anforderung |
|---|---|
| <a id="nfr-mnt-01"></a>NFR-MNT-01 | Verfügbarkeitslogik ist von UI und E-Mail-Versand getrennt testbar. |
| <a id="nfr-mnt-02"></a>NFR-MNT-02 | Externe Dienste liegen hinter eigenen Adaptern. |
| <a id="nfr-mnt-03"></a>NFR-MNT-03 | Use-Case-IDs aus dieser Spezifikation werden in Tests/Dokumentation referenziert. |

## Ergänzungen der vertieften Review

| ID | Anforderung |
|---|---|
| <a id="nfr-sec-09"></a>NFR-SEC-09 | Profilfotos nur ADMIN; JPEG/PNG/WebP bis 5 MiB und maximal 4096 Pixel je Dimension. Server prüft tatsächlichen Typ und Decodierung, enkodiert neu ohne Metadaten, generiert Namen; kein SVG/Animation/ausführbarer Inhalt, kein Traversal, nicht ausführbarer Store und sichere Ersetzung. |
| <a id="nfr-sec-10"></a>NFR-SEC-10 | HTTPS und sichere Cookies; geprüfte CSP, HSTS nach Domänenvalidierung, nosniff, frame-ancestors, Referrer-/Permissions-Policy. Capability-Seiten no-referrer/no-store ohne Drittinhalt. Keine fachliche Mutation per GET. |
| <a id="nfr-con-04"></a>NFR-CON-04 | MeetingModePolicy ist nur Servicekonfiguration; jeder Termin hat genau einen konkret erlaubten Modus mit gültigen Meetingdaten. |
| <a id="nfr-con-05"></a>NFR-CON-05 | Interne Änderungen prüfen tatsächliche Beteiligung, erwartete Version und alle betroffenen Berater; Audit/Outbox atomar, kalenderwirksame Änderung genau einmal +1, Resend unverändert; Gastentfernung sagt ausschließlich dessen Einladung ab. |
| <a id="nfr-con-06"></a>NFR-CON-06 | Bei Erstellung/Umbuchung kein Reminder, wenn start minus 24 Stunden <= now; Bestätigung genügt. Genau 24 Stunden Vorlauf buchbar, Kundenselbstbedienung dann gesperrt. |
| <a id="nfr-con-07"></a>NFR-CON-07 | Profil und Konto haben unabhängige Lebenszyklen; Deaktivierung löscht keine Historie, ACTIVE erfordert vollständige Publikationsdaten/Service, letzter aktiver ADMIN geschützt. |
| <a id="nfr-priv-06"></a>NFR-PRIV-06 | Art.-13-Information bei Erhebung, dokumentierte Zwecke für Pflichttelefon/optionale Adresse/Notizen; Hinweis gegen unnötig sensible Freitexte, keine künstliche Pflicht-Einwilligung. |
| <a id="nfr-priv-07"></a>NFR-PRIV-07 | Nur technisch notwendige Sessions/Drafts/CSRF-Speicher in V1. Keine Tracker oder voreingestellter Cookiebanner; neue nicht notwendige Speicherung vor Aktivierung neu bewerten. |
| <a id="nfr-priv-08"></a>NFR-PRIV-08 | Go-live setzt dokumentierte Betreiberprüfung von DDG, DSGVO/AVV/TOM, TDDDG, BFSG/BFSGV, VSBG und Vertragsqualifikation voraus; keine erfundenen Betreiberwerte. |
| <a id="nfr-ux-06"></a>NFR-UX-06 | UTC-Instants mit IANA-Systemzone Europe/Berlin; Herbst-Doppelzeiten klar mit Offset unterscheiden, nicht existente Frühjahrszeit nie anbieten. |

[Rechtliche Produktionscheckliste](../LEGAL-COMPLIANCE-DE.md) · [Architektur](../arch/A08-cross-cutting-concepts.md).
