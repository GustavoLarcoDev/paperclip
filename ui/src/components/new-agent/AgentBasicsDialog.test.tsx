// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentBasicsDialog } from "./AgentBasicsDialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const adapterTypes = ["claude_local", "codex_local", "gemini_local", "cursor", "opencode_local"];

vi.mock("@/api/adapters", () => ({
  adaptersApi: {
    list: vi.fn(async () =>
      adapterTypes.map((type) => ({ type, loaded: true, disabled: false })),
    ),
  },
}));
vi.mock("@/api/instanceSettings", () => ({
  instanceSettingsApi: { getExperimental: vi.fn(async () => ({})) },
}));
vi.mock("@/hooks/useCloudInstance", () => ({ useCloudInstance: () => null }));
vi.mock("../onboarding/PillGuy", () => ({ PillGuy: () => null }));

let root: Root;
let container: HTMLDivElement;

async function flush() {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function renderAdapterStep(initialAdapter = "") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  root = createRoot(container);
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <AgentBasicsDialog
          open
          onClose={() => {}}
          onContinue={() => {}}
          initialAdapter={initialAdapter}
        />
      </QueryClientProvider>,
    );
  });
  const input = document.body.querySelector<HTMLInputElement>("input[maxlength='100']")!;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, "Darnold");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const next = [...document.body.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("Choose adapter"),
  )!;
  await act(async () => {
    next.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await flush();
}

const visibleAdapters = () =>
  [...document.body.querySelectorAll<HTMLInputElement>('input[name="new-agent-adapter"]')].map(
    (input) => input.value,
  );
const toggle = () =>
  [...document.body.querySelectorAll("button")].find((b) =>
    /Show all adapters|Show recommended only/.test(b.textContent ?? ""),
  );

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  document.body.innerHTML = "";
});

describe("AgentBasicsDialog adapter step", () => {
  it("leads with recommended adapters and keeps the rest one click away", async () => {
    await renderAdapterStep();

    expect(visibleAdapters()).toEqual(["claude_local", "codex_local"]);
    expect(document.body.textContent).toContain("Claude Code CLI harness");
    expect(toggle()?.textContent).toBe("Show all adapters (3 more)");

    await act(async () => {
      toggle()!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(visibleAdapters()).toEqual([
      "claude_local",
      "codex_local",
      "gemini_local",
      "cursor",
      "opencode_local",
    ]);
    expect(toggle()?.textContent).toBe("Show recommended only");
  });

  it("never hides a preselected non-recommended adapter", async () => {
    await renderAdapterStep("gemini_local");

    expect(visibleAdapters()).toContain("gemini_local");
    expect(
      document.body.querySelector<HTMLInputElement>('input[value="gemini_local"]')?.checked,
    ).toBe(true);
    expect(toggle()).toBeUndefined();
  });
});
