// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { i18n, LOCALE_STORAGE_KEY, matchSupportedLocale, readStoredLocale, setLocalePreference } from ".";
import { localeCoverage } from "./locales";

const available = ["en", "es", "pt-BR", "pt-PT", "zh-CN"];

describe("matchSupportedLocale", () => {
  it("prefers an exact tag, then the base language, then a regional variant", () => {
    expect(matchSupportedLocale(["pt-PT"], available)).toBe("pt-PT");
    expect(matchSupportedLocale(["es-EC"], available)).toBe("es");
    expect(matchSupportedLocale(["pt"], available)).toBe("pt-BR");
    expect(matchSupportedLocale(["ZH-cn"], available)).toBe("zh-CN");
  });

  it("walks the list in order and returns null when nothing matches", () => {
    expect(matchSupportedLocale(["xx", "es-MX", "en"], available)).toBe("es");
    expect(matchSupportedLocale(["xx", "yy"], available)).toBeNull();
  });
});

describe("locale preference", () => {
  afterEach(() => setLocalePreference(null));

  it("stores an explicit choice and switches the interface language", () => {
    setLocalePreference("es");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es");
    expect(readStoredLocale()).toBe("es");
    expect(i18n.language).toBe("es");
    expect(document.documentElement.lang).toBe("es");
  });

  it("clears the choice to follow the browser again", () => {
    setLocalePreference("es");
    setLocalePreference(null);
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    expect(i18n.language).toBe("en");
  });

  it("ignores a stored locale that is not supported", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "xx");
    expect(readStoredLocale()).toBeNull();
  });
});

describe("localeCoverage", () => {
  it("is complete for English and partial for a locale with missing keys", () => {
    expect(localeCoverage("en")).toBe(1);
    expect(localeCoverage("es")).toBeGreaterThan(0);
    expect(localeCoverage("es")).toBeLessThanOrEqual(1);
  });
});
