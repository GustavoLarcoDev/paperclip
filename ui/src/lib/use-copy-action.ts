import { useCallback, useEffect, useRef, useState } from "react";

import { copyTextToClipboard } from "./clipboard";
import { useOptionalToastActions } from "../context/ToastContext";

export type CopyStatus = "idle" | "copied" | "failed";

/** How long a "Copied" state stays up before the control returns to rest. */
const RESET_MS = 1500;

/**
 * Inline copy feedback for a control that stays on screen after the click.
 *
 * Success is earned, never assumed. The status only turns `copied` once the
 * clipboard write resolves, so a blocked or insecure clipboard reads as a
 * failure rather than a confirmation of something that never happened — the
 * line `AdapterLoginChrome.test.tsx` already holds for its own copy button.
 */
export function useCopyAction(resetMs: number = RESET_MS) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string) => {
      let next: CopyStatus = "copied";
      try {
        await copyTextToClipboard(text);
      } catch {
        next = "failed";
      }
      setStatus(next);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setStatus("idle");
        timerRef.current = null;
      }, resetMs);
      return next;
    },
    [resetMs],
  );

  return {
    status,
    copied: status === "copied",
    failed: status === "failed",
    copy,
  };
}

/**
 * Copy feedback for a control that disappears on click — a menu item, mostly.
 *
 * An inline "Copied" swap would unmount with the menu before anyone read it,
 * so the confirmation goes to the toast viewport instead. Same rule as above:
 * the success toast waits for the write to resolve.
 */
export function useCopyToast() {
  const toastActions = useOptionalToastActions();
  const pushToast = toastActions?.pushToast;

  return useCallback(
    async (text: string, copiedTitle = "Copied") => {
      try {
        await copyTextToClipboard(text);
        pushToast?.({
          title: copiedTitle,
          tone: "success",
          dedupeKey: `copy:${copiedTitle}`,
        });
        return true;
      } catch {
        pushToast?.({
          title: "Couldn’t copy to clipboard",
          body: "Select and copy the value manually.",
          tone: "error",
          dedupeKey: "copy-failed",
        });
        return false;
      }
    },
    [pushToast],
  );
}
