# Rückverfolgbarkeit und Abnahmeplan

Jede Referenz verweist auf eine kanonische Definition. Architektur und geplante Nachweise sind Zielbild, noch keine ausgeführten Anwendungstests.

## Use Cases

| Use Case | Funktionen | Architekturbaustein | Geplanter Nachweis |
|---|---|---|---|
| [UC-01](spec/F2-anwendungsfaelle.md#uc-01) | [AF-01](spec/F3-anwendungsfunktionen.md#af-01) | Profiles & Services; [A05](arch/A05-building-block-view.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [UC-02](spec/F2-anwendungsfaelle.md#uc-02) | [AF-02](spec/F3-anwendungsfunktionen.md#af-02) | Profiles & Services; [A05](arch/A05-building-block-view.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [UC-03](spec/F2-anwendungsfaelle.md#uc-03) | [AF-03](spec/F3-anwendungsfunktionen.md#af-03) | ParticipantResolver; [A05](arch/A05-building-block-view.md) | [QS-03](arch/A10-quality-requirements.md#qs-03) |
| [UC-04](spec/F2-anwendungsfaelle.md#uc-04) | [AF-04](spec/F3-anwendungsfunktionen.md#af-04), [AF-05](spec/F3-anwendungsfunktionen.md#af-05), [AF-06](spec/F3-anwendungsfunktionen.md#af-06), [AF-07](spec/F3-anwendungsfunktionen.md#af-07), [AF-08](spec/F3-anwendungsfunktionen.md#af-08) | AvailabilityEngine; [A05](arch/A05-building-block-view.md) | [QS-02](arch/A10-quality-requirements.md#qs-02), [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [UC-05](spec/F2-anwendungsfaelle.md#uc-05) | [AF-11](spec/F3-anwendungsfunktionen.md#af-11) | Booking Draft; [A05](arch/A05-building-block-view.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [UC-06](spec/F2-anwendungsfaelle.md#uc-06) | [AF-12](spec/F3-anwendungsfunktionen.md#af-12), [AF-13](spec/F3-anwendungsfunktionen.md#af-13), [AF-17](spec/F3-anwendungsfunktionen.md#af-17) | Booking; [A05](arch/A05-building-block-view.md) | [QS-01](arch/A10-quality-requirements.md#qs-01), [QS-13](arch/A10-quality-requirements.md#qs-13) |
| [UC-07](spec/F2-anwendungsfaelle.md#uc-07) | [AF-16](spec/F3-anwendungsfunktionen.md#af-16) | CalendarFileGenerator; [A05](arch/A05-building-block-view.md) | [QS-07](arch/A10-quality-requirements.md#qs-07), [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [UC-08](spec/F2-anwendungsfaelle.md#uc-08) | [AF-13](spec/F3-anwendungsfunktionen.md#af-13), [AF-20](spec/F3-anwendungsfunktionen.md#af-20) | Identity & Access; [A05](arch/A05-building-block-view.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [UC-09](spec/F2-anwendungsfaelle.md#uc-09) | [AF-14](spec/F3-anwendungsfunktionen.md#af-14) | Appointment Management; [A05](arch/A05-building-block-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [UC-10](spec/F2-anwendungsfaelle.md#uc-10) | [AF-15](spec/F3-anwendungsfunktionen.md#af-15) | Appointment Management; [A05](arch/A05-building-block-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [UC-11](spec/F2-anwendungsfaelle.md#uc-11) | [AF-19](spec/F3-anwendungsfunktionen.md#af-19), [AF-20](spec/F3-anwendungsfunktionen.md#af-20) | Identity & Access; [A05](arch/A05-building-block-view.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |
| [UC-12](spec/F2-anwendungsfaelle.md#uc-12) | [AF-09](spec/F3-anwendungsfunktionen.md#af-09), [AF-10](spec/F3-anwendungsfunktionen.md#af-10) | Availability; [A05](arch/A05-building-block-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [UC-13](spec/F2-anwendungsfaelle.md#uc-13) | [AF-20](spec/F3-anwendungsfunktionen.md#af-20) | Appointment Management; [A05](arch/A05-building-block-view.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |
| [UC-14](spec/F2-anwendungsfaelle.md#uc-14) | [AF-14](spec/F3-anwendungsfunktionen.md#af-14), [AF-15](spec/F3-anwendungsfunktionen.md#af-15), [AF-23](spec/F3-anwendungsfunktionen.md#af-23) | Appointment Management; [A05](arch/A05-building-block-view.md) | [QS-09](arch/A10-quality-requirements.md#qs-09), [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [UC-15](spec/F2-anwendungsfaelle.md#uc-15) | [AF-20](spec/F3-anwendungsfunktionen.md#af-20), [AF-23](spec/F3-anwendungsfunktionen.md#af-23) | Profiles & Services; [A05](arch/A05-building-block-view.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [UC-16](spec/F2-anwendungsfaelle.md#uc-16) | [AF-20](spec/F3-anwendungsfunktionen.md#af-20), [AF-23](spec/F3-anwendungsfunktionen.md#af-23) | Profiles & Services; [A05](arch/A05-building-block-view.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [UC-17](spec/F2-anwendungsfaelle.md#uc-17) | [AF-03](spec/F3-anwendungsfunktionen.md#af-03), [AF-20](spec/F3-anwendungsfunktionen.md#af-20), [AF-23](spec/F3-anwendungsfunktionen.md#af-23) | ParticipantResolver; [A05](arch/A05-building-block-view.md) | [QS-03](arch/A10-quality-requirements.md#qs-03), [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [UC-18](spec/F2-anwendungsfaelle.md#uc-18) | [AF-20](spec/F3-anwendungsfunktionen.md#af-20), [AF-23](spec/F3-anwendungsfunktionen.md#af-23) | Identity & Access; [A05](arch/A05-building-block-view.md) | [QS-09](arch/A10-quality-requirements.md#qs-09), [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [UC-19](spec/F2-anwendungsfaelle.md#uc-19) | [AF-20](spec/F3-anwendungsfunktionen.md#af-20), [AF-23](spec/F3-anwendungsfunktionen.md#af-23) | Administration; [A05](arch/A05-building-block-view.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [UC-20](spec/F2-anwendungsfaelle.md#uc-20) | [AF-21](spec/F3-anwendungsfunktionen.md#af-21) | Identity & Access; [A05](arch/A05-building-block-view.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |

## Alle Anwendungsfunktionen

| Funktion | Architektur | Geplanter Nachweis |
|---|---|---|
| [AF-01](spec/F3-anwendungsfunktionen.md#af-01) | [A05](arch/A05-building-block-view.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [AF-02](spec/F3-anwendungsfunktionen.md#af-02) | [A05](arch/A05-building-block-view.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [AF-03](spec/F3-anwendungsfunktionen.md#af-03) | [A05](arch/A05-building-block-view.md) | [QS-03](arch/A10-quality-requirements.md#qs-03) |
| [AF-04](spec/F3-anwendungsfunktionen.md#af-04) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [AF-05](spec/F3-anwendungsfunktionen.md#af-05) | [A06](arch/A06-runtime-view.md) | [QS-02](arch/A10-quality-requirements.md#qs-02) |
| [AF-06](spec/F3-anwendungsfunktionen.md#af-06) | [A06](arch/A06-runtime-view.md) | [QS-01](arch/A10-quality-requirements.md#qs-01) |
| [AF-07](spec/F3-anwendungsfunktionen.md#af-07) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [AF-08](spec/F3-anwendungsfunktionen.md#af-08) | [A06](arch/A06-runtime-view.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [AF-09](spec/F3-anwendungsfunktionen.md#af-09) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [AF-10](spec/F3-anwendungsfunktionen.md#af-10) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [AF-11](spec/F3-anwendungsfunktionen.md#af-11) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [AF-12](spec/F3-anwendungsfunktionen.md#af-12) | [A06](arch/A06-runtime-view.md) | [QS-01](arch/A10-quality-requirements.md#qs-01) |
| [AF-13](spec/F3-anwendungsfunktionen.md#af-13) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [AF-14](spec/F3-anwendungsfunktionen.md#af-14) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [AF-15](spec/F3-anwendungsfunktionen.md#af-15) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [AF-16](spec/F3-anwendungsfunktionen.md#af-16) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-07](arch/A10-quality-requirements.md#qs-07) |
| [AF-17](spec/F3-anwendungsfunktionen.md#af-17) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-05](arch/A10-quality-requirements.md#qs-05) |
| [AF-18](spec/F3-anwendungsfunktionen.md#af-18) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-13](arch/A10-quality-requirements.md#qs-13) |
| [AF-19](spec/F3-anwendungsfunktionen.md#af-19) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |
| [AF-20](spec/F3-anwendungsfunktionen.md#af-20) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |
| [AF-21](spec/F3-anwendungsfunktionen.md#af-21) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [AF-22](spec/F3-anwendungsfunktionen.md#af-22) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-08](arch/A10-quality-requirements.md#qs-08) |
| [AF-23](spec/F3-anwendungsfunktionen.md#af-23) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [AF-24](spec/F3-anwendungsfunktionen.md#af-24) | [A05](arch/A05-building-block-view.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |

## Nichtfunktionale Anforderungen

| Anforderung | Architektur | Geplanter Nachweis |
|---|---|---|
| [NFR-A11Y-01](spec/N1-nichtfunktional.md#nfr-a11y-01) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [NFR-A11Y-02](spec/N1-nichtfunktional.md#nfr-a11y-02) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [NFR-A11Y-03](spec/N1-nichtfunktional.md#nfr-a11y-03) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [NFR-CON-01](spec/N1-nichtfunktional.md#nfr-con-01) | [A06](arch/A06-runtime-view.md) | [QS-01](arch/A10-quality-requirements.md#qs-01) |
| [NFR-CON-02](spec/N1-nichtfunktional.md#nfr-con-02) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [NFR-CON-03](spec/N1-nichtfunktional.md#nfr-con-03) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [NFR-MNT-01](spec/N1-nichtfunktional.md#nfr-mnt-01) | [A05](arch/A05-building-block-view.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-MNT-02](spec/N1-nichtfunktional.md#nfr-mnt-02) | [A05](arch/A05-building-block-view.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-MNT-03](spec/N1-nichtfunktional.md#nfr-mnt-03) | [A05](arch/A05-building-block-view.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-PERF-01](spec/N1-nichtfunktional.md#nfr-perf-01) | [A07](arch/A07-deployment-view.md) | [QS-10](arch/A10-quality-requirements.md#qs-10) |
| [NFR-PERF-02](spec/N1-nichtfunktional.md#nfr-perf-02) | [A07](arch/A07-deployment-view.md) | [QS-10](arch/A10-quality-requirements.md#qs-10) |
| [NFR-PRIV-01](spec/N1-nichtfunktional.md#nfr-priv-01) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [NFR-PRIV-02](spec/N1-nichtfunktional.md#nfr-priv-02) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [NFR-PRIV-03](spec/N1-nichtfunktional.md#nfr-priv-03) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [NFR-PRIV-04](spec/N1-nichtfunktional.md#nfr-priv-04) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [NFR-PRIV-05](spec/N1-nichtfunktional.md#nfr-priv-05) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [NFR-SEC-01](spec/N1-nichtfunktional.md#nfr-sec-01) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-SEC-02](spec/N1-nichtfunktional.md#nfr-sec-02) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-SEC-03](spec/N1-nichtfunktional.md#nfr-sec-03) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-SEC-04](spec/N1-nichtfunktional.md#nfr-sec-04) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |
| [NFR-SEC-05](spec/N1-nichtfunktional.md#nfr-sec-05) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-SEC-06](spec/N1-nichtfunktional.md#nfr-sec-06) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-SEC-07](spec/N1-nichtfunktional.md#nfr-sec-07) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-SEC-08](spec/N1-nichtfunktional.md#nfr-sec-08) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [NFR-UX-01](spec/N1-nichtfunktional.md#nfr-ux-01) | [A05](arch/A05-building-block-view.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [NFR-UX-02](spec/N1-nichtfunktional.md#nfr-ux-02) | [A05](arch/A05-building-block-view.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [NFR-UX-03](spec/N1-nichtfunktional.md#nfr-ux-03) | [A05](arch/A05-building-block-view.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [NFR-UX-04](spec/N1-nichtfunktional.md#nfr-ux-04) | [A05](arch/A05-building-block-view.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [NFR-UX-05](spec/N1-nichtfunktional.md#nfr-ux-05) | [A05](arch/A05-building-block-view.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |

## Ziele, Erfolgskriterien und Constraints

Die folgenden Zuordnungen halten auch nichtfunktionale Scope-Grenzen sichtbar.

| Definition | Architektur | Prüfbezug |
|---|---|---|
| [CON-01](spec/P1-constraints.md#con-01) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) und dokumentarische Scope-Prüfung |
| [CON-02](spec/P1-constraints.md#con-02) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [CON-03](spec/P1-constraints.md#con-03) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |
| [CON-04](spec/P1-constraints.md#con-04) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |
| [CON-05](spec/P1-constraints.md#con-05) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [CON-06](spec/P1-constraints.md#con-06) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-02](arch/A10-quality-requirements.md#qs-02) |
| [CON-07](spec/P1-constraints.md#con-07) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [CON-08](spec/P1-constraints.md#con-08) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [CON-09](spec/P1-constraints.md#con-09) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [CON-10](spec/P1-constraints.md#con-10) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [CON-11](spec/P1-constraints.md#con-11) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [CON-12](spec/P1-constraints.md#con-12) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [CON-13](spec/P1-constraints.md#con-13) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [CON-14](spec/P1-constraints.md#con-14) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [CON-15](spec/P1-constraints.md#con-15) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-03](arch/A10-quality-requirements.md#qs-03) |
| [CON-16](spec/P1-constraints.md#con-16) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-07](arch/A10-quality-requirements.md#qs-07) |
| [CON-17](spec/P1-constraints.md#con-17) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [CON-18](spec/P1-constraints.md#con-18) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |
| [CON-19](spec/P1-constraints.md#con-19) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [CON-20](spec/P1-constraints.md#con-20) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [CON-21](spec/P1-constraints.md#con-21) | [A08](arch/A08-cross-cutting-concepts.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [G-01](spec/P1-ziele-rahmenbedingungen.md#g-01) | [A05](arch/A05-building-block-view.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [G-02](spec/P1-ziele-rahmenbedingungen.md#g-02) | [A05](arch/A05-building-block-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [G-03](spec/P1-ziele-rahmenbedingungen.md#g-03) | [A05](arch/A05-building-block-view.md) | [QS-02](arch/A10-quality-requirements.md#qs-02) |
| [G-04](spec/P1-ziele-rahmenbedingungen.md#g-04) | [A05](arch/A05-building-block-view.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |
| [G-05](spec/P1-ziele-rahmenbedingungen.md#g-05) | [A05](arch/A05-building-block-view.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) |
| [G-06](spec/P1-ziele-rahmenbedingungen.md#g-06) | [A05](arch/A05-building-block-view.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [G-07](spec/P1-ziele-rahmenbedingungen.md#g-07) | [A05](arch/A05-building-block-view.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [NG-01](spec/P1-ziele-rahmenbedingungen.md#ng-01) | [A02](arch/A02-architecture-constraints.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) und dokumentarische Scope-Prüfung |
| [NG-02](spec/P1-ziele-rahmenbedingungen.md#ng-02) | [A02](arch/A02-architecture-constraints.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) und dokumentarische Scope-Prüfung |
| [NG-03](spec/P1-ziele-rahmenbedingungen.md#ng-03) | [A02](arch/A02-architecture-constraints.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) und dokumentarische Scope-Prüfung |
| [NG-04](spec/P1-ziele-rahmenbedingungen.md#ng-04) | [A02](arch/A02-architecture-constraints.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) und dokumentarische Scope-Prüfung |
| [NG-05](spec/P1-ziele-rahmenbedingungen.md#ng-05) | [A02](arch/A02-architecture-constraints.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) und dokumentarische Scope-Prüfung |
| [NG-06](spec/P1-ziele-rahmenbedingungen.md#ng-06) | [A02](arch/A02-architecture-constraints.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) und dokumentarische Scope-Prüfung |
| [NG-07](spec/P1-ziele-rahmenbedingungen.md#ng-07) | [A02](arch/A02-architecture-constraints.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) und dokumentarische Scope-Prüfung |
| [NG-08](spec/P1-ziele-rahmenbedingungen.md#ng-08) | [A02](arch/A02-architecture-constraints.md) | [QS-15](arch/A10-quality-requirements.md#qs-15) und dokumentarische Scope-Prüfung |
| [SC-01](spec/P1-ziele-rahmenbedingungen.md#sc-01) | [A06](arch/A06-runtime-view.md) | [QS-11](arch/A10-quality-requirements.md#qs-11) |
| [SC-02](spec/P1-ziele-rahmenbedingungen.md#sc-02) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [SC-03](spec/P1-ziele-rahmenbedingungen.md#sc-03) | [A06](arch/A06-runtime-view.md) | [QS-02](arch/A10-quality-requirements.md#qs-02) |
| [SC-04](spec/P1-ziele-rahmenbedingungen.md#sc-04) | [A06](arch/A06-runtime-view.md) | [QS-01](arch/A10-quality-requirements.md#qs-01) |
| [SC-05](spec/P1-ziele-rahmenbedingungen.md#sc-05) | [A06](arch/A06-runtime-view.md) | [QS-14](arch/A10-quality-requirements.md#qs-14) |
| [SC-06](spec/P1-ziele-rahmenbedingungen.md#sc-06) | [A06](arch/A06-runtime-view.md) | [QS-03](arch/A10-quality-requirements.md#qs-03) |
| [SC-07](spec/P1-ziele-rahmenbedingungen.md#sc-07) | [A06](arch/A06-runtime-view.md) | [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [SC-08](spec/P1-ziele-rahmenbedingungen.md#sc-08) | [A06](arch/A06-runtime-view.md) | [QS-09](arch/A10-quality-requirements.md#qs-09) |

## Architekturziele und Entscheidungen

| Ziel | Anforderungen | Nachweis |
|---|---|---|
| [QG-01](arch/A01-introduction-and-goals.md#qg-01) | [NFR-CON-01](spec/N1-nichtfunktional.md#nfr-con-01), [NFR-CON-03](spec/N1-nichtfunktional.md#nfr-con-03) | [QS-01](arch/A10-quality-requirements.md#qs-01), [QS-12](arch/A10-quality-requirements.md#qs-12) |
| [QG-02](arch/A01-introduction-and-goals.md#qg-02) | [NFR-MNT-01](spec/N1-nichtfunktional.md#nfr-mnt-01) | [QS-02](arch/A10-quality-requirements.md#qs-02), [QS-06](arch/A10-quality-requirements.md#qs-06), [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [QG-03](arch/A01-introduction-and-goals.md#qg-03) | [NFR-SEC-01](spec/N1-nichtfunktional.md#nfr-sec-01) | [QS-09](arch/A10-quality-requirements.md#qs-09), [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [QG-04](arch/A01-introduction-and-goals.md#qg-04) | [NFR-MNT-02](spec/N1-nichtfunktional.md#nfr-mnt-02) | [QS-16](arch/A10-quality-requirements.md#qs-16) |
| [QG-05](arch/A01-introduction-and-goals.md#qg-05) | [CON-02](spec/P1-constraints.md#con-02), [NFR-A11Y-03](spec/N1-nichtfunktional.md#nfr-a11y-03), [NFR-UX-04](spec/N1-nichtfunktional.md#nfr-ux-04) | [QS-11](arch/A10-quality-requirements.md#qs-11) |

Jede [ADR](../adr/README.md) nennt ihre Anforderungstreiber und Architekturkapitel. Risiken und Verantwortliche stehen in [A11](arch/A11-risks-and-technical-debts.md). Scope-Abnahme prüft zusätzlich das Fehlen von Shop-, Preis-, Zahlungs-, Bestell- und Kundenkontomodellen. Kalenderabnahme prüft REQUEST/CANCEL, stabile UID und steigende Sequenz in mindestens zwei Clients; keine automatische Synchronisation wird vorausgesetzt.
