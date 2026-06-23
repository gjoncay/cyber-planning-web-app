"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { searchCves } from "@/lib/api";
import { TIER_LABELS, TIER_META, TIER_ORDER } from "@/lib/oakoc";
import { PlanElement, ThreatTier, CveSuggestion } from "@/types";
import { X, Save, Plus, Trash2, Search, RefreshCw, AlertTriangle } from "lucide-react";

const DANGER = "#ef4444";

const dangerStyle = {
  color: DANGER,
  backgroundColor: `${DANGER}1a`,
  borderColor: `${DANGER}40`,
};

const INPUT_CLASS =
  "w-full px-3 py-2 text-[13px] border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-md text-[var(--text-primary)] transition-colors focus:outline-none";
const INPUT_MONO_CLASS = `${INPUT_CLASS} mono`;

const CVE_RE = /^CVE-\d{4}-\d{4,}$/i;

const sanitizeId = (raw: string) => raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");

interface NodeFormProps {
  onClose?: () => void;
  /** Pre-selected OAKOC layer when adding from a specific layer's "+ Add". */
  defaultTier?: ThreatTier;
}

export default function NodeForm({ onClose, defaultTier }: NodeFormProps) {
  const {
    elements,
    selectedId,
    setSelectedId,
    addElement,
    updateElement,
    deleteElement,
    enrichElement,
  } = useBriefingStore();

  const isEditMode = selectedId !== null;
  const selectedElement = isEditMode ? elements.find((el) => el.id === selectedId) : null;

  // Local form state
  const [elementId, setElementId] = useState("");
  const [name, setName] = useState("");
  const [tier, setTier] = useState<ThreatTier>(TIER_ORDER[0]);
  const [cves, setCves] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // CVE typeahead state
  const [cveInput, setCveInput] = useState("");
  const [suggestions, setSuggestions] = useState<CveSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cveHint, setCveHint] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef("");

  const [isPending, startTransition] = useTransition();

  // Sync local form state from the selected element
  useEffect(() => {
    if (selectedElement) {
      setElementId(selectedElement.id);
      setName(selectedElement.name);
      setTier(selectedElement.tier);
      setCves([...selectedElement.cves]);
      setDescription(selectedElement.description ?? "");
    } else {
      setElementId("");
      setName("");
      setTier(defaultTier ?? TIER_ORDER[0]);
      setCves([]);
      setDescription("");
    }
    setError(null);
    setCveInput("");
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    setCveHint(null);
  }, [selectedId, selectedElement]);

  // Debounced CVE search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = cveInput.trim();
    queryRef.current = q;

    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchCves(q);
      // Ignore stale responses if the query changed mid-flight.
      if (queryRef.current !== q) return;
      setSuggestions(results.slice(0, 8));
      setLoading(false);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cveInput]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const addCve = (raw: string) => {
    const normalized = raw.trim().toUpperCase();
    setCves((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
  };

  const handleSelectSuggestion = (s: CveSuggestion) => {
    addCve(s.cveID);
    setCveInput("");
    setSuggestions([]);
    setOpen(false);
    setCveHint(null);
  };

  const handleManualAdd = () => {
    const raw = cveInput.trim();
    if (!raw) return;
    if (!CVE_RE.test(raw)) {
      setCveHint("Enter a valid CVE id, e.g. CVE-2023-3519.");
      return;
    }
    addCve(raw);
    setCveInput("");
    setSuggestions([]);
    setOpen(false);
    setCveHint(null);
  };

  const handleCveKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleManualAdd();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleCveBlur = () => {
    // Small delay so a suggestion click registers before the dropdown closes.
    blurTimeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const removeCve = (c: string) => {
    setCves((prev) => prev.filter((item) => item !== c));
  };

  const handleClose = () => {
    setSelectedId(null);
    if (onClose) onClose();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = sanitizeId(elementId);
    const cleanName = name.trim();

    if (!cleanId) {
      setError("Element ID is required.");
      return;
    }
    if (!cleanName) {
      setError("Display Name is required.");
      return;
    }
    if (!isEditMode && elements.some((el) => el.id === cleanId)) {
      setError("An element with this ID already exists. ID must be unique.");
      return;
    }

    const targetId = isEditMode ? selectedId! : cleanId;

    if (isEditMode) {
      updateElement(targetId, {
        name: cleanName,
        tier,
        cves,
        description: description.trim(),
        // Preserve previously fetched metrics on edit.
        metrics: selectedElement?.metrics,
      });
    } else {
      const newElement: PlanElement = {
        id: cleanId,
        name: cleanName,
        tier,
        cves,
        description: description.trim(),
      };
      addElement(newElement);
    }

    if (cves.length > 0) {
      startTransition(async () => {
        await enrichElement(targetId);
      });
    }

    handleClose();
  };

  const handleDelete = () => {
    if (selectedId) {
      deleteElement(selectedId);
      if (onClose) onClose();
    }
  };

  const tierMeta = TIER_META[tier];

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-card w-full md:max-w-md text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-default)] shrink-0">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            {isEditMode ? (
              <>Edit: {selectedElement?.name}</>
            ) : (
              <>
                <Plus className="h-4 w-4 text-[var(--accent-primary)]" />
                Add element
              </>
            )}
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] font-medium mt-1">
            {isEditMode
              ? "Modify this OAKOC terrain element"
              : "Place a new OAKOC terrain element"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="p-1.5 hover:bg-[var(--bg-raised)] rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="flex gap-2 p-3 border rounded-md text-xs" style={dangerStyle}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Element ID */}
        <div>
          <label htmlFor="elementId" className="block data-label mb-2">
            Element ID (Unique Key)
          </label>
          <input
            type="text"
            id="elementId"
            disabled={isEditMode}
            value={elementId}
            onChange={(e) => setElementId(e.target.value)}
            placeholder="e.g. ad-domain-controller"
            className={`${INPUT_MONO_CLASS} disabled:opacity-60`}
            required
          />
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="name" className="block data-label mb-2">
            Display Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Active Directory Domain Controller"
            className={INPUT_CLASS}
            required
          />
        </div>

        {/* OAKOC Layer */}
        <div>
          <label htmlFor="tier" className="block data-label mb-2">
            OAKOC Layer
          </label>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-[var(--border-default)]"
              style={{ background: tierMeta.color }}
            />
            <select
              id="tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as ThreatTier)}
              className={INPUT_CLASS}
            >
              {TIER_ORDER.map((t) => (
                <option key={t} value={t}>
                  {TIER_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
            {tierMeta.definition}
          </p>
        </div>

        {/* CVEs — fluid typeahead */}
        <div>
          <label htmlFor="cveInput" className="block data-label mb-2">
            CVEs
          </label>

          {/* Selected chips */}
          {cves.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {cves.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-1.5 px-2 py-1 mono text-[11px] bg-[var(--bg-raised)] border border-[var(--border-default)] rounded text-[var(--text-primary)]"
                >
                  <span>{c}</span>
                  <button
                    type="button"
                    onClick={() => removeCve(c)}
                    aria-label={`Remove ${c}`}
                    className="text-[var(--text-muted)] transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.color = DANGER)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="text"
                  id="cveInput"
                  value={cveInput}
                  onChange={(e) => {
                    setCveInput(e.target.value);
                    setCveHint(null);
                  }}
                  onKeyDown={handleCveKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setOpen(true);
                  }}
                  onBlur={handleCveBlur}
                  placeholder="Search KEV catalog or type CVE-…"
                  autoComplete="off"
                  className={`${INPUT_MONO_CLASS} pl-8`}
                />
              </div>
              <button
                type="button"
                onClick={handleManualAdd}
                disabled={!cveInput.trim()}
                className="flex items-center gap-1 px-3 py-2 bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:opacity-90 disabled:opacity-50 rounded-md text-[11px] font-semibold transition-opacity shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Suggestions dropdown */}
            {open && cveInput.trim().length >= 2 && (
              <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-md shadow-card">
                {loading ? (
                  <div className="px-3 py-2.5 text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Searching…
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">
                    No matches
                  </div>
                ) : (
                  suggestions.map((s) => (
                    <button
                      key={s.cveID}
                      type="button"
                      // onMouseDown fires before input blur, so the click registers.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(s);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--bg-raised)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="mono text-[12px] text-[var(--text-primary)] shrink-0">
                          {s.cveID}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] truncate">
                          {s.vulnerabilityName}
                        </span>
                      </div>
                      {s.vendorProject && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {s.vendorProject}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {cveHint && (
            <p className="text-[11px] mt-1.5" style={{ color: DANGER }}>
              {cveHint}
            </p>
          )}
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
            Suggestions come from the CISA KEV catalog of known-exploited vulnerabilities.
          </p>
        </div>

        {/* Notes / description */}
        <div>
          <label htmlFor="description" className="block data-label mb-2">
            Analyst notes
          </label>
          <textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write analyst findings regarding this terrain element…"
            className={`${INPUT_CLASS} resize-none leading-relaxed`}
          />
        </div>
      </form>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-raised)] flex items-center justify-between gap-3 shrink-0">
        {isEditMode ? (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 border rounded-md text-xs font-semibold transition-opacity hover:opacity-90"
            style={dangerStyle}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] text-[var(--text-secondary)] rounded-md text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:opacity-90 disabled:opacity-55 rounded-md text-xs font-semibold transition-opacity"
          >
            {isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isEditMode ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
