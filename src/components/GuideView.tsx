"use client";

import { Import, Search, Link2, Presentation, ShieldAlert, ArrowRight } from "lucide-react";

export default function GuideView() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          How to use Chinook Cyber
        </h2>
        <p className="text-[15px] text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Follow this 4-step workflow to translate raw threat intelligence or vulnerability assessments into actionable, defensive attack scenarios using the OAKOC framework.
        </p>
      </div>

      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-[var(--border-default)] hidden md:block" />

        <div className="flex flex-col gap-10">
          {/* Step 1 */}
          <div className="flex gap-6 relative">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] flex items-center justify-center shrink-0 shadow-sm z-10 mx-auto md:mx-0">
              <Import className="w-7 h-7 text-[var(--accent-primary)]" />
            </div>
            <div className="pt-2 flex-1">
              <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <span className="text-[var(--accent-primary)]">1.</span> Import Threat Data
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">
                Did a new CVE just drop? Did you get a CTI report on a new threat actor? Start in the <strong>Plan</strong> tab by importing that intelligence.
              </p>
              <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-lg p-4 text-[13px] text-[var(--text-secondary)]">
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Use the <strong>Import Threat Actor TTPs</strong> button to pull in known behaviors.</li>
                  <li>Use the <strong>Import Software</strong> button to pull in malware and tools used by the adversary (like Cobalt Strike or Mimikatz).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-6 relative">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] flex items-center justify-center shrink-0 shadow-sm z-10 mx-auto md:mx-0">
              <Search className="w-7 h-7 text-[var(--accent-secondary)]" />
            </div>
            <div className="pt-2 flex-1">
              <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <span className="text-[var(--accent-secondary)]">2.</span> Map Your Environment
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">
                Now map the known entities in your own environment that relate to this threat. What are your crown jewels? What defenses do you already have?
              </p>
              <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-lg p-4 text-[13px] text-[var(--text-secondary)]">
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Add your internal databases or Domain Controllers to <strong>Key Terrain</strong>.</li>
                  <li>Import your existing Splunk/Sentinel rules into <strong>Observation</strong>.</li>
                  <li>Import your firewall policies or EDR blocks into <strong>Obstacles</strong>.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-6 relative">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] flex items-center justify-center shrink-0 shadow-sm z-10 mx-auto md:mx-0">
              <Link2 className="w-7 h-7 text-[#f59e0b]" />
            </div>
            <div className="pt-2 flex-1">
              <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <span className="text-[#f59e0b]">3.</span> Link Attack Chains
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">
                Connect the dots to find the gaps. Group the adversary's actions and your defenses into sequential <strong>Attack Chains</strong>.
              </p>
              <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-lg p-4 flex flex-col gap-3">
                <p className="text-[13px] text-[var(--text-secondary)]">
                  Click the <Link2 className="w-3.5 h-3.5 inline mx-1" /> icon on any card to start a chain. If you have an Avenue of Approach, but no Detections or Mitigations linked in its chain, you have discovered a defensive gap!
                </p>
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-default)] w-fit">
                  <span>Avenue of Approach</span>
                  <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>Key Terrain</span>
                  <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                  <span className="text-[#ef4444] flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Missing Defenses!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-6 relative">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] flex items-center justify-center shrink-0 shadow-sm z-10 mx-auto md:mx-0">
              <Presentation className="w-7 h-7 text-[#10b981]" />
            </div>
            <div className="pt-2 flex-1">
              <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <span className="text-[#10b981]">4.</span> Brief Leadership
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">
                Once the planning is complete and the gaps are identified, switch over to the <strong>Brief</strong> tab.
              </p>
              <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-lg p-4 text-[13px] text-[var(--text-secondary)]">
                <p>
                  The Brief mode automatically transforms your messy brainstorming session into a polished Executive Dashboard and Kill Chain Swimlane presentation. Use this to secure resources to fix the gaps you found in Step 3.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
