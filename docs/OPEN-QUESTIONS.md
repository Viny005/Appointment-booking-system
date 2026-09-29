# Offene Entscheidungen und Freigaben

Die Dokumentation ist vollständig als erste Review-Baseline, die folgenden projektspezifischen Angaben bleiben bewusst offen. Sie sind keine bereits bestätigten Nutzeranforderungen.

| Thema | Arbeitsannahme | Zuständig | Spätestens zu entscheiden |
|---|---|---|---|
| Produktname, Branding | Appointment Booking System; Design-Tokens | Produktverantwortung | Vor UI-Implementierung |
| Oberflächensprache | Deutsch gemäß Archiv | Produktverantwortung | Vor UI-Implementierung |
| Hosting, Region, Budget | Node-Laufzeit, PostgreSQL, Worker/Scheduler | Betrieb | Vor Deployment-Implementierung |
| Mailprovider, Absender | MailGateway; Retry und Zustellstatus | Betrieb | Vor Integrationsabnahme |
| Bildspeicher | MediaStorage | Betrieb | Vor Profilbild-Implementierung |
| Betreibertexte, Verarbeitung, Fristen | Archiv: 12/6 Monate; keine Rechtssicherheitszusage | Betreiber/Datenschutzverantwortung | Vor Produktion |
| Fachliche Grenzfälle dieser Baseline | D1/D2, N2, B2: Zeitgrenzen, Status, Gäste und Änderungen | Fachverantwortung | Vor betroffener Implementierung |
| Lastprofil und Wiederherstellungsziele | A10/A07: initiale messbare Ziele | Betrieb und Entwicklung | Vor Last-/Betriebsabnahme |
| Auth-Bibliothek und Versionen | DB-Sessions, Passwortlogin, Server-Guards | Entwicklung | Vor Auth-Implementierung; Kompatibilität nachweisen |
| Online-Termine | Konfigurierter Link; keine automatische Teams-Verknüpfung | Betreiber | Vor Aktivierung eines Online-Services |

Architekturänderungen werden als neue oder ersetzende [ADR](../adr/README.md) dokumentiert. Die Freigaben ändern nichts am Ausschluss von E-Commerce.
