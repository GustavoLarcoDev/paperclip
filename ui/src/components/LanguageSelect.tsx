import { useId, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readStoredLocale, setLocalePreference, useTranslation } from "@/i18n";
import { DEFAULT_LOCALE, localeCoverage, supportedLocales } from "@/i18n/locales";

const AUTOMATIC = "auto";
/** Offer a language once most of the interface is translated into it. */
const MIN_OFFERED_COVERAGE = 0.5;

/** The locale's own name for itself, e.g. "español" for "es". */
function nativeLanguageName(locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(locale);
    return name ? name.charAt(0).toLocaleUpperCase(locale) + name.slice(1) : locale;
  } catch {
    return locale;
  }
}

export function offeredLocales(current: string | null): string[] {
  return supportedLocales
    .filter((locale) => locale === DEFAULT_LOCALE || locale === current || localeCoverage(locale) >= MIN_OFFERED_COVERAGE)
    .sort((a, b) => nativeLanguageName(a).localeCompare(nativeLanguageName(b)));
}

export function LanguageSelect() {
  const { t } = useTranslation();
  const id = useId();
  const [choice, setChoice] = useState<string>(() => readStoredLocale() ?? AUTOMATIC);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("profile.language.label", { defaultValue: "Language" })}</Label>
      <Select
        value={choice}
        onValueChange={(value) => {
          setChoice(value);
          setLocalePreference(value === AUTOMATIC ? null : value);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={AUTOMATIC}>
            {t("profile.language.automatic", { defaultValue: "Automatic (browser language)" })}
          </SelectItem>
          {offeredLocales(choice === AUTOMATIC ? null : choice).map((locale) => (
            <SelectItem key={locale} value={locale}>
              {nativeLanguageName(locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {t("profile.language.hint", {
          defaultValue: "Applies to this browser. Text that is not translated yet stays in English.",
        })}
      </p>
    </div>
  );
}
