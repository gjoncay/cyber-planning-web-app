"use client";

import { useEffect } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { Undo2, X } from "lucide-react";

const TOAST_MS = 10_000;

/**
 * 10-second "Undo" toast surfaced after destructive actions (clear all /
 * clear tier / delete element / delete chain) — replaces blocking confirms.
 */
export default function UndoToast() {
  const snapshot = useBriefingStore((s) => s.lastSnapshot);
  const undoLast = useBriefingStore((s) => s.undoLast);
  const dismissSnapshot = useBriefingStore((s) => s.dismissSnapshot);

  useEffect(() => {
    if (!snapshot) return;
    const remaining = snapshot.at + TOAST_MS - Date.now();
    if (remaining <= 0) {
      dismissSnapshot();
      return;
    }
    const t = setTimeout(dismissSnapshot, remaining);
    return () => clearTimeout(t);
  }, [snapshot, dismissSnapshot]);

  if (!snapshot) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 pl-4 pr-2 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-overlay)] shadow-card"
    >
      <span className="text-[13px] text-[var(--text-primary)]">{snapshot.label}</span>
      <button
        onClick={undoLast}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-primary)] hover:underline px-1"
      >
        <Undo2 className="h-3.5 w-3.5" />
        Undo
      </button>
      <button
        onClick={dismissSnapshot}
        aria-label="Dismiss"
        className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
