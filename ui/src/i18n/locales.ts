import type { Resource } from "i18next";

import { assertValidLocaleMessages } from "./locale-validation";

export const DEFAULT_LOCALE = "en" as const;

// Each locale is `locales/<locale>.json` plus optional per-area files
// `locales/<area>/<locale>.json`, so areas of the interface can be translated
// independently. Files for the same locale are merged; an area file owns its
// own top-level keys.
const localeModules = import.meta.glob("./locales/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

function isMessageObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeMessages(target: Record<string, unknown>, source: unknown, path: string) {
  if (!isMessageObject(source)) throw new Error(`Locale file ${path} must contain an object`);
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    if (isMessageObject(existing) && isMessageObject(value)) {
      mergeMessages(existing, value, path);
    } else if (existing !== undefined) {
      throw new Error(`Locale file ${path} redefines "${key}"`);
    } else {
      target[key] = isMessageObject(value) ? mergeMessages({}, value, path) : value;
    }
  }
  return target;
}

export const localeMessages: Record<string, unknown> = {};
for (const [path, messages] of Object.entries(localeModules).sort(([a], [b]) => a.localeCompare(b))) {
  const locale = path.match(/\/([A-Za-z0-9_-]+)\.json$/)?.[1];
  if (!locale) {
    throw new Error(`Invalid locale file path: ${path}`);
  }
  localeMessages[locale] = mergeMessages((localeMessages[locale] as Record<string, unknown>) ?? {}, messages, path);
}

if (!(DEFAULT_LOCALE in localeMessages)) {
  throw new Error(`Missing default locale messages for ${DEFAULT_LOCALE}`);
}

for (const [locale, messages] of Object.entries(localeMessages)) {
  try {
    assertValidLocaleMessages(messages, localeMessages[DEFAULT_LOCALE]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${locale} locale messages: ${message}`);
  }
}

export const supportedLocales = Object.keys(localeMessages);

export const i18nextResources: Resource = Object.fromEntries(
  Object.entries(localeMessages).map(([locale, messages]) => [locale, { translation: messages }]),
) as Resource;

export type SupportedLocale = keyof typeof localeMessages;

function countLeaves(messages: unknown, reference: unknown): { translated: number; total: number } {
  if (typeof reference === "string") {
    return { translated: typeof messages === "string" ? 1 : 0, total: 1 };
  }
  if (!reference || typeof reference !== "object") return { translated: 0, total: 0 };
  let translated = 0;
  let total = 0;
  for (const [key, value] of Object.entries(reference as Record<string, unknown>)) {
    const child = messages && typeof messages === "object" ? (messages as Record<string, unknown>)[key] : undefined;
    const counts = countLeaves(child, value);
    translated += counts.translated;
    total += counts.total;
  }
  return { translated, total };
}

/** Share of the English strings a locale translates (0..1); missing keys fall back to English. */
export function localeCoverage(locale: string): number {
  if (locale === DEFAULT_LOCALE) return 1;
  const { translated, total } = countLeaves(localeMessages[locale], localeMessages[DEFAULT_LOCALE]);
  return total === 0 ? 0 : translated / total;
}
