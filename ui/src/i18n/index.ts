import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales } from "./locales";

/** Viewer's explicit language choice; absent means "follow the browser". */
export const LOCALE_STORAGE_KEY = "paperclip.locale";

/**
 * Pick the first supported locale for a list of BCP-47 tags: an exact match
 * ("pt-BR"), then the base language ("es-EC" -> "es"), then any regional
 * variant of that base ("pt" -> "pt-BR").
 */
export function matchSupportedLocale(
  requested: readonly string[],
  available: readonly string[] = supportedLocales,
): string | null {
  const byLowercase = new Map(available.map((locale) => [locale.toLowerCase(), locale]));
  for (const tag of requested) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) continue;
    const exact = byLowercase.get(normalized);
    if (exact) return exact;
    const base = normalized.split("-")[0]!;
    const baseMatch = byLowercase.get(base);
    if (baseMatch) return baseMatch;
    const regional = available.find((locale) => locale.toLowerCase().startsWith(`${base}-`));
    if (regional) return regional;
  }
  return null;
}

export function readStoredLocale(): string | null {
  try {
    const stored = globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY) ?? null;
    return stored && supportedLocales.includes(stored) ? stored : null;
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return null;
  }
}

function browserLocales(): string[] {
  if (typeof navigator === "undefined") return [];
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) return [...navigator.languages];
  return navigator.language ? [navigator.language] : [];
}

export function resolveInitialLocale(): string {
  return readStoredLocale() ?? matchSupportedLocale(browserLocales()) ?? DEFAULT_LOCALE;
}

function applyDocumentLanguage(locale: string) {
  if (typeof document !== "undefined") document.documentElement.lang = locale;
}

const initialLocale = resolveInitialLocale();

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});
applyDocumentLanguage(initialLocale);

/**
 * Switch the interface language. `null` clears the explicit choice and follows
 * the browser language again.
 */
export function setLocalePreference(locale: string | null) {
  try {
    if (locale) globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, locale);
    else globalThis.localStorage?.removeItem(LOCALE_STORAGE_KEY);
  } catch {
    // The in-memory switch below still applies for this session.
  }
  const next = locale && supportedLocales.includes(locale) ? locale : resolveInitialLocale();
  applyDocumentLanguage(next);
  void i18n.changeLanguage(next);
}

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

export const useTranslation = useReactI18nextTranslation;
export { i18n };
