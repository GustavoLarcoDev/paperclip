// Company-level preference for the natural language agents write their
// user-facing output in (comments, documents, issues, messages). Stored as a
// BCP-47 tag; null means "no preference" (agents keep their default).

export const AGENT_RESPONSE_LANGUAGE_MAX_LENGTH = 35;

// Short curated list for the settings UI. Any valid BCP-47 tag is accepted by
// the API; this list only drives the selector.
export const AGENT_RESPONSE_LANGUAGE_OPTIONS = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
] as const;

/**
 * Canonicalizes a BCP-47 language tag ("ES" -> "es", "pt-br" -> "pt-BR").
 * Returns null when the value is empty or not a well-formed tag.
 */
export function canonicalizeAgentResponseLanguage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > AGENT_RESPONSE_LANGUAGE_MAX_LENGTH) return null;
  try {
    return Intl.getCanonicalLocales(trimmed)[0] ?? null;
  } catch {
    return null;
  }
}

/** English display name for a language tag ("es" -> "Spanish"); falls back to the tag. */
export function describeAgentResponseLanguage(code: string): string {
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(code);
    if (name && name !== code) return name;
  } catch {
    // Fall through to the raw tag.
  }
  return code;
}

/**
 * Prompt directive injected into every agent wake when the company has a
 * response-language preference. Returns "" when there is no valid preference.
 */
export function renderAgentResponseLanguageDirective(value: unknown): string {
  const code = canonicalizeAgentResponseLanguage(value);
  if (!code) return "";
  const name = describeAgentResponseLanguage(code);
  const label = name === code ? code : `${name} (${code})`;
  return (
    `Write all user-facing output — comments, documents, issue titles and descriptions, ` +
    `interaction prompts, and messages — in ${label}, regardless of the language of these ` +
    `instructions. Keep code, identifiers, commands, file paths, and quoted source text unchanged.`
  );
}
