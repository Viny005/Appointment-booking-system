# Audit final avant intégration – Sprints 5 à 15

Date: 2026-10-02. Branche auditée: `feat/production-readiness` à partir de la pile Sprint 5 → 15.

## Résultat technique

- Arbre de travail propre après commit Sprint 15; aucun push direct vers `main`.
- 10 migrations historiques présentes et inchangées; `prisma migrate deploy` sur PostgreSQL 17 ne signale aucune migration en attente.
- Validation finale: lint OK, typecheck OK, Prisma generate/validate OK, 309 tests unitaires OK, 186 tests d’intégration PostgreSQL OK, build production OK, 7 tests Playwright OK, `npm audit` = 0 vulnérabilité, contrôle documentaire = 0 erreur, `git diff --check` OK.
- Les tests couvrent notamment collisions/atomicité, idempotence, concurrence, DST, capacités client, révocation, notifications/outbox, confidentialité destinataires, rappels, auth/session/reset, audit/retention, headers/CSP et affichage 320 CSS px.
- Aucun module de paiement, panier, checkout ou e-commerce n’a été ajouté.

## Sprints 13–15

Sprint 13 fournit le flux public sans compte client, avec serveur autoritatif, confidentialité des URLs/storage, DST et contrôle navigateur/a11y. Sprint 14 ajoute la pipeline d’images bornée et ré-encodée. Sprint 15 ajoute readiness, backup/restore et garde-fous de configuration.

## État juridique / exploitation

Le code ne doit pas être déclaré prêt pour un Go-live réel tant que les faits d’exploitation ne sont pas connus. Les bloqueurs documentés restent notamment: identité/adresse/contact de l’exploitant pour DDG §5; responsable/contacts, finalités, bases juridiques, destinataires, transferts et durées pour DSGVO Art. 13/14; validation des durées de conservation; inventaire du stockage terminal TDDDG §25; contrats/AVV et fournisseurs; qualification BFSG/BFSGV; position VSBG §§36–37; qualification du rendez-vous vis-à-vis du contrat consommateur; domaine/TLS/HSTS; test réel backup/restore; et recette WCAG complète.

Les pages publiques de développement n’inventent donc aucune donnée opérateur. La production readiness échoue volontairement tant que les approbations Privacy/Retention et la configuration HTTPS/HSTS ne sont pas présentes.

## Intégration GitHub

PR #5 à #12 forment la pile existante et restent non fusionnées. Les branches Sprint 13, 14 et 15 sont poussées. La création de PR via l’intégration GitHub de cette session est refusée par GitHub (permission de l’intégration), donc aucune fusion n’a été tentée.

Ordre d’intégration prévu après création des PR manquantes: #5 → #6 → #7 → #8 → #9 → #10 → #11 → #12 → Sprint 13 → Sprint 14 → Sprint 15. Après chaque fusion, rebaser/retargeter la PR suivante si GitHub ne le fait pas automatiquement, attendre CI verte et vérifier le diff. Une dernière PR vers `main` n’est autorisée qu’après résolution des bloqueurs de release applicables.

## Conclusion

La pile de développement prévue jusqu’au Sprint 15 est implémentée et validée techniquement. Le prochain acte n’est pas un ajout fonctionnel automatique: c’est la création des trois PR empilées manquantes, puis l’intégration contrôlée. Le déploiement réel reste distinct et bloqué par les décisions opérateur/juridiques et preuves d’exploitation ci-dessus.
