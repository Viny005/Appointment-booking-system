# Ausnahme für eine transitive Entwicklungsabhängigkeit

Stand: 04.10.2026.

## Advisory

- GitHub Advisory: `GHSA-vfj7-8cjw-p6xm`
- Quelle im npm-Audit: `braces <= 3.0.3`
- betroffene lokale Kette: `eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces`
- Schweregrad im npm-Audit: high

## Abgrenzung

Die Kette gehört zu den Entwicklungs-/Lint-Abhängigkeiten. `npm audit --omit=dev` ist aktuell sauber. Das gebaute Runtime-Image installiert nur Produktionsabhängigkeiten.

Der npm-Registry-Stand vom 04.10.2026 liefert für `braces` keine Version oberhalb von `3.0.3`. Der von npm angebotene automatische Fix würde `eslint-config-next` auf `14.2.35` zurücksetzen und damit die Next-16-Baseline des Projekts verlassen. Dieser Downgrade wird nicht verwendet.

## CI-Regel

`npm run security:audit`:

1. verlangt **0** Advisories in Produktionsabhängigkeiten;
2. akzeptiert im vollständigen Audit nur exakt diese Advisory und nur exakt die fünf daraus abgeleiteten Pakete;
3. schlägt bei jeder zusätzlichen oder veränderten Advisory fehl;
4. wird wieder auf vollständige Null-Toleranz vereinfacht, sobald die Upstream-Kette eine gepatchte Version bereitstellt.

Die Ausnahme erlaubt keinen Einsatz von `npm audit fix --force` und keine pauschale Absenkung des Audit-Levels.

## Aufhebung

Vor jedem Release wird erneut `npm run security:audit` ausgeführt. Sobald ein kompatibler Upstream-Fix vorhanden ist, werden Lockfile/Dependencies aktualisiert, die Ausnahme entfernt und die vollständige Test-/Build-Suite erneut ausgeführt.
