# Ausnahme f├╝r eine transitive Entwicklungsabh├ñngigkeit

Stand: 04.10.2026.

## Advisory

- GitHub Advisory: `GHSA-vfj7-8cjw-p6xm`
- Quelle im npm-Audit: `braces <= 3.0.3`
- betroffene lokale Kette: `eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces`
- Schweregrad im npm-Audit: high

## Abgrenzung

Die Kette geh├Ârt zu den Entwicklungs-/Lint-Abh├ñngigkeiten. `npm audit --omit=dev` ist aktuell sauber. Das gebaute Runtime-Image installiert nur Produktionsabh├ñngigkeiten.

Der npm-Registry-Stand vom 04.10.2026 liefert f├╝r `braces` keine Version oberhalb von `3.0.3`. Der von npm angebotene automatische Fix w├╝rde `eslint-config-next` auf `14.2.35` zur├╝cksetzen und damit die Next-16-Baseline des Projekts verlassen. Dieser Downgrade wird nicht verwendet.

## CI-Regel

`npm run security:audit`:

1. verlangt **0** Advisories in Produktionsabh├ñngigkeiten;
2. akzeptiert im vollst├ñndigen Audit nur exakt diese Advisory und nur exakt die f├╝nf daraus abgeleiteten Pakete;
3. schl├ñgt bei jeder zus├ñtzlichen oder ver├ñnderten Advisory fehl;
4. wird wieder auf vollst├ñndige Null-Toleranz vereinfacht, sobald die Upstream-Kette eine gepatchte Version bereitstellt.

Die Ausnahme erlaubt keinen Einsatz von `npm audit fix --force` und keine pauschale Absenkung des Audit-Levels.

## Aufhebung

Vor jedem Release wird erneut `npm run security:audit` ausgef├╝hrt. Sobald ein kompatibler Upstream-Fix vorhanden ist, werden Lockfile/Dependencies aktualisiert, die Ausnahme entfernt und die vollst├ñndige Test-/Build-Suite erneut ausgef├╝hrt.
