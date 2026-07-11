"use client";

import { useEffect, useRef, useState } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { useScenarioStore } from "@/store/useScenarioStore";
import { Sun, Moon, LayoutGrid, Presentation, Download, BookOpen, Info, FileJson, FolderOpen, Layers } from "lucide-react";
import { exportBriefing } from "@/lib/exportBrief";
import { downloadJson, downloadPlan, importPlan } from "@/lib/plan";
import { buildNavigatorLayer, countTechniques, layerFilename } from "@/lib/navigatorLayer";
import { OakocInfoDialog } from "./OakocInfoDialog";
import BrandMenu from "./BrandMenu";
import ScenarioMenu from "./ScenarioMenu";

export default function Header() {
  const { mode, setMode, elements, chains, importPlanData } = useBriefingStore();
  const scenarioName = useScenarioStore((s) => s.activeName);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [infoOpen, setInfoOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const techniqueCount = countTechniques(elements);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    try {
      const { elements: importedElements, chains: importedChains } = importPlan(await file.text());
      importPlanData(importedElements, importedChains);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import plan.");
    }
  };

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
    // Theme continuity across the Chinook Cyber ecosystem: share the choice
    // with the sibling subdomains via a cookie on the parent domain. Only on
    // production hosts — skip on localhost/dev so we don't spray cookies.
    try {
      if (location.hostname.endsWith("chinookcyber.com")) {
        document.cookie = `cc-theme=${nextTheme}; domain=.chinookcyber.com; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      /* cookie write is best-effort */
    }
  };

  return (
    <header className="h-auto min-h-14 shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 sm:py-0 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
      {/* Brand Header */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
        <BrandMenu />
        <div className="flex items-center gap-2 border-l border-[var(--border-default)] pl-3">
          <span className="data-label text-[10px]">
            OAKOC Planning
          </span>
          <button
            onClick={() => setInfoOpen(true)}
            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Info className="h-2.5 w-2.5" />
            What is OAKOC?
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Scenario manager — named multi-plan save/load */}
        <ScenarioMenu />

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
          onClick={() => exportBriefing(elements, chains)}
          title="Export the briefing as a standalone HTML document"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-[var(--border-default)] hover:bg-[var(--bg-raised)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>

        {/* Plan file round-trip — versioned JSON export / import */}
        <button
          onClick={() => downloadPlan(elements, chains)}
          title="Download the plan (elements + chains) as a JSON file"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-[var(--border-default)] hover:bg-[var(--bg-raised)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <FileJson className="h-3.5 w-3.5" />
          Export Plan
        </button>
        <button
          onClick={() => {
            const layer = buildNavigatorLayer(scenarioName, elements);
            if (layer) downloadJson(layerFilename(scenarioName), JSON.stringify(layer, null, 2));
          }}
          disabled={techniqueCount === 0}
          title={
            techniqueCount === 0
              ? "No ATT&CK techniques in this plan yet — add techniques to elements to export a Navigator layer"
              : `Export an ATT&CK Navigator layer of the ${techniqueCount} technique${techniqueCount === 1 ? "" : "s"} in this plan`
          }
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-[var(--border-default)] enabled:hover:bg-[var(--bg-raised)] rounded-md text-[var(--text-secondary)] enabled:hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Layers className="h-3.5 w-3.5" />
          Navigator layer
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import a previously exported plan JSON file (merges into the current plan)"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-[var(--border-default)] hover:bg-[var(--bg-raised)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Import Plan
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={handleImportFile}
        />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          className="p-1.5 border border-[var(--border-default)] hover:bg-[var(--bg-raised)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-subtle"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>
      {importError && (
        <div
          role="alert"
          className="w-full sm:w-auto text-[11px] font-semibold px-2 py-1 rounded-md"
          style={{ color: "var(--accent-negative)", background: "var(--accent-negative-glow)" }}
        >
          Import failed: {importError}
        </div>
      )}
      <OakocInfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />
    </header>
  );
}
