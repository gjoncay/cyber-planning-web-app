"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Copy, FilePlus2, Files, Pencil, Save, Trash2 } from "lucide-react";
import { useScenarioStore } from "@/store/useScenarioStore";
import { useBriefingStore } from "@/store/useBriefingStore";
import { relativeTime, UNTITLED_NAME } from "@/lib/scenarios";
import { useMenu } from "@/lib/useMenu";

/**
 * Header scenario menu — named multi-plan management. Shows the active
 * scenario name; the dropdown offers New / Save as… plus a list of saved
 * scenarios with Load / Rename / Duplicate / Delete. Switching auto-saves the
 * outgoing plan into the registry, so no action here can lose data.
 */
export default function ScenarioMenu() {
  const { scenarios, activeId, activeName, newPlan, saveAs, loadScenario, rename, duplicate, remove } =
    useScenarioStore();
  const elements = useBriefingStore((s) => s.elements);
  const chains = useBriefingStore((s) => s.chains);
  const { open, close, toggle, containerRef, triggerRef } = useMenu();

  const [savingAs, setSavingAs] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset transient sub-states whenever the menu closes.
  useEffect(() => {
    if (!open) {
      setSavingAs(false);
      setRenamingId(null);
      setConfirmDeleteId(null);
    }
  }, [open]);

  useEffect(() => {
    if (savingAs || renamingId) inputRef.current?.focus();
  }, [savingAs, renamingId]);

  const sorted = [...scenarios].sort((a, b) => b.updated - a.updated);
  const isSaved = activeId !== null && scenarios.some((s) => s.id === activeId);

  const commitName = () => {
    const name = draftName.trim();
    if (savingAs) {
      if (name) saveAs(name);
      setSavingAs(false);
    } else if (renamingId) {
      if (name) rename(renamingId, name);
      setRenamingId(null);
    }
  };

  const nameEditor = (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <input
        ref={inputRef}
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitName();
          if (e.key === "Escape") {
            e.stopPropagation();
            setSavingAs(false);
            setRenamingId(null);
          }
        }}
        placeholder="Plan name"
        aria-label={savingAs ? "New scenario name" : "Rename scenario"}
        className="flex-1 min-w-0 px-2 py-1 text-[12px] rounded border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
      />
      <button
        onClick={commitName}
        disabled={!draftName.trim()}
        className="px-2 py-1 text-[11px] font-semibold rounded bg-[var(--accent-primary)] text-white disabled:opacity-40"
      >
        {savingAs ? "Save" : "Rename"}
      </button>
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        title="Scenarios — save, load and manage named plans"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-[var(--border-default)] hover:bg-[var(--bg-raised)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors max-w-[180px]"
      >
        <Files className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{activeName}</span>
        {!isSaved && (elements.length > 0 || chains.length > 0) && (
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0 bg-[var(--accent-primary)]"
            title="Not yet saved as a scenario"
          />
        )}
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Scenario manager"
          className="absolute right-0 sm:right-auto sm:left-0 top-full mt-1.5 w-80 z-[70] rounded-lg border border-[var(--border-default)] bg-[var(--bg-overlay)] shadow-card overflow-hidden"
        >
          {/* Current plan */}
          <div className="px-3 py-2 border-b border-[var(--border-default)]">
            <span className="data-label text-[9px]">Current plan</span>
            <div className="flex items-baseline justify-between gap-2 mt-0.5">
              <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{activeName}</span>
              <span className="text-[10px] text-[var(--text-muted)] tabular-nums shrink-0">
                {elements.length} el · {chains.length} chain{chains.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Actions */}
          {savingAs ? (
            nameEditor
          ) : (
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--border-default)]">
              <button
                onClick={() => {
                  newPlan();
                  close();
                }}
                title="Save the current plan under its name, then start an empty plan"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold rounded hover:bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                New plan
              </button>
              <button
                onClick={() => {
                  setDraftName(activeName === UNTITLED_NAME ? "" : activeName);
                  setRenamingId(null);
                  setSavingAs(true);
                }}
                title="Save the current plan as a new named scenario"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold rounded hover:bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                Save as…
              </button>
            </div>
          )}

          {/* Saved scenarios */}
          <div className="max-h-72 overflow-y-auto">
            {sorted.length === 0 ? (
              <p className="px-3 py-3 text-[11px] text-[var(--text-muted)]">
                No saved scenarios yet. &ldquo;Save as…&rdquo; keeps a named snapshot you can switch back to.
              </p>
            ) : (
              <ul>
                {sorted.map((sc) => {
                  const isActive = sc.id === activeId;
                  if (renamingId === sc.id) {
                    return <li key={sc.id}>{nameEditor}</li>;
                  }
                  return (
                    <li
                      key={sc.id}
                      className="group flex items-center gap-1 px-2 py-1 hover:bg-[var(--bg-raised)] transition-colors"
                    >
                      <button
                        onClick={() => {
                          loadScenario(sc.id);
                          close();
                        }}
                        title={isActive ? "Currently loaded" : `Load "${sc.name}" (current plan is auto-saved first)`}
                        className="flex-1 min-w-0 text-left px-1 py-1"
                      >
                        <span className="flex items-center gap-1.5">
                          {isActive && <Check className="h-3 w-3 shrink-0 text-[var(--accent-primary)]" />}
                          <span
                            className={`text-[12px] truncate ${
                              isActive
                                ? "font-semibold text-[var(--accent-primary)]"
                                : "font-medium text-[var(--text-primary)]"
                            }`}
                          >
                            {sc.name}
                          </span>
                        </span>
                        <span className="block text-[10px] text-[var(--text-muted)] tabular-nums">
                          {relativeTime(sc.updated)} · {sc.data.elements.length} el · {sc.data.chains.length} chain
                          {sc.data.chains.length === 1 ? "" : "s"}
                        </span>
                      </button>
                      {confirmDeleteId === sc.id ? (
                        <button
                          onClick={() => {
                            remove(sc.id);
                            setConfirmDeleteId(null);
                          }}
                          className="shrink-0 px-1.5 py-1 text-[10px] font-bold rounded"
                          style={{ color: "var(--accent-negative)", background: "var(--accent-negative-glow)" }}
                        >
                          Delete?
                        </button>
                      ) : (
                        <span className="shrink-0 flex items-center opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setDraftName(sc.name);
                              setRenamingId(sc.id);
                              setSavingAs(false);
                            }}
                            aria-label={`Rename "${sc.name}"`}
                            title="Rename"
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => duplicate(sc.id)}
                            aria-label={`Duplicate "${sc.name}"`}
                            title="Duplicate"
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(sc.id)}
                            aria-label={`Delete "${sc.name}"`}
                            title="Delete"
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-negative)]"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
