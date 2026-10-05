# Sprint 20 – Reference-site parity without weakening the booking system

Stand: 05.10.2026. Functional reference: `https://test.finance237.de`.

The reference is used as a product and UX benchmark. Text, branding, qualifications, legal statements, personal relationships and contract-specific promises are **not** copied as facts. Existing booking, privacy, security, concurrency and accessibility guarantees stay authoritative.

## Implemented in Sprint 20

The public advisor profile is now a linked multi-page microsite under `/berater/<slug>/...`:

- `themen` – only services currently published by this application's catalog;
- `ansatz` – structured conversation approach;
- `ueber-mich` – public profile/about information;
- `kontakt` – only explicitly public advisor contact data;
- `karte` – digital card, local vCard, share/copy actions and locally generated QR code;
- `kundenbereich` – booking, secure management guidance, preparation and external customer portal;
- `rechner` – browser-only budget, savings, goal and emergency-reserve calculators;
- `vorbereitung` – preparation checklist with no form submission or document upload;
- `service-hilfe` – verified external customer/service destinations;
- `sos` – emergency vs. contractual assistance separation;
- `karriere` – links to official DVAG career information without asserting that the advisor is the employer/recruiter.

`/service` redirects to the canonical `/service-hilfe` route.

All advisor microsite pages receive profile-specific metadata (`Name | Titel`) through the `[slug]` layout.

## Digital card and privacy

- QR generation happens locally in the application through `qrcode`; no external QR service receives the visitor URL.
- The vCard contains only public profile fields and explicitly excludes the notification e-mail.
- vCard slugs and download filenames are normalized before use.
- Calculator inputs remain in the browser. They are not posted to an API or written to web storage.
- The public preparation page stores no answers and requests no sensitive documents.

## Source-backed external resources

Central catalog: `src/content/public-resources.ts`.

Verified on 05.10.2026 against the official operators:

- DVAG customer portal;
- DVAG private-client information;
- DVAG product-partner overview;
- DVAG career, profession, part-time entry and application pages;
- Generali contact/service page;
- Generali Schutzbrief-Service page;
- EU/Your Europe information for emergency number 112.

The page does not copy contract-specific assistance numbers into application code. Current numbers and coverage remain on the operator page, reducing the risk of stale emergency/service information.

The existing DVAG partner catalogue remains explicitly described as a **DVAG network** list, not as an individual partnership claim by the advisor.

## Visual quality

The real local advisor profile was reviewed at desktop and mobile widths.

A malformed profile image containing a large transparent canvas plus isolated opaque artefacts exposed an upload-pipeline weakness. The image sanitizer now determines significant alpha-content bounds and crops transparent/sparse padding before WebP output. The existing local profile image was backed up and re-sanitized; no database image key changed.

## Reference features intentionally not copied as-is

### Reviews

The reference site's review page expects a personal e-mail link. A public anonymous review form is **not** added without a capability/token, moderation workflow, abuse controls, retention rules and operator decision.

### Private appointment preparation

The public checklist is safe and local. A personalized preparation record tied to a real appointment remains a separate future feature because it would introduce personal data and retention requirements.

### FR/DE

The reference offers French and German. The current V1 remains German end-to-end rather than exposing partially translated navigation while booking, legal and transactional e-mails remain German. Full i18n should be implemented as one coherent feature.

### Additional financial simulators

Only four transparent calculators were adopted. Product-, retirement-, property-, credit- or energy-specific calculators are not copied until their assumptions, disclosures and intended use are defined and validated.

### Tracker/analytics features

No advertising or analytics tracker is introduced merely for parity. The V1 keeps the current privacy-minimizing approach.

## Validation contract

Sprint 20 is not complete until all of the following are green:

- lint;
- typecheck;
- unit tests including calculator and image-processing regressions;
- PostgreSQL integration suite;
- production build;
- complete Playwright suite including the synthetic advisor microsite;
- runtime dependency audit;
- documentation/link checks;
- `git diff --check`.

After the full local validation is green, the branch may be pushed and opened as a stacked PR on Sprint 19. Auto-merge remains disabled.
