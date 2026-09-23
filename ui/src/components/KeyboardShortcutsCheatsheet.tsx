import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/i18n";

const ESC_KEY_SLOT = "\u0001escKey\u0001";

interface ShortcutEntry {
  keys: string[];
  /** Key under `nav.shortcuts.labels`. */
  label: string;
  /** Render keys as a simultaneous chord (joined with "+") rather than a
   *  "then" sequence. */
  combo?: boolean;
}

interface ShortcutSection {
  /** Key under `nav.shortcuts.sections`. */
  title: string;
  shortcuts: ShortcutEntry[];
}

const sections: ShortcutSection[] = [
  {
    title: "inbox",
    shortcuts: [
      { keys: ["j"], label: "moveDown" },
      { keys: ["↓"], label: "moveDown" },
      { keys: ["k"], label: "moveUp" },
      { keys: ["↑"], label: "moveUp" },
      { keys: ["←"], label: "collapseGroup" },
      { keys: ["→"], label: "expandGroup" },
      { keys: ["Enter"], label: "openItem" },
      { keys: ["a"], label: "archiveItem" },
      { keys: ["y"], label: "archiveItem" },
      { keys: ["r"], label: "markRead" },
      { keys: ["U"], label: "markUnread" },
    ],
  },
  {
    title: "taskDetail",
    shortcuts: [
      { keys: ["y"], label: "quickArchive" },
      { keys: ["g", "i"], label: "goToInbox" },
      { keys: ["g", "c"], label: "focusComposer" },
    ],
  },
  {
    title: "decisions",
    shortcuts: [
      { keys: ["j"], label: "moveDown" },
      { keys: ["↓"], label: "moveDown" },
      { keys: ["k"], label: "moveUp" },
      { keys: ["↑"], label: "moveUp" },
      { keys: ["Enter"], label: "toggleDecision" },
      { keys: ["x"], label: "dismissDecision" },
    ],
  },
  {
    title: "global",
    shortcuts: [
      { keys: ["/"], label: "searchPage" },
      { keys: ["c"], label: "newTask" },
      { keys: ["["], label: "toggleSidebar" },
      { keys: ["]"], label: "togglePanel" },
      { keys: ["?"], label: "showShortcuts" },
    ],
  },
];

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-(--shadow-extract-10)">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsCheatsheetContent() {
  const { t } = useTranslation();
  const [footerBefore, footerAfter = ""] = t("nav.shortcuts.footer", { escKey: ESC_KEY_SLOT }).split(ESC_KEY_SLOT);
  return (
    <>
      <div className="divide-y divide-border border-t border-border">
        {sections.map((section) => (
          <div key={section.title} className="px-5 py-3">
            <h3 className="mb-2 text-(length:--text-micro) font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`nav.shortcuts.sections.${section.title}`)}
            </h3>
            <div className="space-y-1.5">
              {section.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.label + shortcut.keys.join()}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-foreground/90">{t(`nav.shortcuts.labels.${shortcut.label}`)}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={key} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {shortcut.combo ? "+" : t("nav.shortcuts.then")}
                          </span>
                        )}
                        <KeyCap>{key}</KeyCap>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {footerBefore}<KeyCap>Esc</KeyCap>{footerAfter}
        </p>
      </div>
    </>
  );
}

export function KeyboardShortcutsCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">{t("nav.shortcuts.title")}</DialogTitle>
        </DialogHeader>
        <KeyboardShortcutsCheatsheetContent />
      </DialogContent>
    </Dialog>
  );
}
