# Sprint 18 – Zentraler Leistungskatalog

## Ziel

Administratoren können Leistungen unabhängig von Beraterprofilen verwalten und anschließend gezielt für einzelne Profile freischalten. Profilbezogene individuelle Leistungen bleiben weiterhin möglich.

## Zwei Arten von Leistungen

### Zentrale Katalogleistung

Eine zentrale Leistung wird unter **Administration → Leistungskatalog** angelegt.

Der Administrator kann:

- eine Katalogleistung anlegen,
- ihre fachlichen Daten zentral bearbeiten,
- sie profilweise freischalten oder sperren,
- sie löschen, sobald keine aktive Profilfreischaltung mehr besteht.

Änderungen an einer Katalogleistung werden auf alle damit verbundenen Profil-Leistungen synchronisiert. Die Freischaltung eines Profils bleibt dabei erhalten.

Ein Berater kann eine zentrale Leistung in seinem Bereich sehen, aber weder deren Inhalte noch deren Freischaltung ändern.

### Individuelle Profilleistung

Eine individuelle Leistung wird direkt im jeweiligen Beraterprofil angelegt. Sie gehört nur diesem Profil und ist nicht mit dem zentralen Katalog verbunden.

Administratoren können sie anlegen, bearbeiten, aktivieren/deaktivieren und löschen. Ein zugeordneter Berater darf diese Funktionen nur ausführen, wenn die Administration die Verwaltung eigener Leistungen ausdrücklich freigegeben hat.

## Historische Sicherheit

Bestehende Leistungen werden durch die Migration nicht automatisch in Katalogleistungen umgewandelt.

Rendez-vous/Termine speichern die relevanten Leistungssnapshots bei der Buchung. Eine spätere Änderung einer Katalogleistung verändert daher keine historischen Terminsnapshots.

Beim Löschen einer zentralen Leistung werden inaktive Profilkopien vom Katalog getrennt, statt historische Referenzen zu zerstören. Eine physische Löschung einer Profilleistung wird zusätzlich durch Datenbank-Fremdschlüssel verhindert, wenn historische Termine sie noch referenzieren.

## Nebenläufigkeit

Katalogänderungen verwenden optimistische Versionen und Datenbank-Sperren. Die globale Sperrreihenfolge lautet:

1. Benutzer
2. Katalogleistungen
3. Beraterprofile

Eine gleichzeitige Freischaltung derselben Katalogleistung für dasselbe Profil kann dadurch nicht zu zwei Profil-Leistungen führen.

## Migration

Migration:

`20261004133000_global_service_catalog`

Sie ergänzt:

- Tabelle `ServiceTemplate`
- optionale Verknüpfung `Service.serviceTemplateId`
- Fremdschlüssel `ON DELETE SET NULL`
- Eindeutigkeit pro Profil und Katalogleistung
- Datenbank-Constraints für Dauer und Terminarten

Die Migration ist additiv. Bestehende `Service`-Datensätze behalten `serviceTemplateId = NULL`.

## Verifikation

Lokal verifiziert wurden:

- frische PostgreSQL-17-Datenbank mit allen 13 Migrationen,
- erneutes `prisma migrate deploy` ohne offene Migration,
- kein Prisma-Schema-Drift,
- Upgrade einer Kopie der bestehenden lokalen Datenbank ohne Verlust von Profil, Leistung oder Terminen,
- konkurrierende Freischaltung derselben Katalogleistung,
- vollständiger UI-Smoke-Test: anlegen → freischalten → zentral bearbeiten/synchronisieren → sperren → löschen → individuelle Leistung anlegen/löschen,
- vollständige Integrationssuite,
- Production-Build,
- vollständige Browser-Suite.
