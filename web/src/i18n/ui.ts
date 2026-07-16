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
    "nav.agents": "Coding Agents",
    "nav.login": "Login",
    "nav.local.label": "Hackathon navigation",

    "footer.claim": "A sub-event of Ars Electronica Festival 2026.",
    "footer.contact": "Contact",
    "footer.imprint": "Imprint",
    "footer.privacy": "Privacy",

    "lang.switch.label": "Language",
    "lang.stub.note": "The full German version is coming soon.",

    "login.title": "Login / Create account",
    "login.intro":
      "Attendee accounts unlock dataset downloads, coding-agent access, and your personal hackathon schedule. This page is a placeholder — no real account is created.",
    "login.tab.signin": "Sign in",
    "login.tab.register": "Create account",
    "login.name": "Full name",
    "login.email": "Email address",
    "login.password": "Password",
    "login.confirm": "Confirm password",
    "login.submit.signin": "Sign in",
    "login.submit.register": "Create account",
    "login.submitting": "One moment…",
    "login.error.name": "Please enter your name.",
    "login.error.email": "Please enter a valid email address.",
    "login.error.password": "Password must be at least 8 characters.",
    "login.error.confirm": "Passwords do not match.",
    "login.success.signin":
      "You are signed in — as much as a placeholder allows.",
    "login.success.register":
      "Your account was created — in placeholder terms only.",
    "login.success.note":
      "This is a demo. Nothing was stored and no account exists.",
    "login.reset": "Back to the form",
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
    "nav.agents": "Coding Agents",
    "nav.login": "Login",
    "nav.local.label": "Hackathon-Navigation",

    "footer.claim": "Ein Sub-Event des Ars Electronica Festival 2026.",
    "footer.contact": "Kontakt",
    "footer.imprint": "Impressum",
    "footer.privacy": "Datenschutz",

    "lang.switch.label": "Sprache",
    "lang.stub.note": "Die vollständige deutsche Fassung folgt in Kürze.",

    "login.title": "Login / Konto erstellen",
    "login.intro":
      "Teilnehmer:innen-Konten bieten Zugang zu Dataset-Downloads, Coding Agents und dem persönlichen Hackathon-Programm. Diese Seite ist ein Platzhalter — es wird kein echtes Konto angelegt.",
    "login.tab.signin": "Anmelden",
    "login.tab.register": "Konto erstellen",
    "login.name": "Vollständiger Name",
    "login.email": "E-Mail-Adresse",
    "login.password": "Passwort",
    "login.confirm": "Passwort bestätigen",
    "login.submit.signin": "Anmelden",
    "login.submit.register": "Konto erstellen",
    "login.submitting": "Einen Moment…",
    "login.error.name": "Bitte geben Sie Ihren Namen ein.",
    "login.error.email": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    "login.error.password": "Das Passwort muss mindestens 8 Zeichen haben.",
    "login.error.confirm": "Die Passwörter stimmen nicht überein.",
    "login.success.signin":
      "Sie sind angemeldet — so weit ein Platzhalter das erlaubt.",
    "login.success.register":
      "Ihr Konto wurde erstellt — allerdings nur als Platzhalter.",
    "login.success.note":
      "Dies ist eine Demo. Es wurde nichts gespeichert, es existiert kein Konto.",
    "login.reset": "Zurück zum Formular",
  },
} as const;

export type UiKey = keyof (typeof ui)["en"];

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

/** Locale-prefixed internal link; central so a future `base` path is a one-line change. */
export function href(lang: Lang, path = ""): string {
  const clean = path.replace(/^\/+/, "");
  const suffix = clean === "" ? "" : clean.endsWith("/") ? clean : `${clean}/`;
  return `/${lang}/${suffix}`;
}
