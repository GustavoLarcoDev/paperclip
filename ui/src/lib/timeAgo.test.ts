// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "@/i18n";
import { timeAgo } from "./timeAgo";
import { relativeTime } from "./utils";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

describe("relative time in the interface language", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("keeps the compact English form", () => {
    expect(timeAgo(minutesAgo(5))).toBe("5m ago");
    expect(relativeTime(minutesAgo(120))).toBe("2h ago");
    expect(timeAgo(new Date())).toBe("just now");
  });

  it("uses the interface language for other locales", async () => {
    await i18n.changeLanguage("es");
    expect(timeAgo(minutesAgo(5))).toMatch(/^hace 5/);
    expect(relativeTime(minutesAgo(120))).toMatch(/^hace 2/);
    expect(timeAgo(new Date())).toBe("ahora");
  });
});
