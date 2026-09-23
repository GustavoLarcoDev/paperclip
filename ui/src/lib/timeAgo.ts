import { i18n } from "@/i18n";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

/**
 * Relative time in the interface language. English keeps the compact
 * "5m ago" form; other languages use Intl ("hace 5 min").
 */
export function formatRelativeAgo(value: number, unit: Intl.RelativeTimeFormatUnit): string | null {
  const locale = i18n.language;
  if (!locale || locale === "en" || locale.startsWith("en-")) return null;
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" }).format(-value, unit);
  } catch {
    return null;
  }
}

export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.round((now - then) / 1000);
  const localized = (value: number, unit: Intl.RelativeTimeFormatUnit, english: string) =>
    formatRelativeAgo(value, unit) ?? english;

  if (seconds < MINUTE) return localized(0, "second", "just now");
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE);
    return localized(m, "minute", `${m}m ago`);
  }
  if (seconds < DAY) {
    const h = Math.floor(seconds / HOUR);
    return localized(h, "hour", `${h}h ago`);
  }
  if (seconds < WEEK) {
    const d = Math.floor(seconds / DAY);
    return localized(d, "day", `${d}d ago`);
  }
  if (seconds < MONTH) {
    const w = Math.floor(seconds / WEEK);
    return localized(w, "week", `${w}w ago`);
  }
  const mo = Math.floor(seconds / MONTH);
  return localized(mo, "month", `${mo}mo ago`);
}
