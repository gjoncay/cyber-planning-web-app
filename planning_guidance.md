# CyberSandBox: OAKOC-based CTI Planning Tool

Act as an expert Full-Stack React Developer, CISO, and military intelligence cyber operations specialist. Your task is to build "CyberSandBox": an OAKOC-based Cyber Threat Intelligence (CTI) Planning and modeling tool.

This tool applies the US Army intelligence preparation of the battlefield concepts (**OAKOC** and **IPOE**) to cyber threat planning. It replaces static PowerPoint presentations with dynamic, API-driven threat briefings. Analysts can map threat vectors, pull real-world vulnerability data, and present scrollytelling narratives that toggle between Tactical and Strategic lenses.

### 🛠️ Tech Stack Requirements
*   **Framework:** Next.js (App Router) with React.
*   **State Management:** `zustand` (with `persist` middleware for LocalStorage saves).
*   **Styling:** Tailwind CSS using the **Chinook Cyber** design system.
*   **Graph/Visualization:** `reactflow` (React Flow) with `dagre` for node positioning.
*   **Animation:** `framer-motion` for transitions.
*   **Icons:** `lucide-react`.
*   **Markdown Parsing:** `react-markdown` with custom scrollytelling node highlights.

### 🎨 Design System & Branding (Chinook Cyber)
*   **Logo:** Integrate `Clean_Chinook_Logo.png` in the header.
*   **Colors:** Earthy, professional PNW palette. Warm sand backgrounds (`#f5efe6`/`#fffdf9`), pine green accents (`#58855f`/`#6fa777`), desert tan highlights (`#e0882f`), slate borders, and dark gray text.
*   **Typography:** Inter for prose, JetBrains Mono for data identifiers. Strict 14px base, tight headings, and `.data-label` conventions.
*   **Theme:** Light default, opt-in dark theme (`data-theme="dark"`). Smooth transition on toggle.

### 🧩 OAKOC Cyber Framing (Graph Tiers)
Nodes are categorized and flow in visual tiers based on the OAKOC framework:
1.  **Observation (Tier 1):** Telemetry & detection inputs (e.g., EDR logs, Syslog, Proxy logs, Netflow, PCAP, TLS interception).
2.  **Avenues of Approach (Tier 2):** Means of accessing the network or network devices (e.g., CASB, Edge devices, Web proxy, WAFs).
3.  **Obstacles (Tier 3):** Friendly protective barriers & mitigations (e.g., WAF, NGFW, Zero Trust policies, SOAR playbooks).
4.  **Key Terrain (Tier 4):** Crown jewels & critical assets (e.g., Domain Controllers, credential stores, intellectual property, databases, admin accounts).
5.  **Cover & Concealment (Overlay/Tier 5):** Threat actor obfuscation or friendly hiding tactics (e.g., Encryption, DNS tunneling, hijacked accounts, living off the land).

### 🧩 Core Platform Features
1.  **The Isometric Canvas:** A 3D-angled React Flow canvas representing OAKOC defense in depth. Nodes are grouped vertically by OAKOC Tier.
2.  **Custom Node Engine:** Users can create custom nodes, specify their OAKOC tier, assign CVEs, IPs, and description.
3.  **The "Dual-Lens" Toggle:**
    *   *Tactical View:* Shows technical indicators, raw CVEs, IP addresses, and Sigma rules.
    *   *Strategic View:* Shows OAKOC tactical summary, FAIR-lite financial risk, and EPSS likelihood scores.
4.  **Scrollytelling via Inline Tags:** Markdown narrative pane on the left with `@Node(ID)` links. Scrolling or clicking on links zooms the canvas to the node.

### 📋 Phases of Execution
*   **Phase 1: Setup, Data Structures, & Zustand Store (Remix)**
    *   Refactor TypeScript types and initial Zustand store with OAKOC categories and Chinook design system theme values.
*   **Phase 2: Chinook UI Shell & OAKOC Node Form (Remix)**
    *   Implement Chinook design system themes (colors, variables, theme switcher) in layout.
    *   Integrate brand logo (`Clean_Chinook_Logo.png`).
    *   Update custom node form with OAKOC categorization options.
*   **Phase 3: Isometric OAKOC React Flow Canvas & Dagre Layout**
    *   Build the canvas using React Flow, implementing 3D isometric layout.
    *   Nodes styled dynamically depending on OAKOC tiers and threat metrics.
*   **Phase 4: Scrollytelling & Visual Focus Interaction**
    *   Implement Markdown parser, `@Node(ID)` camera focus panning, and Tactical/Strategic view adjustments.