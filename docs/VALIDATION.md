# Dokumentationsprüfung

## Reproduzierbarer Ablauf

Im Repository `python tools/check_docs.py` und `git diff --check` ausführen. Der Prüfer verwendet nur die Python-Standardbibliothek. Mit `--external` prüft er zusätzlich die Erreichbarkeit aller HTTP(S)-Links per GET; Netzwerkzugriff ist dafür nötig.

Prüfumfang: alle Markdown-Dateien, Inline-/Referenzlinks und Bilder, lokale Dateien/Verzeichnisse, explizite und GitHub-artige Überschriftenanker; eindeutige kanonische IDs, unbekannte Verweise und vollständige Verknüpfung aller ID-Kategorien in Register und Matrix. UC/AF/NFR benötigen Architektur- und QS-Zuordnung; QS benötigen einen Anforderungsbezug. Alle zwölf arc42-Kapitel, Siedersleben-Bausteine und elf ADRs müssen vorhanden sein; ADR-Kernabschnitte müssen Text enthalten und Status eindeutig sein. Keine Anwendungslaufzeit wird gestartet.

## Redaktioneller Abgleich

- Archivregeln für Rollen, Teilnehmer, Buchungsfenster, Sitzungen und Nichtziele übernommen.
- Kanonische Definitionen im [Register](ID-REGISTRY.md), Architektur- und Abnahmezuordnung in der [Matrix](TRACEABILITY.md).
- Outbox liegt innerhalb der Termintransaktion in Text, Mermaid und PlantUML.
- Domain hat keinen direkten DB-Zugriff; Infrastruktur implementiert Ports.
- Kalenderänderung ist REQUEST mit erhöhter Sequenz; kein METHOD:UPDATE.
- Kein Warenkorb, Zahlungsanbieter oder Verkaufsmodell; entsprechende Begriffe erscheinen ausschließlich als Abgrenzung.
- Entwurfspräzisierungen und offene Betreiberentscheidungen sind sichtbar gekennzeichnet.

## Grenzen

Ein erfolgreicher Dokumentationslauf bestätigt Link- und ID-Konsistenz sowie strukturelle Vollständigkeit, nicht die fachliche Freigabe. PlantUML-/Mermaid-Quellen werden textuell abgeglichen; ohne Diagrammrenderer wird keine Renderprüfung behauptet. Sicherheits-, Last-, Kalenderclient- und Wiederherstellungsszenarien werden erst mit einer Implementierung ausgeführt. Externe Links können sich nach der Prüfung ändern.

## Prüflauf der vertieften Revision vom 2026-09-29

Lokaler Prüfer: 52 Markdown-Dateien, 1152 Links, 192 kanonische IDs und 45 externe URLs; **0 interne Fehler**. Nach Wiederaufnahme mit Netzzugriff lieferte der externe Python-GET-Lauf 41 Antworten HTTP 200 und einmal HTTP 202 (EUR-Lex). Drei Abrufe scheiterten zunächst: BfDI und Datenschutz Sachsen an der lokalen Python-Zertifikatskette, VSBG § 37 an einem Verbindungsabbruch. Alle drei wurden mit PowerShell Invoke-WebRequest und aktivierter regulärer TLS-Prüfung erneut abgerufen: jeweils HTTP 200. Somit sind alle 45 Ziele erreichbar (44 HTTP 200, einmal HTTP 202); EUR-Lex bleibt eine Bot-/Zwischenseite und kein erfolgreicher Volltextabruf. Die in LEGAL-COMPLIANCE-DE dokumentierte behördliche Ersatzquelle bleibt maßgeblich für den Quellenabgleich. Keine Zertifikatsprüfung wurde deaktiviert; der rohe Python-Lauf hatte wegen der drei Umgebungsfehler Exitcode 1, der interne Lauf Exitcode 0.

Der Prüfer wurde zusätzlich in einer temporären Kopie gegen sechs absichtlich eingebaute Fehler geprüft: fehlende Datei, fehlender Anker, unbekannte ID, doppelte kanonische ID, undefinierter Referenzlink und uneindeutiger ADR-Status. Alle sechs werden mit Fehlerstatus erkannt; die Revision bleibt unverändert.

Fachlicher Abgleich: Meetingpolicy/-instanz, interne Operationen/Rechte, Snapshot-/Profil-/Kontolebenszyklus, Empfängerwechsel, Resend ohne Sequenzsprung, Reminder-Generation, DST, Uploads, HTTP-Header, Auth-Guard, Legal-Gates und neue Traceability-Zuordnungen. Diagramme textuell abgeglichen; kein PlantUML-Renderer/JAR gefunden, daher kein Rendering behauptet. Keine Anwendungstests oder Laufzeit-Kompatibilitätstests ausgeführt; die Szenarien sind Abnahmeverträge für den späteren Code.

Der Remote-Stand wurde vor Übernahme als 6f9aa0105b8da4a842e85e63a398bf2e0d801f04 bestätigt. Ein neuer Clone außerhalb OneDrive verwendet ausschließlich docs/initial-specification. Der erhaltene Patch bestand git apply --check und wurde vollständig übernommen. git diff --check bestanden. Commits und Remote-Stand werden im Übergabebericht mit ihrem tatsächlichen Ergebnis ausgewiesen. Dokumentations-READY ersetzt diese Veröffentlichungsprüfung nicht.
