export type DvagPartnerCategory = "PRODUCT_PARTNER" | "COOPERATION";

export type DvagPartner = {
  name: string;
  category: DvagPartnerCategory;
  field: string;
  url: string;
};

// Verified against the official DVAG product-partner page on 2026-10-03.
// Keep this catalogue source-backed; do not add companies from marketing material alone.
export const DVAG_PARTNERS: readonly DvagPartner[] = [
  { name: "Generali", category: "PRODUCT_PARTNER", field: "Versicherung", url: "https://www.generali.de/" },
  { name: "Deutsche Bank", category: "PRODUCT_PARTNER", field: "Bank", url: "https://www.deutsche-bank.de/" },
  { name: "DWS", category: "PRODUCT_PARTNER", field: "Vermögensverwaltung", url: "https://www.dws.de/" },
  { name: "Deutsche Bausparkasse Badenia", category: "PRODUCT_PARTNER", field: "Bausparen und Finanzierung", url: "https://www.badenia.de/" },
  { name: "ADVOCARD", category: "PRODUCT_PARTNER", field: "Rechtsschutz", url: "https://www.advocard.de/" },
  { name: "Deutsche Verrechnungsstelle", category: "PRODUCT_PARTNER", field: "Rechnungsmanagement", url: "https://www.dv-gmbh.de/" },
  { name: "Allianz Global Investors", category: "PRODUCT_PARTNER", field: "Investmentmanagement", url: "https://de.allianzgi.com/" },
  { name: "Geiger Edelmetalle", category: "PRODUCT_PARTNER", field: "Edelmetalle", url: "https://geiger-edelmetalle.de/" },
  { name: "Commerzbank", category: "PRODUCT_PARTNER", field: "Bank", url: "https://www.commerzbank.de/" },
  { name: "Enpal", category: "PRODUCT_PARTNER", field: "Energielösungen", url: "https://www.enpal.de/" },
  { name: "HypoVereinsbank", category: "PRODUCT_PARTNER", field: "Bank", url: "https://www.hypovereinsbank.de/" },
  { name: "Openbank", category: "PRODUCT_PARTNER", field: "Bank", url: "https://www.openbank.de/" },
  { name: "BKK Linde", category: "PRODUCT_PARTNER", field: "Gesetzliche Krankenversicherung", url: "https://www.bkk-linde.de/" },
  { name: "FingerHaus", category: "COOPERATION", field: "Fertighaus", url: "https://www.fingerhaus.de/" },
  { name: "PlanetHome", category: "COOPERATION", field: "Immobilien", url: "https://www.planethome.de/" },
  { name: "FALC Immobilien", category: "COOPERATION", field: "Immobilien", url: "https://www.falcimmo.de/" },
] as const;

export const DVAG_PARTNER_SOURCE = {
  label: "Produktpartner der Deutschen Vermögensberatung",
  url: "https://www.dvag.de/dvag/allfinanzberatung/produktpartner.html",
  verifiedAt: "2026-10-03",
} as const;
