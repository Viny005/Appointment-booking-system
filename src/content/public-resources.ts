export type PublicResource = {
  label: string;
  description: string;
  url: string;
  operator: string;
};

export const PUBLIC_RESOURCES = {
  dvagCustomerPortal: {
    label: "DVAG Kundenportal",
    description: "Externer Zugang zu den von DVAG bereitgestellten Kundenfunktionen.",
    url: "https://kundenportal.dvag/",
    operator: "Deutsche Vermögensberatung",
  },
  dvagPrivateClients: {
    label: "DVAG für Privatkunden",
    description: "Offizielle Informationen zur Allfinanzberatung für Privatkundinnen und Privatkunden.",
    url: "https://www.dvag.de/dvag/allfinanzberatung/privatkunden.html",
    operator: "Deutsche Vermögensberatung",
  },
  dvagProductPartners: {
    label: "DVAG Produktpartner",
    description: "Offizielle Übersicht der Produktpartner der Deutschen Vermögensberatung.",
    url: "https://www.dvag.de/dvag/allfinanzberatung/produktpartner.html",
    operator: "Deutsche Vermögensberatung",
  },
  dvagCareer: {
    label: "DVAG Karriere",
    description: "Offizielle Karriere- und Einstiegsinformationen.",
    url: "https://www.dvag-karriere.de/",
    operator: "Deutsche Vermögensberatung",
  },
  dvagCareerProfession: {
    label: "Beruf Vermögensberater/-in",
    description: "Offizielle Informationen zum Berufsbild und zu Karrierewegen.",
    url: "https://www.dvag-karriere.de/beruf-vermoegensberater.html",
    operator: "Deutsche Vermögensberatung",
  },
  dvagCareerPartTime: {
    label: "Nebenberuflicher Einstieg",
    description: "Offizielle Informationen zu einem nebenberuflichen Einstieg.",
    url: "https://www.dvag-karriere.de/einstiegsmoeglichkeiten/nebenberuf.html",
    operator: "Deutsche Vermögensberatung",
  },
  dvagCareerApply: {
    label: "Jetzt bewerben",
    description: "Offizielle Bewerbungsseite der DVAG.",
    url: "https://www.dvag-karriere.de/jetzt-bewerben.html",
    operator: "Deutsche Vermögensberatung",
  },
  generaliContact: {
    label: "Generali Service & Kontakt",
    description: "Offizielle Kontakt- und Serviceübersicht der Generali in Deutschland.",
    url: "https://www.generali.de/service-kontakt",
    operator: "Generali Deutschland",
  },
  generaliProtectionService: {
    label: "Generali Schutzbrief-Service",
    description: "Aktuelle Assistance-, Hilfe- und Servicewege zu Schutzbriefleistungen.",
    url: "https://www.generali.de/service-kontakt/schutzbrief-service",
    operator: "Generali Deutschland",
  },
  euEmergency112: {
    label: "Europäische Notrufnummer 112",
    description: "Kostenloser Notruf zu Polizei, Rettungsdienst oder Feuerwehr in der EU.",
    url: "https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_de.htm",
    operator: "Europäische Union",
  },
} as const satisfies Record<string, PublicResource>;

export const PUBLIC_RESOURCE_VERIFICATION = {
  verifiedAt: "2026-10-05",
  note: "Links gegen die offiziellen Betreiberseiten geprüft. Externe Inhalte unterliegen dem jeweiligen Betreiber.",
} as const;
