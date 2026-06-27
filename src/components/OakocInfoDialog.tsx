"use client";

import { useEffect, type ReactNode } from "react";

interface OakocInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <div className="text-[12px]" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}

export function OakocInfoDialog({ open, onClose }: OakocInfoDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgba(8, 10, 15, 0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="What is OAKOC?"
    >
      <div
        className="max-h-[85vh] w-full max-w-[600px] overflow-y-auto flex flex-col"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 6,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 flex items-center justify-between px-5 py-4"
          style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-default)" }}
        >
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Military Aspects of Terrain (OAKOC)
            </h2>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Cyberspace Considerations (ATP 2-01.3)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="px-2 py-0.5 text-[18px] leading-none transition-colors hover:text-[var(--text-primary)]"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-[13px] mb-5" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Analyzing terrain in cyberspace can favor either friendly or threat forces. 
            The five military aspects of terrain (OAKOC) allow commanders to understand the terrain's impact on operations.
          </p>

          <Section title="Observation and fields of fire">
            <p>
              Ability to see subnets within networks, intrusion detection systems, password protections, and encryptions used in the area of operations. It is essential to understand what portion of the network can be seen and from where. Closed networks may prevent observation. Intrusion protection systems may eliminate possible threats.
            </p>
          </Section>

          <Section title="Avenues of approach">
            <p>
              Method of network access, such as an access point, threat intrusion, or path to physical or logical key terrain (switches, routers, servers, vectors). Mobility corridors can be grouped according to network speed. The volume of network activity may create additional avenues of approach.
            </p>
          </Section>

          <Section title="Key terrain">
            <p>
              Applied to the physical network, logical network, or cyber-persona layer. It is a physical node or data essential for mission accomplishment (e.g., major lines of communications, DNS, network operating systems, mission-critical parts of the threat network). Both friendly and threat forces could potentially occupy the same key terrain without knowing of the other's presence.
            </p>
          </Section>

          <Section title="Obstacles">
            <p>
              Network features that can impede cyberspace operations include intrusion detection systems, firewalls, antivirus software, password protections, encryptions, reliability of network connectivity, data limits, and write-protections that prevent data manipulation.
            </p>
          </Section>

          <Section title="Cover and concealment">
            <p>
              The threat electromagnetic signature, cyberspace hygiene, noise awareness, and ability to limit attribution. Includes hiding true identity (multiple cyber-personas, honeypots, Dark webs), threat defensive measures (firewalls, software patches, nonattributable proxy systems), and time/volume of network activity.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
