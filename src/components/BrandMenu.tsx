"use client";

import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useMenu } from "@/lib/useMenu";
import logoImg from "../../chinook-logo.png";

const LINKS = [
  { label: "Home", host: "chinookcyber.com", href: "https://chinookcyber.com" },
  { label: "Threat Browser", host: "browser.chinookcyber.com", href: "https://browser.chinookcyber.com" },
];

/**
 * Header brand area — the Chinook Cyber ecosystem menu. Same-tab links to the
 * sibling apps; keyboard accessible (Escape/outside-click close via useMenu,
 * ArrowUp/ArrowDown between items).
 */
export default function BrandMenu() {
  const { open, close, toggle, containerRef, triggerRef } = useMenu();
  const listRef = useRef<HTMLDivElement>(null);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(listRef.current?.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']") ?? []);
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLAnchorElement);
    const next =
      e.key === "ArrowDown" ? items[(idx + 1) % items.length] : items[(idx - 1 + items.length) % items.length];
    next.focus();
  };

  return (
    <div ref={containerRef} className="relative shrink-0" onKeyDown={handleMenuKeyDown}>
      <button
        ref={triggerRef}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Chinook Cyber ecosystem"
        className="flex items-center gap-2 rounded-md px-1 py-0.5 -mx-1 hover:bg-[var(--bg-raised)] transition-colors"
      >
        <img src={logoImg.src} alt="Chinook Cyber Logo" className="h-8 w-auto object-contain" />
        <span className="font-bold text-[15px] tracking-tight leading-none whitespace-nowrap">
          <span className="text-[var(--text-primary)]">Chinook</span>{" "}
          <span className="text-[var(--accent-primary)]">Cyber</span>
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          role="menu"
          aria-label="Chinook Cyber apps"
          className="absolute left-0 top-full mt-1.5 w-60 z-[70] rounded-lg border border-[var(--border-default)] bg-[var(--bg-overlay)] shadow-card overflow-hidden py-1"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              role="menuitem"
              href={link.href}
              onClick={close}
              className="flex flex-col gap-0.5 px-3 py-2 hover:bg-[var(--bg-raised)] transition-colors"
            >
              <span className="text-[12px] font-semibold text-[var(--text-primary)]">{link.label}</span>
              <span className="data-label text-[9px]">{link.host}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
