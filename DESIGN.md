# Design-Leitlinien

## North Star

**Ruhig, professionell, vertrauenswürdig und schnell verständlich.** Die öffentliche Buchungsoberfläche soll sich an der Klarheit etablierter Buchungssysteme orientieren, ohne deren konkrete Gestaltung zu kopieren.

## Öffentliche Oberfläche

- Profilkarten mit Foto, Name, Rolle/Kurzbeschreibung und eindeutiger Aktion **„Termin buchen“**.
- Buchungsprozess als klarer, mehrseitiger Wizard mit sichtbarem Fortschritt.
- Im Kalender sind ausschließlich tatsächlich buchbare Tage aktiv; nicht verfügbare Tage sind deaktiviert.
- Uhrzeiten erscheinen erst nach Auswahl eines buchbaren Tages.
- Vor der finalen Bestätigung wird eine vollständige Zusammenfassung angezeigt.
- Nach erfolgreicher Buchung wird ein deutlicher Bestätigungszustand mit **„Zum Kalender hinzufügen“** angezeigt.

## Interne Oberfläche

- Admin- und Beraterbereiche sind funktional getrennt von der öffentlichen Buchung.
- Kalenderansichten: Tag, Woche, Monat.
- Verfügbarkeiten werden über wiederkehrende Wochenregeln und konkrete Ausnahmen gepflegt.
- Konflikte bei überlappenden Verfügbarkeitsintervallen werden erklärt; eine Zusammenführung wird angeboten, aber nicht ungefragt ausgeführt.

## Accessibility

- Semantisches HTML, sichtbare Fokuszustände, Tastaturbedienung.
- Formulare mit Labels, Fehlermeldungen und verständlichen Hilfetexten.
- Information darf nicht ausschließlich über Farbe vermittelt werden.
- Zielniveau: WCAG 2.2 AA für die zentralen Flows; Abweichungen erfordern dokumentierte Abnahme und Begründung.

## Branding

Logo, finale Farben und Typografie sind noch nicht festgelegt. Die technische Implementierung soll Design-Tokens verwenden, damit Branding später ohne strukturelle Änderungen angepasst werden kann.
