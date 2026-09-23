import type { Resource } from "i18next";

import { assertValidLocaleMessages } from "./locale-validation";

export const DEFAULT_LOCALE = "en" as const;

const localeModules = import.meta.glob("./locales/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

export const localeMessages = Object.fromEntries(
  Object.entries(localeModules).map(([path, messages]) => {
    const locale = path.match(/\/([A-Za-z0-9_-]+)\.json$/)?.[1];
    if (!locale) {
      throw new Error(`Invalid locale file path: ${path}`);
    }
    return [locale, messages];
  }),
);

if (!(DEFAULT_LOCALE in localeMessages)) {
  throw new Error(`Missing default locale messages for ${DEFAULT_LOCALE}`);
}

for (const [locale, messages] of Object.entries(localeMessages)) {
  try {
    assertValidLocaleMessages(messages);
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
