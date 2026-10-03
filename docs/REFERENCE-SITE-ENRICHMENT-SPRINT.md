# Sprint 17 – Enrichissement depuis le site de référence

Date d'audit : 2026-10-03. Référence fonctionnelle : `https://test.finance237.de`.
Principe : enrichir l'application de rendez-vous existante sans retirer ni affaiblir les garanties déjà intégrées.

## Éléments observés à reprendre

- présence publique par conseiller : lien propre, nom, titre, portrait, texte de présentation, contacts, services ;
- carte digitale et export vCard ;
- français / allemand et navigation publique plus complète ;
- pages accompagnement, méthode, à propos, contact et FAQ recherchable ;
- simulateurs réalisés côté navigateur, sans transfert automatique des chiffres au conseiller ;
- espace client comme lien explicite vers le portail externe approprié ;
- préparation facultative après confirmation du rendez-vous, avec authentification dédiée ;
- dépôt / modération d'avis ;
- parcours rejoindre l'équipe ;
- administration multi-conseiller, brouillon/publication/suspension et aperçu ;
- second facteur pour les accès administratifs ;
- contenus légaux et go-live gates explicites.

## Réseau DVAG

Le catalogue commun est source-backed et distingue les `PRODUCT_PARTNER` des `COOPERATION`.
Source officielle : https://www.dvag.de/dvag/allfinanzberatung/produktpartner.html
Vérification : 2026-10-03. Aucun partenaire ne doit être ajouté comme « partenaire DVAG » sans vérification officielle actuelle.
L'affichage sur une fiche conseiller décrit le réseau DVAG et ne crée pas une affirmation de relation individuelle du conseiller avec chaque société.

## Séquence d'implémentation

1. fiche publique multi-conseiller + présélection du conseiller dans la réservation ;
2. carte digitale/vCard + contacts et réseau DVAG ;
3. FR/DE et contenu public/FAQ ;
4. simulateurs locaux et accessibles, sans conseil produit automatique ;
5. préparation privée et avis avec rétention/audit ;
6. MFA et self-service conseiller ;
7. recette complète et activation uniquement après les go-live gates applicables.

Les qualifications professionnelles, numéros de registre, statuts d'intermédiation et textes juridiques ne sont jamais inventés à partir d'une formation ou d'un rôle interne : ils exigent les données réelles validées de l'exploitant/conseiller.

## Jalon local validé – 2026-10-03

- fiche publique par conseiller avec slug, contacts publics, présentation, photo existante et services ;
- carte digitale vCard, activable par profil ;
- catalogue DVAG source-backed avec séparation produit / coopération ;
- présélection du conseiller depuis sa page publique vers le booking ;
- calendrier de réservation applicatif : seuls les jours contenant au moins un créneau réservable sont activables ;
- jours sans disponibilité désactivés avant interaction, avec navigation mensuelle et états accessibles ;
- refonte visuelle du booking (desktop/mobile) sans suppression des contrôles existants ;
- régression browser dédiée + axe/WCAG ;
- garde HTTPS de production inchangée ; le harnais Playwright utilise une URL HTTPS de configuration pour les tests next start.

Validation du jalon : lint, typecheck, build production, 319 tests unitaires et 8 tests Chromium.
