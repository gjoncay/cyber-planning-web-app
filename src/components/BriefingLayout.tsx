"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  BackgroundVariant,
  Panel,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";

import { useBriefingStore } from "@/store/useBriefingStore";
import { OAKOCNode } from "./OAKOCNode";
import { OAKOCEdge } from "./OAKOCEdge";
import NodeForm from "./NodeForm";
import ReactMarkdown from "react-markdown";
import { Plus, Network, Layers, FileText, BarChart3, Crosshair } from "lucide-react";

/* ── OAKOC defense-in-depth ordering ────────────────────────────────────────
   Tiers are stacked as physical depth: the adversary arrives at the perimeter
   (top) and descends toward the crown jewels (bottom). Cover & Concealment is
   the hidden channel beneath it all. This vertical order IS the information. */
const TIER_ORDER = [
  "avenue-of-approach",
  "observation",
  "obstacle",
  "key-terrain",
  "cover-concealment",
] as const;

const TIER_META: Record<
  string,
  { label: string; short: string; color: string; tint: string }
> = {
  "avenue-of-approach": {
    label: "Avenues of Approach · Entry",
    short: "Avenues of Approach",
    color: "var(--color-avenue)",
    tint: "var(--tint-avenue)",
  },
  observation: {
    label: "Observation · Telemetry",
    short: "Observation",
    color: "var(--color-observation)",
    tint: "var(--tint-observation)",
  },
  obstacle: {
    label: "Obstacles · Defenses",
    short: "Obstacles",
    color: "var(--color-obstacle)",
    tint: "var(--tint-obstacle)",
  },
  "key-terrain": {
    label: "Key Terrain · Crown Jewels",
    short: "Key Terrain",
    color: "var(--color-key-terrain)",
    tint: "var(--tint-key-terrain)",
  },
  "cover-concealment": {
    label: "Cover & Concealment · Evasion",
    short: "Cover & Concealment",
    color: "var(--color-cover)",
    tint: "var(--tint-cover)",
  },
};

const TIER_Y: Record<string, number> = {
  "avenue-of-approach": 0,
  observation: 200,
  obstacle: 400,
  "key-terrain": 600,
  "cover-concealment": 800,
};

const LANE_X = -820;
const LANE_W = 1640;
const LANE_H = 168;
const NODE_W = 220; // approx, for centering the camera
const NODE_PAD_Y = 44; // node sits below the lane label

/* A non-interactive background "stratum" — one tinted lane per OAKOC tier,
   living in flow-space so it pans and zooms with the terrain. */
function OAKOCLaneNode({ data }: NodeProps) {
  return (
    <div
      className="oakoc-lane"
      style={{ width: data.width, height: data.height, background: data.tint }}
    >
      <div className="oakoc-lane__spine" style={{ background: data.color }} />
      <div className="oakoc-lane__label" style={{ color: data.color }}>
        {data.label}
        {typeof data.count === "number" ? ` · ${data.count}` : ""}
      </div>
    </div>
  );
}

const nodeTypes = {
  oakoc: OAKOCNode,
  oakocLane: OAKOCLaneNode,
};

const edgeTypes = {
  oakocEdge: OAKOCEdge,
};

const getLayoutedElements = (storeNodes: any[], storeEdges: any[]) => {
  // Group the real nodes by tier so we can center each tier's row.
  const groups: Record<string, any[]> = {};
  TIER_ORDER.forEach((t) => (groups[t] = []));
  storeNodes.forEach((n) => {
    const tier = n.data.tier || "observation";
    (groups[tier] || groups["observation"]).push(n);
  });

  // Background strata first (so they render behind the real nodes).
  const laneNodes = TIER_ORDER.map((tier) => ({
    id: `lane-${tier}`,
    type: "oakocLane",
    position: { x: LANE_X, y: TIER_Y[tier] },
    data: { ...TIER_META[tier], width: LANE_W, height: LANE_H, count: groups[tier].length },
    draggable: false,
    selectable: false,
    connectable: false,
    deletable: false,
    focusable: false,
    zIndex: 0,
  }));

  const realNodes: any[] = [];
  TIER_ORDER.forEach((tier) => {
    const group = groups[tier];
    const spacing = 320;
    const startX = -((group.length - 1) * spacing) / 2;
    group.forEach((node, i) => {
      realNodes.push({
        ...node,
        type: "oakoc",
        position: { x: startX + i * spacing, y: TIER_Y[tier] + NODE_PAD_Y },
        zIndex: 1,
      });
    });
  });

  const layoutedEdges = storeEdges.map((e) => ({ ...e, type: "oakocEdge" }));

  return { nodes: [...laneNodes, ...realNodes], edges: layoutedEdges };
};

/* ── Money + EPSS formatting for the strategic briefing ─────────────────── */
function fmtMoney(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1000)}k`;
  return `$${v}`;
}

export default function BriefingLayout() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodeId,
    setSelectedNodeId,
    viewMode,
  } = useBriefingStore();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [rfInstance, setRfInstance] = useState<any>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const layouted = getLayoutedElements(storeNodes, storeEdges);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [storeNodes, storeEdges, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection | any) => {
    const edgeId = `edge-${params.source}-${params.target}-${Date.now()}`;
    useBriefingStore.getState().addEdge({
      ...params,
      id: edgeId,
      type: "oakocEdge",
      data: { isAttackPath: false },
    });
  }, []);

  // Scrollytelling: glide the camera to a node and highlight it (no drawer).
  const focusNode = useCallback(
    (id: string) => {
      const target = nodes.find((n) => n.id === id);
      if (!target || !rfInstance) return;
      rfInstance.setCenter(target.position.x + NODE_W / 2, target.position.y + 70, {
        zoom: 1.15,
        duration: 800,
      });
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.type === "oakoc" && n.id === id })));
    },
    [nodes, rfInstance, setNodes],
  );

  // Turn inline "@Node(id)" references in prose into clickable focus chips.
  const linkify = useCallback(
    (text: string) => {
      const parts = text.split(/(@Node\([a-zA-Z0-9-_]+\))/g);
      return parts.map((part, index) => {
        const match = part.match(/@Node\(([a-zA-Z0-9-_]+)\)/);
        if (!match) return part;
        const id = match[1];
        const node = storeNodes.find((n) => n.id === id);
        const exists = !!node;
        return (
          <button
            key={index}
            onClick={() => exists && focusNode(id)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold mono transition-colors mx-0.5 border ${
              exists
                ? "bg-[var(--accent-glow)] border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--text-inverse)] cursor-pointer"
                : "bg-[var(--bg-raised)] border-[var(--border-default)] text-[var(--text-muted)] cursor-help"
            }`}
            title={exists ? `Focus terrain: ${node!.data.name}` : `Node "${id}" not found`}
          >
            <Network className="h-3 w-3" />
            {id}
          </button>
        );
      });
    },
    [storeNodes, focusNode],
  );

  const handleOpenCreateDrawer = () => {
    setSelectedNodeId(null);
    setIsDrawerOpen(true);
  };

  const onNodeClick = (_: React.MouseEvent, node: any) => {
    if (node.type !== "oakoc") return;
    setSelectedNodeId(node.id);
    setIsDrawerOpen(true);
    focusNode(node.id);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedNodeId(null);
  };

  /* Dual-lens briefing — the narrative re-renders for the active lens.
     Tactical = technical indicators; Strategic = risk & exposure language. */
  const dynamicMarkdown = useMemo(() => {
    if (storeNodes.length === 0) {
      return "_No terrain mapped yet. Add elements to the operations grid to auto-generate a briefing._";
    }

    const grouped = storeNodes.reduce((acc, node) => {
      (acc[node.data.tier] ||= []).push(node);
      return acc;
    }, {} as Record<string, any[]>);

    const maxEpss = (node: any) => {
      let m = 0;
      (node.data.cves || []).forEach((c: string) => {
        const p = node.data.metrics?.[c]?.epssPercentile ?? 0;
        if (p > m) m = p;
      });
      return m;
    };

    if (viewMode === "strategic") {
      let md = "# Strategic Risk Briefing\n\n";
      md +=
        "Decision-maker view of the defended terrain — financial exposure and likelihood, ordered by depth.\n\n";
      TIER_ORDER.forEach((tier) => {
        const group = grouped[tier];
        if (!group?.length) return;
        md += `## ${TIER_META[tier].short}\n\n`;
        group.forEach((node) => {
          md += `### @Node(${node.id}) — ${node.data.name}\n`;
          if (node.data.threatActor) md += `**Adversary:** ${node.data.threatActor}\n\n`;
          md += `**Exposure:** ${fmtMoney(node.data.financialRisk || 0)}`;
          const epss = Math.round(maxEpss(node) * 100);
          if (epss > 0) md += `  ·  **Likelihood (EPSS):** ${epss}%`;
          md += "\n\n";
        });
      });
      return md;
    }

    // Tactical
    let md = "# Tactical CTI Narrative\n\n";
    md += "This briefing is auto-generated from the current threat model.\n\n";
    TIER_ORDER.forEach((tier) => {
      const group = grouped[tier];
      if (!group?.length) return;
      md += `## ${TIER_META[tier].short}\n\n`;
      group.forEach((node) => {
        md += `### @Node(${node.id}) — ${node.data.name}\n`;
        if (node.data.threatActor) md += `**Targeted by:** ${node.data.threatActor}\n\n`;
        if (node.data.description) md += `${node.data.description}\n\n`;
        if (node.data.cves?.length) {
          const kev = node.data.cves.filter((c: string) => node.data.metrics?.[c]?.isExploited);
          md += `**Vulnerabilities:** ${node.data.cves.map((c: string) => "`" + c + "`").join(", ")}\n\n`;
          if (kev.length)
            md += `**Active KEV:** ${kev.map((c: string) => "`" + c + "`").join(", ")}\n\n`;
        }
      });
    });
    return md;
  }, [storeNodes, viewMode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 h-full min-h-0">
      {/* LEFT: the briefing narrative (prose side — Inter, well-set) */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-card flex flex-col overflow-hidden h-[600px] lg:h-auto">
        <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center gap-2 shrink-0">
          {viewMode === "strategic" ? (
            <BarChart3 className="h-4 w-4 text-[var(--text-secondary)]" />
          ) : (
            <FileText className="h-4 w-4 text-[var(--text-secondary)]" />
          )}
          <h2 className="data-label leading-none text-[var(--text-primary)] font-semibold">
            {viewMode === "strategic" ? "Strategic Risk Briefing" : "Tactical CTI Narrative"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 xl:p-8 min-h-0">
          <article className="max-w-none text-[var(--text-primary)] text-[13px] leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => {
                  if (typeof children === "string") {
                    return (
                      <p className="mb-4 text-[var(--text-secondary)] leading-relaxed">
                        {linkify(children)}
                      </p>
                    );
                  }
                  return <p className="mb-4 text-[var(--text-secondary)] leading-relaxed">{children}</p>;
                },
                h1: ({ children }) => (
                  <h1 className="text-[18px] font-bold tracking-tight text-[var(--text-primary)] mb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-[14px] font-bold text-[var(--text-primary)] mt-7 mb-3 pb-2 border-b border-[var(--border-default)] tracking-tight">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => {
                  // Each tier entry heads with "@Node(id) — Name": render a clean,
                  // clickable focus target (the raw id stays hidden, drives the camera).
                  if (typeof children === "string") {
                    const m = children.match(/^@Node\(([a-zA-Z0-9-_]+)\)\s*[—-]\s*(.*)$/);
                    if (m) {
                      const [, id, name] = m;
                      const exists = storeNodes.some((n) => n.id === id);
                      return (
                        <h3 className="mt-4 mb-1.5">
                          <button
                            onClick={() => exists && focusNode(id)}
                            disabled={!exists}
                            className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-primary)] enabled:hover:text-[var(--accent-primary)] transition-colors"
                            title={exists ? `Focus terrain: ${name}` : "Node not found"}
                          >
                            <Crosshair className="h-3 w-3 text-[var(--text-muted)] group-enabled:group-hover:text-[var(--accent-primary)] transition-colors" />
                            {name}
                          </button>
                        </h3>
                      );
                    }
                  }
                  return (
                    <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mt-4 mb-1.5">
                      {children}
                    </h3>
                  );
                },
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-1 mb-4 text-[var(--text-secondary)]">{children}</ul>
                ),
                li: ({ children }) => <li className="text-[13px] leading-relaxed">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="mono text-[11px] bg-[var(--bg-raised)] border border-[var(--border-default)] px-1 py-0.5 rounded text-[var(--text-secondary)]">
                    {children}
                  </code>
                ),
              }}
            >
              {dynamicMarkdown}
            </ReactMarkdown>
          </article>
        </div>
      </section>

      {/* RIGHT: the defense-in-depth terrain (the signature) */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-card flex flex-col overflow-hidden relative h-[600px] lg:h-auto">
        <div className="px-5 py-3 border-b border-[var(--border-default)] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--text-secondary)]" />
            <h2 className="data-label leading-none text-[var(--text-primary)] font-semibold">
              Defense-in-Depth Terrain
            </h2>
          </div>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)] hover:opacity-90 text-[var(--text-inverse)] rounded-md text-[11px] font-semibold shadow-subtle transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Element
          </button>
        </div>

        <div className="flex-1 relative bg-[var(--bg-base)]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={onNodeClick}
            onInit={setRfInstance}
            fitView
            minZoom={0.2}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--text-muted)" className="opacity-[0.18]" />
            <Controls className="!bg-[var(--bg-surface)] !border-[var(--border-default)] !shadow-card !rounded-md overflow-hidden [&>button]:!border-b-[var(--border-default)] [&>button]:!bg-[var(--bg-surface)] [&>button]:!text-[var(--text-secondary)] hover:[&>button]:!text-[var(--text-primary)]" />
            <MiniMap
              className="!bg-[var(--bg-surface)] !border-[var(--border-default)] !shadow-card !rounded-md"
              nodeColor={(n) => (n.type === "oakoc" ? (TIER_META[n.data?.tier]?.color ?? "var(--border-strong)") : "transparent")}
              maskColor="var(--bg-raised)"
            />

            <Panel
              position="bottom-left"
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-card rounded-md p-3 flex flex-col gap-2 m-4 pointer-events-none"
            >
              <span className="data-label">OAKOC Strata · Surface → Depth</span>
              <div className="flex flex-col gap-1.5">
                {TIER_ORDER.map((tier) => (
                  <div key={tier} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: TIER_META[tier].color }} />
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                      {TIER_META[tier].short}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </ReactFlow>

          {/* Empty state */}
          {storeNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-sm space-y-3 p-5 bg-[var(--bg-surface)]/85 backdrop-blur border border-[var(--border-default)] rounded-lg shadow-card">
                <Network className="h-8 w-8 text-[var(--text-muted)] mx-auto stroke-[1.5]" />
                <h3 className="font-bold text-[14px] text-[var(--text-primary)] tracking-tight">
                  Map your terrain
                </h3>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  Add OAKOC elements to build a defense-in-depth cross-section of your network.
                </p>
              </div>
            </div>
          )}

          {/* Editing drawer (opens only on Add / node click) */}
          {isDrawerOpen && (
            <div className="absolute inset-0 bg-[var(--bg-base)]/50 backdrop-blur-[2px] flex justify-end z-50">
              <NodeForm onClose={closeDrawer} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
