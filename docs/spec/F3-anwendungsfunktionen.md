# F3 — Anwendungsfunktionen

| ID | Funktion | Beschreibung |
|---|---|---|
| <a id="af-01"></a>AF-01 | Aktive Profile liefern | Gibt nur öffentlich buchbare Profile zurück. |
| <a id="af-02"></a>AF-02 | Profilservices liefern | Gibt aktive Services eines Profils zurück. |
| <a id="af-03"></a>AF-03 | Teilnehmerbeziehungen auflösen | Ermittelt zusätzliche Teilnehmer und Default-/Removable-Eigenschaften. |
| <a id="af-04"></a>AF-04 | Effektive Tagesverfügbarkeit berechnen | Wochenmuster + Ausnahmen + Blockierungen. |
| <a id="af-05"></a>AF-05 | Mehrpersonen-Verfügbarkeit schneiden | Bildet Schnittmenge aller tatsächlichen Berater. |
| <a id="af-06"></a>AF-06 | Belegte Zeit entfernen | Entfernt bestätigte/aktive Termine. |
| <a id="af-07"></a>AF-07 | Buchbare Startzeiten generieren | Berücksichtigt Servicedauer, Slot-Schritt, 24 h Vorlauf und 3 Monate Horizont. |
| <a id="af-08"></a>AF-08 | Buchbaren Tag bestimmen | Tag aktiv, wenn mindestens ein gültiger Startslot existiert. |
| <a id="af-09"></a>AF-09 | Verfügbarkeitsüberschneidung erkennen | Erkennt überlappende Intervalle. |
| <a id="af-10"></a>AF-10 | Fusionsvorschlag berechnen | Ermittelt minimalen zusammenhängenden Merge-Bereich. |
| <a id="af-11"></a>AF-11 | Kundendaten validieren | Pflichtfelder, E-Mail/Telefon, optionale Gäste. |
| <a id="af-12"></a>AF-12 | Termin atomar buchen | Revalidierung + Kollisionsschutz + Persistenz. |
| <a id="af-13"></a>AF-13 | Sicheren Verwaltungslink erzeugen | Erzeugt nicht erratbaren Token, speichert nur Hash. |
| <a id="af-14"></a>AF-14 | Termin ändern | Atomare Umbuchung, Kalendersequenz erhöhen. |
| <a id="af-15"></a>AF-15 | Termin stornieren | Status ändern, Ressourcen freigeben, Kalender-Cancel erzeugen. |
| <a id="af-16"></a>AF-16 | `.ics` erzeugen | REQUEST bei Anlage/Änderung, CANCEL bei Stornierung mit stabiler UID. |
| <a id="af-17"></a>AF-17 | E-Mail planen/versenden | Beteiligte und Gäste; keine unbeteiligten Profile. |
| <a id="af-18"></a>AF-18 | Erinnerung planen | Standard 24 h vor Termin. |
| <a id="af-19"></a>AF-19 | Interne Sitzung verwalten | Login, Idle-Timeout, Absolute-Timeout, Logout. |
| <a id="af-20"></a>AF-20 | Rollen/Berechtigungen prüfen | Serverseitige Autorisierung je Operation. |
| <a id="af-21"></a>AF-21 | Passwortreset verwalten | Einmalige, ablaufende Token. |
| <a id="af-22"></a>AF-22 | personenbezogene Daten anonymisieren | Nach Aufbewahrungsregel, Historie bleibt fachlich erhalten. |
| <a id="af-23"></a>AF-23 | Audit-Log schreiben | Relevante interne Änderungen protokollieren. |
| <a id="af-24"></a>AF-24 | Meetinginformationen auflösen | Präsenz/Telefon/Online/ClientChoice; V1 manuell, später Provider. |
