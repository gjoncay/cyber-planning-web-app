"use client";

import { ReactNode, useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalShellProps {
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  children: ReactNode;
  /** "center" = card dialog; "drawer" = right-hand slide-over. */
  variant?: "center" | "drawer";
  /** Extra classes for the dialog panel (size constraints etc.). */
  panelClassName?: string;
  /** Stacking context for nested overlays. */
  zIndexClassName?: string;
}

/**
 * Shared accessible modal wrapper: role="dialog" + aria-modal, Escape to
 * close, focus moved in on open, simple Tab-cycle focus trap, and focus
 * restored to the opener on close.
 */
export default function ModalShell({
  onClose,
  label,
  children,
  variant = "center",
  panelClassName = "",
  zIndexClassName = "z-[60]",
}: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Move focus into the dialog (first focusable, else the panel itself).
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    return () => {
      restoreRef.current?.focus?.();
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    // Simple Tab-cycle trap within the panel.
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (focusables.length === 0) return;
    const firstEl = focusables[0];
    const lastEl = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === firstEl || active === panel)) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && active === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  };

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex ${
        variant === "drawer" ? "justify-end" : "items-center justify-center p-4"
      } bg-[var(--bg-scrim)] backdrop-blur-[2px]`}
      onKeyDown={handleKeyDown}
    >
      <button
        className={variant === "drawer" ? "flex-1 cursor-default" : "absolute inset-0 cursor-default"}
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`relative outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
