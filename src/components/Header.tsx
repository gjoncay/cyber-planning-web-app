"use client";

import { useEffect, useState } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { Sun, Moon, Crosshair, LineChart } from "lucide-react";
import logoImg from "../../Clean_Chinook_Logo.png";

export default function Header() {
  const { viewMode, setViewMode } = useBriefingStore();
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
    <header className="h-14 shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-6 flex items-center justify-between">
      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <img
          src={logoImg.src}
          alt="Chinook Cyber Logo"
          className="h-8 w-auto object-contain"
        />
        <div className="flex flex-col border-l border-[var(--border-default)] pl-3">
          <span className="font-bold text-[15px] tracking-tight leading-none">
            <span className="text-[var(--text-primary)]">Chinook</span>
            <span className="text-[var(--accent-primary)]">Cyber</span>
          </span>
          <span className="data-label text-[10px] text-[var(--text-muted)] mt-0.5">
            OAKOC Planning
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Dual-Lens Segmented Control */}
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--bg-raised)] border border-[var(--border-default)]">
          <button
            onClick={() => setViewMode("tactical")}
            aria-pressed={viewMode === "tactical"}
            title="Tactical — technical indicators (CVEs / IPs)"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
              viewMode === "tactical"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-subtle"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            Tactical
          </button>
          <button
            onClick={() => setViewMode("strategic")}
            aria-pressed={viewMode === "strategic"}
            title="Strategic — risk & financial exposure"
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
              viewMode === "strategic"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-subtle"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            Strategic
          </button>
        </div>

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
