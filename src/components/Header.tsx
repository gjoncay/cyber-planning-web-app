"use client";

import { useEffect, useState } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { Sun, Moon, LayoutGrid, Presentation, Download, BookOpen } from "lucide-react";
import { exportBriefing } from "@/lib/exportBrief";
import logoImg from "../../chinook-logo.png";

export default function Header() {
  const { mode, setMode, elements } = useBriefingStore();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const activeTheme = (document.documentElement.getAttribute("data-theme") as "dark") || "light";
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("chinook-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("chinook-theme", "light");
    }
  };

  return (
    <header className="h-auto min-h-14 shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 sm:py-0 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
      {/* Brand Header */}
      <a href="https://chinookcyber.com" className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start" title="Back to Homepage">
        <img
          src={logoImg.src}
          alt="Chinook Cyber Logo"
          className="h-8 w-auto object-contain"
        />
        <div className="flex flex-col border-l border-[var(--border-default)] pl-3">
          <span className="font-bold text-[15px] tracking-tight leading-none">
            <span className="text-[var(--text-primary)]">Chinook</span>{" "}
            <span className="text-[var(--accent-primary)]">Cyber</span>
          </span>
          <span
            className="data-label text-[10px] mt-1"
            style={{ color: "var(--accent-secondary)" }}
          >
            OAKOC Planning
          </span>
        </div>
      </a>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Mode Toggle */}
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--bg-raised)] border border-[var(--border-default)]">
          <button
            onClick={() => setMode("guide")}
            aria-pressed={mode === "guide"}
            title="Guide — Learn how to use this tool"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
              mode === "guide"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-subtle"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Guide
          </button>
          <button
            onClick={() => setMode("plan")}
            aria-pressed={mode === "plan"}
            title="Plan — build and edit the OAKOC model"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
              mode === "plan"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-subtle"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Plan
          </button>
          <button
            onClick={() => setMode("brief")}
            aria-pressed={mode === "brief"}
            title="Brief — present the model to leadership"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
              mode === "brief"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-subtle"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <Presentation className="h-3.5 w-3.5" />
            Brief
          </button>
        </div>

        {/* Export — standalone HTML briefing document */}
        <button
          onClick={() => exportBriefing(elements)}
          title="Export the briefing as a standalone HTML document"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-[var(--border-default)] hover:bg-[var(--bg-raised)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 border border-[var(--border-default)] hover:bg-[var(--bg-raised)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-subtle"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
