"use client";

import { useEffect, useState, useTransition } from "react";
import { useBriefingStore } from "@/store/useBriefingStore";
import { TIER_LABELS } from "@/lib/api";
import { ThreatTier, CustomNode } from "@/types";
import { X, Save, Trash2, Plus, Terminal, RefreshCw, AlertTriangle, Search, CheckCircle } from "lucide-react";

const DANGER = "#ef4444";

const TIER_COLORS: Record<string, string> = {
  observation: "var(--color-observation)",
  "avenue-of-approach": "var(--color-avenue)",
  obstacle: "var(--color-obstacle)",
  "key-terrain": "var(--color-key-terrain)",
  "cover-concealment": "var(--color-cover)",
};

const dangerStyle = {
  color: DANGER,
  backgroundColor: `${DANGER}1a`,
  borderColor: `${DANGER}40`,
};

const INPUT_CLASS =
  "w-full px-3 py-2 text-[13px] border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-md text-[var(--text-primary)] transition-colors focus:outline-none";
const INPUT_MONO_CLASS =
  "w-full px-3 py-2 text-[13px] mono border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-md text-[var(--text-primary)] transition-colors focus:outline-none";

interface NodeFormProps {
  onClose?: () => void;
}

export default function NodeForm({ onClose }: NodeFormProps) {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    fetchApiDataForNode,
  } = useBriefingStore();

  const isEditMode = selectedNodeId !== null;
  const selectedNode = isEditMode ? nodes.find((n) => n.id === selectedNodeId) : null;

  // Local Form states
  const [nodeId, setNodeId] = useState("");
  const [name, setName] = useState("");
  const [threatActor, setThreatActor] = useState("");
  const [tier, setTier] = useState<ThreatTier>("observation");
  const [ips, setIps] = useState("");
  const [cves, setCves] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // CVE lookup widget state
  const [cveInput, setCveInput] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [isLookingUp, startLookup] = useTransition();

  const [isPending, startTransition] = useTransition();

  // Sync state with selected node
  useEffect(() => {
    if (selectedNode) {
      setNodeId(selectedNode.id);
      setName(selectedNode.data.name);
      setThreatActor(selectedNode.data.threatActor || "");
      setTier(selectedNode.data.tier);
      setIps(selectedNode.data.ips.join(", "));
      setCves([...(selectedNode.data.cves || [])]);
      setDescription(selectedNode.data.description || "");
      setError(null);
      setLookupResult(null);
      setCveInput("");
    } else {
      setNodeId("");
      setName("");
      setThreatActor("");
      setTier("observation");
      setIps("");
      setCves([]);
      setDescription("");
      setError(null);
      setLookupResult(null);
      setCveInput("");
    }
  }, [selectedNodeId, selectedNode]);

  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTier(e.target.value as ThreatTier);
  };

  const handleLookupCve = () => {
    const cleanCve = cveInput.trim().toUpperCase();
    if (!cleanCve.match(/^CVE-\d{4}-\d{4,}$/)) {
      setLookupResult({ error: "Invalid CVE format. E.g., CVE-2023-3519" });
      return;
    }

    startLookup(async () => {
      try {
        const [kevRes, epssRes] = await Promise.all([
          fetch(`/api/kev?cves=${cleanCve}`),
          fetch(`/api/epss?cves=${cleanCve}`)
        ]);
        
        if (!kevRes.ok || !epssRes.ok) throw new Error("API failed");
        
        const kevData = await kevRes.json();
        const epssData = await epssRes.json();
        
        const isKev = kevData[cleanCve]?.isExploited;
        const details = kevData[cleanCve]?.details;
        const epssScore = epssData[cleanCve]?.epssScore || 0;
        const epssPercentile = epssData[cleanCve]?.epssPercentile || 0;

        setLookupResult({ 
          found: true, 
          isKev, 
          details, 
          epssScore: (epssScore * 100).toFixed(2), 
          epssPercentile: Math.round(epssPercentile * 100) 
        });
      } catch (e) {
        setLookupResult({ error: "Failed to connect to vulnerability databases." });
      }
    });
  };

  const handleAddCve = () => {
    const cleanCve = cveInput.trim().toUpperCase();
    if (cleanCve && !cves.includes(cleanCve)) {
      setCves(prev => [...prev, cleanCve]);
    }
    setCveInput("");
    setLookupResult(null);
  };

  const removeCve = (c: string) => {
    setCves(cves.filter(item => item !== c));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = nodeId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    const cleanName = name.trim();

    if (!cleanId) {
      setError("Terrain identifier key is required.");
      return;
    }

    if (!cleanName) {
      setError("Display Name is required.");
      return;
    }

    if (!isEditMode && nodes.some((n) => n.id === cleanId)) {
      setError("A terrain node with this ID already exists. ID must be unique.");
      return;
    }

    const ipArray = ips
      .split(",")
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);

    const nodeData = {
      id: cleanId,
      name: cleanName,
      tier,
      ips: ipArray,
      cves: cves,
      description: description.trim(),
      sigmaRules: [],
      lossMagnitude: 0,
      financialRisk: 0,
      threatActor,
      metrics: isEditMode ? selectedNode?.data.metrics : undefined,
    };

    if (isEditMode) {
      updateNode(cleanId, nodeData);
    } else {
      const newNode: CustomNode = {
        id: cleanId,
        type: "customThreatNode",
        position: {
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
        },
        data: nodeData,
      };
      addNode(newNode);
    }

    startTransition(async () => {
      if (cves.length > 0) {
        await fetchApiDataForNode(cleanId);
      }
    });

    if (onClose) onClose();
    setSelectedNodeId(null);
  };

  const handleDelete = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
      if (onClose) onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-card w-full md:max-w-md text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-default)]">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            {isEditMode ? (
              <>
                <Terminal className="h-4 w-4 text-[var(--text-secondary)]" />
                Inspect: {selectedNode?.data.name}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 text-[var(--accent-primary)]" />
                Add Tactical Element
              </>
            )}
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] font-medium mt-1">
            {isEditMode ? "Modify OAKOC node configs & metric indexes" : "Add an OAKOC asset layer component"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedNodeId(null);
            if (onClose) onClose();
          }}
          className="p-1.5 hover:bg-[var(--bg-raised)] rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="flex gap-2 p-3 border rounded-md text-xs" style={dangerStyle}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Node ID */}
        <div>
          <label htmlFor="nodeId" className="block data-label mb-2">
            Element ID (Unique Key)
          </label>
          <input
            type="text"
            id="nodeId"
            disabled={isEditMode}
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            placeholder="e.g. key-server-1"
            className={`${INPUT_MONO_CLASS} disabled:opacity-60`}
            required
          />
        </div>

        {/* Element Name */}
        <div>
          <label htmlFor="name" className="block data-label mb-2">
            Display Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={INPUT_CLASS}
            placeholder="e.g. Core Domain Controller"
          />
        </div>

        {/* Threat Actor */}
        <div>
          <label htmlFor="threatActor" className="block data-label mb-2">
            Targeting Adversary / Threat Actor
          </label>
          <input
            type="text"
            id="threatActor"
            value={threatActor}
            onChange={(e) => setThreatActor(e.target.value)}
            className={INPUT_CLASS}
            placeholder="e.g. APT29, Scattered Spider"
          />
        </div>

        {/* OAKOC Category Tier */}
        <div>
          <label htmlFor="tier" className="block data-label mb-2">
            OAKOC Tactical Tier
          </label>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-[var(--border-default)]"
              style={{ background: TIER_COLORS[tier] ?? "var(--text-secondary)" }}
            />
            <select
              id="tier"
              value={tier}
              onChange={handleTierChange}
              className={INPUT_CLASS}
            >
              {Object.entries(TIER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* IP Addresses */}
        <div>
          <label htmlFor="ips" className="block data-label mb-2">
            Network IP Interfaces
          </label>
          <input
            type="text"
            id="ips"
            value={ips}
            onChange={(e) => setIps(e.target.value)}
            placeholder="e.g. 10.0.4.15, 10.0.4.16"
            className={INPUT_MONO_CLASS}
          />
          <span className="text-[10px] text-[var(--text-muted)] block mt-1">Split multiple with commas.</span>
        </div>

        {/* CVE Lookup Widget */}
        <div className="bg-[var(--bg-raised)] p-4 rounded-md border border-[var(--border-default)] space-y-3">
          <label className="block data-label">
            Assign Vulnerability (CISA KEV)
          </label>
          
          {cves.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {cves.map(c => (
                <div key={c} className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-2 py-1 rounded flex items-center gap-2">
                  <span className="mono text-[10px] text-[var(--text-primary)]">{c}</span>
                  <button
                    type="button"
                    onClick={() => removeCve(c)}
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

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={cveInput}
                onChange={(e) => setCveInput(e.target.value)}
                placeholder="Lookup CVE-..."
                className="w-full pl-8 pr-3 py-1.5 text-[13px] mono border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-md text-[var(--text-primary)] transition-colors focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleLookupCve}
              disabled={!cveInput || isLookingUp}
              className="px-3 py-1.5 border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] text-[var(--text-secondary)] rounded-md text-[11px] font-semibold disabled:opacity-50 transition-colors"
            >
              {isLookingUp ? "Checking..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={handleAddCve}
              disabled={!cveInput}
              className="px-3 py-1.5 bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:opacity-90 disabled:opacity-50 rounded-md text-[11px] font-semibold transition-opacity"
            >
              Add
            </button>
          </div>

          {lookupResult && (
            <div
              className="p-3 rounded text-[11px] border"
              style={
                lookupResult.error || lookupResult.isKev
                  ? dangerStyle
                  : { backgroundColor: "var(--bg-raised)", borderColor: "var(--border-default)", color: "var(--text-primary)" }
              }
            >
              {lookupResult.error && <span>{lookupResult.error}</span>}
              {!lookupResult.error && lookupResult.isKev && (
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span><strong>CISA KEV Found:</strong> {lookupResult.details.vulnerabilityName}</span>
                    <span className="opacity-80">EPSS Likelihood: {lookupResult.epssScore}%</span>
                  </div>
                </div>
              )}
              {!lookupResult.error && !lookupResult.isKev && (
                <div className="flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--accent-primary)]" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">Valid CVE Format (Not in KEV)</span>
                    {Number(lookupResult.epssScore) > 0 && (
                      <span className="text-[var(--text-secondary)]">EPSS Likelihood: {lookupResult.epssScore}% (Top {100 - lookupResult.epssPercentile}% percentile)</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analyst Notes */}
        <div>
          <label htmlFor="description" className="block data-label mb-2">
            Analyst notes
          </label>
          <textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write analyst findings regarding this defense layer..."
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
            Delete Element
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedNodeId(null);
              if (onClose) onClose();
            }}
            className="px-4 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] text-[var(--text-secondary)] rounded-md text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:opacity-90 disabled:opacity-55 rounded-md text-xs font-semibold shadow-subtle transition-opacity"
          >
            {isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Element
          </button>
        </div>
      </div>
    </div>
  );
}
