"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { searchCves, searchTechniques, searchDetections, searchMitigations, searchDataComponents, searchAnalytics, searchSoftware } from "@/lib/api";
import { searchTargets } from "@/lib/targets";
import { AttackTechnique, tierForSoftware } from "@/lib/attack";
import { TIER_LABELS, TIER_META, TIER_ORDER } from "@/lib/oakoc";
import { PlanElement, ThreatTier, CveSuggestion, TechniqueRef } from "@/types";
import { X, Save, Plus, Trash2, Search, RefreshCw, AlertTriangle, Crosshair } from "lucide-react";

const TECH_RE = /T\d{4}(?:\.\d{3})?/i;

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
  const [techniques, setTechniques] = useState<TechniqueRef[]>([]);
  const [techInput, setTechInput] = useState("");
  const [techHint, setTechHint] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [detections, setDetections] = useState<{ id: string; name?: string }[]>([]);
  const [mitigations, setMitigations] = useState<{ id: string; name?: string }[]>([]);
  const [datacomponents, setDatacomponents] = useState<{ id: string; name?: string }[]>([]);
  const [analytics, setAnalytics] = useState<{ id: string; name?: string }[]>([]);
  const [software, setSoftware] = useState<{ id: string; name?: string }[]>([]);

  // Template state
  const [templateType, setTemplateType] = useState<"none"|"detection"|"mitigation"|"datacomponent"|"analytic"|"software"|"target">("none");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateSuggestions, setTemplateSuggestions] = useState<any[]>([]);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const templateQueryRef = useRef("");
  const templateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const templateBlurRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CVE typeahead state
  const [cveInput, setCveInput] = useState("");
  const [suggestions, setSuggestions] = useState<CveSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cveHint, setCveHint] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef("");

  // ATT&CK technique typeahead state
  const [techSuggestions, setTechSuggestions] = useState<AttackTechnique[]>([]);
  const [techOpen, setTechOpen] = useState(false);
  const [techLoading, setTechLoading] = useState(false);

  const techDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const techBlurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const techQueryRef = useRef("");

  const [isPending, startTransition] = useTransition();

  // Sync local form state from the selected element
  useEffect(() => {
    if (selectedElement) {
      setElementId(selectedElement.id);
      setName(selectedElement.name);
      setTier(selectedElement.tier);
      setCves([...selectedElement.cves]);
      setTechniques([...(selectedElement.techniques ?? [])]);
      setDescription(selectedElement.description ?? "");
    } else {
      setElementId("");
      setName("");
      setTier(defaultTier ?? TIER_ORDER[0]);
      setCves([]);
      setTechniques([]);
      setDetections([]);
      setMitigations([]);
      setDatacomponents([]);
      setAnalytics([]);
      setSoftware([]);
      setDescription("");
    }
    setTechInput("");
    setTechHint(null);
    setTechSuggestions([]);
    setTechOpen(false);
    setTechLoading(false);
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

  // Debounced ATT&CK technique search
  useEffect(() => {
    if (techDebounceRef.current) clearTimeout(techDebounceRef.current);

    const q = techInput.trim();
    techQueryRef.current = q;

    if (q.length < 2) {
      setTechSuggestions([]);
      setTechLoading(false);
      setTechOpen(false);
      return;
    }

    setTechLoading(true);
    setTechOpen(true);
    techDebounceRef.current = setTimeout(async () => {
      const results = await searchTechniques(q);
      // Ignore stale responses if the query changed mid-flight.
      if (techQueryRef.current !== q) return;
      setTechSuggestions(results.slice(0, 8));
      setTechLoading(false);
    }, 200);

    return () => {
      if (techDebounceRef.current) clearTimeout(techDebounceRef.current);
    };
  }, [techInput]);

  useEffect(() => {
    if (templateDebounceRef.current) clearTimeout(templateDebounceRef.current);
    
    const q = templateSearch.trim();
    templateQueryRef.current = q;
    
    if (templateType === "none") {
      setTemplateSuggestions([]);
      setTemplateLoading(false);
      setTemplateOpen(false);
      return;
    }

    setTemplateLoading(true);
    // If there is a search term, auto-open. If not, only open if it was already open.
    if (q.length > 0) {
      setTemplateOpen(true);
    }
    templateDebounceRef.current = setTimeout(async () => {
      let results: any[] = [];
      if (templateType === "detection") results = await searchDetections(q);
      else if (templateType === "mitigation") results = await searchMitigations(q);
      else if (templateType === "datacomponent") results = await searchDataComponents(q);
      else if (templateType === "analytic") results = await searchAnalytics(q);
      else if (templateType === "software") results = await searchSoftware(q);
      else if (templateType === "target") results = await searchTargets(q);
      
      if (templateQueryRef.current !== q) return;
      setTemplateSuggestions(results.slice(0, 100));
      setTemplateLoading(false);
    }, 200);

    return () => {
      if (templateDebounceRef.current) clearTimeout(templateDebounceRef.current);
    };
  }, [templateSearch, templateType]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      if (techBlurRef.current) clearTimeout(techBlurRef.current);
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

  const addTechniqueRef = (id: string, name?: string) => {
    setTechniques((prev) => (prev.some((t) => t.id === id) ? prev : [...prev, { id, name }]));
  };

  const addTechnique = () => {
    const raw = techInput.trim();
    if (!raw) return;
    const m = raw.match(TECH_RE);
    if (!m) {
      setTechHint("Enter an ATT&CK technique id, e.g. T1021.002.");
      return;
    }
    const id = m[0].toUpperCase();
    const name = raw.replace(m[0], "").replace(/^[\s—–:.-]+/, "").trim() || undefined;
    addTechniqueRef(id, name);
    setTechInput("");
    setTechSuggestions([]);
    setTechOpen(false);
    setTechHint(null);
  };

  const handleSelectTechnique = (s: AttackTechnique) => {
    addTechniqueRef(s.id, s.name);
    setTechInput("");
    setTechSuggestions([]);
    setTechOpen(false);
    setTechHint(null);
  };

  const handleTechKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTechnique();
    } else if (e.key === "Escape") {
      setTechOpen(false);
    }
  };

  const handleTechBlur = () => {
    // Small delay so a suggestion click registers before the dropdown closes.
    techBlurRef.current = setTimeout(() => setTechOpen(false), 150);
  };

  const handleTemplateBlur = () => {
    templateBlurRef.current = setTimeout(() => setTemplateOpen(false), 150);
  };

  const handleSelectTemplate = (s: any) => {
    setElementId(`${templateType}-${s.id.toLowerCase().replace(/[^a-z0-9]/g, "")}`);
    setName(s.name);
    
    if (templateType === "detection") {
      setTier("observation");
      setDetections([{ id: s.id, name: s.name }]);
      setDescription(s.description || "");
    } else if (templateType === "mitigation") {
      setTier("obstacle");
      setMitigations([{ id: s.id, name: s.name }]);
      setDescription(s.description || "");
    } else if (templateType === "datacomponent") {
      setTier("observation");
      setDatacomponents([{ id: s.id, name: s.name }]);
      setDescription(s.description || "");
    } else if (templateType === "analytic") {
      setTier("observation");
      setAnalytics([{ id: s.id, name: s.name }]);
      setDescription(s.description || "");
    } else if (templateType === "software") {
      setTier(tierForSoftware(s));
      setSoftware([{ id: s.id, name: s.name }]);
      setDescription(`${s.description}\n\nType: ${s.type}\nPlatforms: ${s.platforms.join(", ")}`);
    } else if (templateType === "target") {
      setTier("key-terrain");
      setDescription(s.description || "");
    }

    setTemplateSearch("");
    setTemplateSuggestions([]);
    setTemplateOpen(false);
    setTemplateType("none");
  };

  const removeTechnique = (id: string) => {
    setTechniques((prev) => prev.filter((t) => t.id !== id));
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
        techniques,
        detections,
        mitigations,
        datacomponents,
        analytics,
        software,
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
        techniques,
        detections,
        mitigations,
        datacomponents,
        analytics,
        software,
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

        {/* Template Autofill */}
        {!isEditMode && (
          <div>
            <label className="block data-label mb-2">Autofill</label>
            <div className="flex gap-2">
              <select
                value={templateType}
                onChange={(e) => {
                  setTemplateType(e.target.value as any);
                  setTemplateSearch("");
                  setTemplateSuggestions([]);
                }}
                className={INPUT_CLASS}
                style={{ width: "160px" }}
              >
                <option value="none">-- Select Type --</option>
                <option value="detection">Detection</option>
                <option value="mitigation">Mitigation</option>
                <option value="datacomponent">Data Component</option>
                <option value="analytic">Analytic</option>
                <option value="software">Software</option>
                <option value="target">Common Target</option>
              </select>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={templateSearch}
                  disabled={templateType === "none"}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  onFocus={() => {
                    if (templateType !== "none") setTemplateOpen(true);
                  }}
                  onBlur={handleTemplateBlur}
                  placeholder={templateType === "none" ? "Select a type first" : "Search to autofill..."}
                  autoComplete="off"
                  className={`${INPUT_CLASS} pl-8 disabled:opacity-60`}
                />
                
                {templateOpen && (templateSuggestions.length > 0 || templateLoading) && (
                  <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-md shadow-card">
                    {templateLoading ? (
                      <div className="px-3 py-2.5 text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Searching…
                      </div>
                    ) : (
                      templateSuggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectTemplate(s);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[var(--bg-raised)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="mono text-[12px] text-[var(--text-primary)] shrink-0">
                              {s.id}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] truncate">
                              {s.name}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            {templateType !== "none" && (
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                Selecting an item will overwrite the element ID, name, layer, and description.
              </p>
            )}
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

        {/* ATT&CK techniques (TTPs) — how the threat operates */}
        <div>
          <label htmlFor="techInput" className="block data-label mb-2">
            ATT&amp;CK Techniques (TTPs)
          </label>

          {techniques.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {techniques.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] bg-[var(--bg-raised)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  title={t.name}
                >
                  <Crosshair className="w-3 h-3 text-[var(--accent-primary)]" />
                  <span className="mono">{t.id}</span>
                  {t.name && (
                    <span className="text-[var(--text-muted)] max-w-[140px] truncate">{t.name}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeTechnique(t.id)}
                    aria-label={`Remove ${t.id}`}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
                  id="techInput"
                  value={techInput}
                  onChange={(e) => {
                    setTechInput(e.target.value);
                    setTechHint(null);
                  }}
                  onKeyDown={handleTechKeyDown}
                  onFocus={() => {
                    if (techSuggestions.length > 0) setTechOpen(true);
                  }}
                  onBlur={handleTechBlur}
                  placeholder="Search ATT&CK or type T1021.002…"
                  autoComplete="off"
                  className={`${INPUT_CLASS} pl-8`}
                />
              </div>
              <button
                type="button"
                onClick={addTechnique}
                disabled={!techInput.trim()}
                className="flex items-center gap-1 px-3 py-2 bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:opacity-90 disabled:opacity-50 rounded-md text-[11px] font-semibold transition-opacity shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Suggestions dropdown */}
            {techOpen && techInput.trim().length >= 2 && (
              <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-md shadow-card">
                {techLoading ? (
                  <div className="px-3 py-2.5 text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Searching…
                  </div>
                ) : techSuggestions.length === 0 ? (
                  <div className="px-3 py-2.5 text-[11px] text-[var(--text-muted)]">
                    No matches
                  </div>
                ) : (
                  techSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      // onMouseDown fires before input blur, so the click registers.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectTechnique(s);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--bg-raised)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="mono text-[12px] text-[var(--text-primary)] shrink-0">
                          {s.id}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] truncate">
                          {s.name}
                        </span>
                      </div>
                      {s.isSub && s.parentName && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          ↳ {s.parentName}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {techHint && (
            <p className="text-[11px] mt-1.5" style={{ color: DANGER }}>
              {techHint}
            </p>
          )}
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
            Search ATT&amp;CK techniques or type an id (e.g. T1021.002).
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
