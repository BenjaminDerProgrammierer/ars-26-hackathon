export const languages = {
  en: "English",
  de: "Deutsch",
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = "en";

export function isLang(value: string | undefined): value is Lang {
  return value === "en" || value === "de";
}

export const ui = {
  en: {
    "site.title": "AI Hackathon",
    "site.affiliation": "Ars Electronica Festival 2026",
    "site.theme": "Future Begins / Negotiating Humanity",
    "site.datePlace": "September 11–12, 2026 // Linz, Austria",

    "nav.home": "Hackathon",
    "nav.about": "About",
    "nav.tutorials": "Tutorials",
    "nav.datasets": "Datasets",
    "nav.agents": "Development & AI",
    "nav.login": "Login",
    "nav.local.label": "Hackathon navigation",

    "footer.claim": "A sub-event of Ars Electronica Festival 2026.",
    "footer.contact": "Contact",
    "footer.imprint": "Imprint",
    "footer.privacy": "Privacy",

    "lang.switch.label": "Language",
    "lang.stub.note": "The full German version is coming soon.",

    "redeem.eyebrow": "Access code",
    "redeem.title": "Redeem your code",
    "redeem.intro":
      "Enter the short code you received to reveal your access information.",
    "redeem.code.label": "Redeem code",
    "redeem.code.hint":
      "Use the 10–64 character code from your handout. Spaces and hyphens are optional.",
    "redeem.submit": "Redeem",
    "redeem.result.label": "Your access information",
    "redeem.error.label": "Unable to redeem code",
    "redeem.error.unavailable": "This code is invalid, disabled, or expired.",
    "redeem.error.service":
      "The redemption service is temporarily unavailable. Please try again later.",
    "redeem.error.rateLimit":
      "Too many attempts. Please wait a minute and try again.",
  },
  de: {
    "site.title": "AI Hackathon",
    "site.affiliation": "Ars Electronica Festival 2026",
    "site.theme": "Future Begins / Negotiating Humanity",
    "site.datePlace": "11.–12. September 2026 // Linz, Österreich",

    "nav.home": "Hackathon",
    "nav.about": "Über",
    "nav.tutorials": "Tutorials",
    "nav.datasets": "Datensätze",
    "nav.agents": "Entwicklung & KI",
    "nav.login": "Login",
    "nav.local.label": "Hackathon-Navigation",

    "footer.claim": "Ein Sub-Event des Ars Electronica Festival 2026.",
    "footer.contact": "Kontakt",
    "footer.imprint": "Impressum",
    "footer.privacy": "Datenschutz",

    "lang.switch.label": "Sprache",
    "lang.stub.note": "Die vollständige deutsche Fassung folgt in Kürze.",

    "redeem.eyebrow": "Zugangscode",
    "redeem.title": "Code einlösen",
    "redeem.intro":
      "Gib den erhaltenen Kurzcode ein, um deine Zugangsinformationen anzuzeigen.",
    "redeem.code.label": "Einlösecode",
    "redeem.code.hint":
      "Verwende den 10–64 Zeichen langen Code von deinem Handzettel. Leerzeichen und Bindestriche sind optional.",
    "redeem.submit": "Einlösen",
    "redeem.result.label": "Deine Zugangsinformationen",
    "redeem.error.label": "Code kann nicht eingelöst werden",
    "redeem.error.unavailable":
      "Dieser Code ist ungültig, deaktiviert oder abgelaufen.",
    "redeem.error.service":
      "Der Einlösedienst ist vorübergehend nicht verfügbar. Bitte versuche es später erneut.",
    "redeem.error.rateLimit":
      "Zu viele Versuche. Bitte warte eine Minute und versuche es erneut.",
  },
} as const;

export type UiKey = keyof (typeof ui)["en"];

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

/** Locale-prefixed internal link, including Astro's configured deployment base. */
export function href(lang: Lang, path = ""): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const clean = path.replace(/^\/+/, "");
  const suffix = clean === "" ? "" : clean.endsWith("/") ? clean : `${clean}/`;
  return `${base}${lang}/${suffix}`;
}
