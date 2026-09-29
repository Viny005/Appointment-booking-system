# Dokumentationsprüfung

## Reproduzierbarer Ablauf

Im Repository `python tools/check_docs.py` und `git diff --check` ausführen. Der Prüfer verwendet nur die Python-Standardbibliothek. Mit `--external` prüft er zusätzlich die Erreichbarkeit aller HTTP(S)-Links per GET; Netzwerkzugriff ist dafür nötig.

Prüfumfang: alle Markdown-Dateien, Inline-/Referenzlinks und Bilder, lokale Dateien/Verzeichnisse, explizite und GitHub-artige Überschriftenanker; eindeutige kanonische IDs, unbekannte Verweise und vollständige Verknüpfung von Zielen, Constraints, Use Cases, Funktionen und NFRs in der Matrix. Alle zwölf arc42-Kapitel, Siedersleben-Bausteine und zehn ADRs müssen vorhanden sein; ADR-Kernabschnitte müssen Text enthalten. Keine Anwendungslaufzeit wird gestartet.

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

## Prueflauf vom 2026-09-29

49 Markdown-Dateien, 804 Links, 157 kanonische IDs: keine Fehler. Alle fuenf externen URLs antworteten mit HTTP 200. Die abschliessende Git-Whitespace-Pruefung muss vor dem Commit ebenfalls erfolgreich sein.
