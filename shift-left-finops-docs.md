# Shift-Left FinOps — Project Documentation

**Tagline:** Catch cloud costs before they're committed, not after they're billed.

**Team size:** 4
**Format:** Hackathon build
**Stack:** MCP Server (Node/TypeScript) + Express bridge + React frontend + Terraform + Infracost/AWS Pricing API

---

## Table of Contents

1. [Vision & Problem Statement](#1-vision--problem-statement)
2. [System Architecture](#2-system-architecture)
3. [Data Flow — Step by Step](#3-data-flow--step-by-step)
4. [Tech Stack](#4-tech-stack)
5. [Repo Structure](#5-repo-structure)
6. [API Contract (The Bridge)](#6-api-contract-the-bridge)
7. [MCP Server Design](#7-mcp-server-design)
8. [Frontend Design Spec](#8-frontend-design-spec)
9. [Team Division of Labor](#9-team-division-of-labor)
10. [Build Timeline (Hackathon)](#10-build-timeline-hackathon)
11. [Demo Script](#11-demo-script)
12. [Stretch Goals](#12-stretch-goals)
13. [Risks & Fallbacks](#13-risks--fallbacks)

---

## 1. Vision & Problem Statement

Infrastructure costs are invisible to developers at the moment they matter most — when the Terraform is being written. By the time a bill arrives, the resources are already provisioned and the decision is sunk.

**Shift-Left FinOps** moves the cost conversation to *before* `terraform apply`. An AI assistant, when asked to draft or modify infrastructure, doesn't silently write files. Instead it:

1. Analyzes what's being proposed against the existing `.tf` state
2. Fetches live pricing for the proposed resources
3. Computes a cheaper, policy-compliant alternative
4. **Refuses to write code** until a human visually reviews and approves the cost delta on a dashboard

The core design constraint: **the frontend is not optional tooling — it's a gate.** The AI is architecturally incapable of writing infrastructure changes without a human clicking "Approve" in the UI. This is the demo's central "wow" moment for judges: watching an AI stop itself and hand control to a human-in-the-loop dashboard.

---

## 2. System Architecture

```
┌─────────────┐         ┌──────────────────────┐         ┌────────────────────┐
│  Developer  │  prompt │   AI Assistant        │  MCP    │   MCP Server        │
│  (Claude/   ├────────▶│  (Claude Code, etc.)  ├────────▶│   (Node/TS)         │
│   Cursor)   │         └──────────────────────┘  tools   │                     │
└─────────────┘                                            │  - tf_parser        │
                                                             │  - pricing_client   │
                                                             │  - policy_engine    │
                                                             │  - cost_optimizer   │
                                                             └──────────┬──────────┘
                                                                        │
                                                          POST /analysis (JSON payload)
                                                                        │
                                                                        ▼
                                                             ┌─────────────────────┐
                                                             │  Express Bridge      │
                                                             │  (in-process w/ MCP  │
                                                             │   or sibling process)│
                                                             │                      │
                                                             │  /api/analysis (GET) │
                                                             │  /api/approve (POST) │
                                                             │  WS: live updates    │
                                                             └──────────┬───────────┘
                                                                        │
                                                              serves + streams to
                                                                        │
                                                                        ▼
                                                             ┌─────────────────────┐
                                                             │  React Dashboard     │
                                                             │  (localhost:5173)    │
                                                             │                      │
                                                             │  Developer reviews   │
                                                             │  cost delta, clicks  │
                                                             │  "Approve & Write"   │
                                                             └──────────┬───────────┘
                                                                        │
                                                             POST /api/approve
                                                                        │
                                                                        ▼
                                                             MCP Server writes .tf
                                                             files to local disk
```

**Key architectural decision:** the MCP server and Express bridge live in the *same process* (or two processes on localhost sharing an in-memory/SQLite queue). The MCP server never writes to disk directly after generating a proposal — it always parks the proposal in the bridge's pending-approval store and *blocks* (via a long-poll or the MCP tool call itself waiting) until an approval event arrives.

---

## 3. Data Flow — Step by Step

1. **Trigger:** Developer prompts their AI assistant: *"Draft a database architecture for high-volume transactions."*
2. **MCP Orchestration:**
   - `tf_parser` tool reads existing `.tf` files in the working directory to understand current state (VPC, existing instances, tags).
   - AI drafts a proposed architecture (e.g., `aws_db_instance` with `db.m5.large`, on-demand).
   - `pricing_client` tool queries Infracost (or AWS Price List API) for the proposed resources.
   - `cost_optimizer` tool computes an alternative (e.g., Graviton `db.t4g.medium`, or Aurora Serverless v2) and re-prices it.
   - `policy_engine` tool checks both proposals against `policy.yaml` (e.g., "no on-demand in dev", "must be Graviton where supported").
3. **Data Handoff:** MCP server calls `pushAnalysis()` which POSTs a structured JSON payload (see [Section 6](#6-api-contract-the-bridge)) to the Express bridge's in-memory store and emits a WebSocket event. The MCP tool call itself now **holds open** / polls, waiting for a decision.
4. **Visual Approval:** React dashboard, subscribed via WebSocket (or 2s polling as fallback), receives the payload and renders it. Developer reviews, expands details, clicks **"Approve & Write Code"**.
5. **Execution:** React POSTs `{ decision: "approved", analysisId }` to `/api/approve`. The bridge resolves the pending promise the MCP tool call was awaiting. The MCP server's `terraform_writer` tool then writes the optimized `.tf` block to disk, and the AI assistant reports success back to the developer in their original chat window.
6. If developer clicks **"Reject"** or **"Keep Original"**, the corresponding variant is written instead (or nothing is written).

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| MCP Server | Node.js + TypeScript, `@modelcontextprotocol/sdk` | Official SDK, first-class stdio/HTTP transport support |
| Bridge API | Express.js (co-located with MCP server) | Minimal, fast to wire up under time pressure |
| Realtime | WebSocket (`ws` package) with polling fallback | Push-based updates feel premium; polling is the safety net |
| Frontend | React + Vite + TypeScript | Fast dev server, HMR, judges expect React |
| Styling | Tailwind CSS + custom glassmorphism utility classes | Rapid iteration, consistent dark-mode tokens |
| Charts | Recharts | Donut/bar charts with minimal setup |
| Animation | Framer Motion (+ a count-up hook) | Smooth number count-up and card transitions |
| Terraform parsing | `hcl2-parser` or regex-based extraction for MVP | Full HCL parsing is a stretch goal; MVP can scan resource blocks |
| Pricing | Infracost CLI (`infracost breakdown`) as primary; AWS Price List API as fallback/manual | Infracost gives instant diff-friendly cost breakdowns |
| Policy | Static `policy.yaml` evaluated in-process | No need for OPA/Rego at hackathon scale |
| State store (bridge) | In-memory JS object (Map) — no DB needed | Session lives only as long as the demo |

---

## 5. Repo Structure

```
shift-left-finops/
├── mcp-server/
│   ├── src/
│   │   ├── index.ts              # MCP server entrypoint + tool registration
│   │   ├── tools/
│   │   │   ├── tfParser.ts
│   │   │   ├── pricingClient.ts
│   │   │   ├── policyEngine.ts
│   │   │   ├── costOptimizer.ts
│   │   │   └── terraformWriter.ts
│   │   ├── bridge/
│   │   │   ├── server.ts         # Express app
│   │   │   ├── routes.ts         # /api/analysis, /api/approve
│   │   │   ├── store.ts          # in-memory pending-approval store
│   │   │   └── socket.ts         # WebSocket emit/broadcast
│   │   └── types/
│   │       └── analysis.ts       # shared TS types (mirrored in frontend)
│   ├── policy.yaml
│   └── package.json
│
├── dashboard/                    # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── CostDeltaHeader.tsx
│   │   │   ├── SplitView.tsx
│   │   │   ├── ResourceBreakdownChart.tsx
│   │   │   ├── PolicyBadges.tsx
│   │   │   └── ActionZone.tsx
│   │   ├── hooks/
│   │   │   ├── useAnalysisSocket.ts
│   │   │   └── useCountUp.ts
│   │   ├── lib/api.ts
│   │   └── App.tsx
│   └── package.json
│
├── sample-project/               # demo target repo with dummy .tf files
│   └── main.tf
│
└── docs/
    └── shift-left-finops-docs.md # this file
```

---

## 6. API Contract (The Bridge)

Shared TypeScript type — put this in both `mcp-server/src/types/analysis.ts` and `dashboard/src/types.ts` (or a shared package if time allows):

```typescript
interface CostAnalysis {
  id: string;                     // uuid, generated per analysis run
  timestamp: string;              // ISO 8601
  status: "pending" | "approved" | "rejected";

  proposed: ArchitectureVariant;  // what the user/AI originally drafted
  optimized: ArchitectureVariant; // MCP's suggested alternative

  savings: {
    monthlyDelta: number;         // proposed.monthlyCost - optimized.monthlyCost
    percentReduction: number;
  };

  breakdown: {
    compute: number;
    storage: number;
    networkEgress: number;
    other: number;
  };

  policyChecks: PolicyCheck[];
}

interface ArchitectureVariant {
  label: string;                  // "On-Demand m5.large" / "Spot t4g.medium"
  resources: TerraformResource[];
  monthlyCost: number;
}

interface TerraformResource {
  type: string;                   // "aws_instance", "aws_db_instance", etc.
  name: string;
  hcl: string;                    // the actual HCL block to write on approval
  unitCost: number;
}

interface PolicyCheck {
  label: string;                  // "Dev Budget Compliant"
  passed: boolean;
}
```

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/analysis/:id` | Fetch a specific analysis (dashboard polls/loads this) |
| `GET` | `/api/analysis/latest` | Convenience endpoint — always returns the most recent pending analysis |
| `POST` | `/api/approve` | Body: `{ id, decision: "approved" \| "rejected" \| "keep_original" }` — resolves the MCP tool's pending promise |
| `WS` | `/ws` | Server emits `{ event: "new_analysis", data: CostAnalysis }` and `{ event: "status_update", id, status }` |

**Contract-first tip:** lock this schema in the first hour. Once it's fixed, backend and frontend teams can build against a mock JSON file independently and integrate only at the end.

---

## 7. MCP Server Design

### Tools exposed to the AI assistant

| Tool name | Input | Output | Notes |
|---|---|---|---|
| `analyze_infrastructure` | `{ workingDir, proposedHcl }` | `CostAnalysis` (also pushed to bridge) | Orchestrates parser → pricing → optimizer → policy, then **blocks** until approval |
| `read_terraform_state` | `{ workingDir }` | list of existing resources | Wraps `tfParser` |
| `get_pricing` | `{ resourceType, instanceType, region }` | `{ monthlyCost, unit }` | Wraps Infracost CLI call or cached pricing table |
| `write_approved_changes` | `{ analysisId }` | `{ success, filesWritten }` | Only callable after `status === "approved"`; writes `hcl` from the chosen variant |

### The "blocking" mechanic (the core gimmick)

`analyze_infrastructure` should not return to the AI assistant immediately. Implementation options, easiest first:

1. **Simplest (recommended for hackathon):** The tool pushes the analysis to the bridge and returns a message to the AI immediately: *"Analysis pushed to dashboard at http://localhost:5173 — waiting for developer approval. Call `check_approval_status({analysisId})` to check."* The AI assistant naturally loops/waits and re-checks. This avoids holding a long-lived server call open and is far more robust for a live demo.
2. **True blocking:** The tool call itself `await`s a Promise that resolves when `/api/approve` is hit (store a resolver keyed by `analysisId` in the bridge). Cooler, but riskier — a stuck promise (browser tab closed, WebSocket drop) hangs the whole agent. Only do this if Track A finishes early.

**Recommendation: build option 1 first, upgrade to option 2 only as a stretch goal.**

### Pricing data — pragmatic fallback

Infracost's API needs an API key and internet access; have a **static pricing table JSON** (top ~15 EC2/RDS instance types, on-demand vs spot, us-east-1) as a hardcoded fallback so the demo never breaks on WiFi.

### Policy engine — minimal viable version

```yaml
# policy.yaml
rules:
  - id: no-on-demand-in-dev
    description: "Dev Budget Compliant"
    condition: "environment == 'dev' AND pricing_model == 'on-demand'"
    expected: false
  - id: spot-preferred
    description: "Spot Instance Enforced"
    condition: "pricing_model == 'spot'"
    expected: true
  - id: graviton-preferred
    description: "Graviton (ARM) Preferred"
    condition: "instance_family matches 'g$'"
    expected: true
```

Evaluate with simple JS conditionals for the hackathon — no need for a rules engine library.

---

## 8. Frontend Design Spec

**Visual direction:** dark-mode glassmorphism. Translucent frosted panels (`backdrop-filter: blur(20px)`), subtle glowing borders (`box-shadow` with low-opacity accent color), deep navy/charcoal canvas (`#0a0e17` or similar), accent colors: **green** (`#00E5A0`-ish) for savings/optimized, **red/amber** (`#FF6B6B` / `#FFB020`) for proposed/original.

### Components

**1. Cost Delta Header**
- Full-width glass card, top of page
- Huge number (72–96px), animated count-up on mount using a `useCountUp` hook (interpolate 0 → final value over ~1.2s with ease-out)
- Subtext: "Estimated Monthly Savings" with a small "% reduction" pill next to it
- Soft green glow (`box-shadow: 0 0 60px rgba(0,229,160,0.25)`) breathing/pulsing subtly via CSS animation

**2. Proposed vs. Optimized Split View**
- Two glass cards side by side (stack vertically on mobile)
- Left: neutral/red-tinted border, labeled "Proposed", shows instance type, pricing model, monthly cost
- Right: green-tinted border, labeled "Optimized", same fields, plus a small badge listing *what changed* (e.g., "On-Demand → Spot", "m5.large → t4g.medium")
- A connecting arrow or "VS" divider between them, ideally animated (subtle horizontal pulse)

**3. Resource Breakdown Chart**
- Recharts `PieChart` (donut, `innerRadius` set) or horizontal `BarChart`
- Segments: Compute / Storage / Network Egress / Other
- Hover tooltip shows exact dollar amount
- Keep it minimal — no legends cluttering the card, use a small inline key instead

**4. Policy Compliance Badges**
- Row of pill-shaped badges (`rounded-full`, small padding, glass background)
- ✅ green check + label if passed, ⚠️ amber if failed
- e.g. "✅ Dev Budget Compliant" · "✅ Spot Instance Enforced" · "✅ Graviton Preferred"

**5. Action Zone**
- Sticky footer or prominent card at the bottom
- Primary button: **"Approve & Write Code"** — large, glowing green, satisfying hover/press states
- Secondary (ghost) button: "Reject"
- On click: button transitions to a loading spinner → then a success checkmark animation (Framer Motion `AnimatePresence` swap), plus a toast: "✅ Terraform written to `main.tf`"

### Suggested Tailwind design tokens

```css
--bg-canvas: #0a0e17;
--glass-bg: rgba(255, 255, 255, 0.04);
--glass-border: rgba(255, 255, 255, 0.08);
--accent-green: #00e5a0;
--accent-red: #ff6b6b;
--accent-amber: #ffb020;
--text-primary: #f5f7fa;
--text-muted: #8b93a7;
```

```css
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(20px);
  border-radius: 20px;
}
```

---

## 9. Team Division of Labor

Designed so all four tracks can start **immediately and in parallel** once the API contract in Section 6 is agreed on (do this together in the first 30–45 minutes).

### 🟦 Track A — MCP Server & Orchestration (1 person)
**Owns:** `mcp-server/src/index.ts`, `tools/tfParser.ts`, `bridge/store.ts`, `bridge/routes.ts`, the blocking/polling mechanic
- Set up MCP server skeleton with `@modelcontextprotocol/sdk`, register the 4 tools
- Build the Express bridge (in-memory store, `/api/analysis`, `/api/approve`)
- Implement `analyze_infrastructure` orchestration (calls into Track B and C's modules)
- Implement the "wait for approval" mechanic (option 1 from Section 7)
- Integration point: this person effectively owns the glue between everyone else's modules

### 🟩 Track B — Pricing & Cost Optimization Engine (1 person)
**Owns:** `tools/pricingClient.ts`, `tools/costOptimizer.ts`, the static pricing fallback table
- Integrate Infracost CLI (or AWS Price List API) for live pricing
- Build the static JSON fallback pricing table (on-demand/spot × common instance families, us-east-1)
- Write the optimization logic: given a proposed resource, suggest a cheaper policy-compliant equivalent (on-demand→spot, x86→Graviton, oversized→rightsized)
- Compute the `breakdown` object (compute/storage/egress/other split)
- Hand Track A a clean function: `optimize(proposedResources) → { optimized, savings, breakdown }`

### 🟨 Track C — Policy Engine & Terraform Writer (1 person)
**Owns:** `tools/policyEngine.ts`, `tools/terraformWriter.ts`, `policy.yaml`, `sample-project/main.tf`
- Write `policy.yaml` with 3–5 rules relevant to the demo story
- Implement the policy checker: given a variant, return `PolicyCheck[]`
- Implement `write_approved_changes`: takes the approved variant's `hcl` and appends/replaces the block in the target `.tf` file (use a clear marker comment like `# SHIFT-LEFT-FINOPS: managed block` to make find/replace safe)
- Build the demo's `sample-project/` — a believable existing Terraform repo (VPC, a couple of instances) that the live demo will "modify"
- Also owns basic HCL parsing/extraction used by Track A's `tfParser` if regex-based (coordinate with Track A on interface)

### 🟪 Track D — React Dashboard (1 person, can pull in help from whoever finishes early)
**Owns:** entire `dashboard/` app
- Scaffold Vite + React + Tailwind, set up design tokens from Section 8
- Build all 5 components: Cost Delta Header, Split View, Breakdown Chart, Policy Badges, Action Zone
- Build `useAnalysisSocket` hook (WebSocket subscribe, fallback to `setInterval` polling `/api/analysis/latest`)
- Build `useCountUp` animation hook
- Wire the Approve/Reject buttons to `POST /api/approve`
- Should build against a **hardcoded mock `CostAnalysis` JSON** for the first several hours — don't wait on Track A/B/C's live data

### Cross-cutting
- **Everyone** agrees on the `CostAnalysis` type from Section 6 before splitting off — this is the single most important synchronization point.
- Track D should have a `mocks/sampleAnalysis.json` matching the schema exactly, committed early, so Track A can literally point the bridge at that file for the first integration test.
- Integration checkpoint: schedule a 20-minute sync roughly 60% through the hackathon to plug all four tracks together and fix contract mismatches before polish time.

---

## 10. Build Timeline (Hackathon)

Assuming a ~10–12 hour hackathon window — adjust proportionally:

| Time | Milestone |
|---|---|
| 0:00–0:45 | Team syncs on API contract (Section 6), repo scaffolding, everyone `git clone`s and can run `npm install` |
| 0:45–4:00 | Parallel build: A (MCP+bridge skeleton), B (pricing/optimizer), C (policy+writer+sample repo), D (dashboard against mock JSON) |
| 4:00–4:30 | **Checkpoint 1:** A wires B and C's modules into the orchestration tool; D confirms UI renders correctly against the real mock schema |
| 4:30–7:00 | Continue building; D starts consuming live data from the bridge instead of the mock file; A/B/C harden pricing fallback and policy rules |
| 7:00–7:30 | **Checkpoint 2:** Full end-to-end run — prompt the AI, see data hit the dashboard, click approve, see file actually written |
| 7:30–9:30 | Polish pass: animations, glassmorphism details, error states, demo script rehearsal |
| 9:30–10:30 | Buffer for bugs, record backup demo video in case live demo fails |
| 10:30+ | Final rehearsal, pitch deck / README polish |

---

## 11. Demo Script

A tight, repeatable script for judges:

1. Show the "before" — a plain `main.tf` with nothing special in it, and a normal AI chat window.
2. Type: *"Draft a database architecture for high-volume transactions using an m5.large on-demand instance."*
3. Narrate: "Instead of writing the file, watch what happens" — switch to the dashboard, already open in a second window.
4. Point out: the count-up savings number animating in, the red/green split view, the donut chart, the policy badges.
5. Click **Approve & Write Code** — show the success checkmark.
6. Switch back to the terminal/editor — show `main.tf` now contains the *optimized* Graviton spot-instance block, not the original on-demand one.
7. Close with the one-liner: "The AI wasn't allowed to touch the file system until a human looked at the money."

---

## 12. Stretch Goals

If the core loop is solid with time to spare, in priority order:

1. **True blocking MCP call** (option 2 from Section 7) instead of poll-based waiting.
2. **Real Infracost integration** with live API pricing instead of the static fallback table.
3. **Multi-resource diffs** — handle a whole architecture (VPC + compute + DB + LB) in one analysis instead of a single resource.
4. **History view** — a sidebar showing past approved/rejected analyses this session.
5. **Slack/webhook notification** when an analysis is pending, so the "developer" persona feels more real.
6. **Full HCL parsing** via a proper parser instead of regex extraction.

---

## 13. Risks & Fallbacks

| Risk | Fallback |
|---|---|
| Infracost API key issues / no internet at venue | Static pricing JSON table (Track B builds this first, live API is enhancement) |
| MCP blocking call hangs during live demo | Use polling-based approach (Section 7, option 1) as the default, not the true-blocking version |
| WebSocket flakiness on demo WiFi | Dashboard falls back to `setInterval` polling every 2s automatically |
| Terraform write corrupts the sample file mid-demo | Use a clearly marked block (`# SHIFT-LEFT-FINOPS: managed block start/end`) so writes are idempotent and easy to reset; keep a pristine copy of `sample-project/` to `git checkout --` before each rehearsal |
| Time runs out before full integration | D's dashboard already looks complete against mock data — worst case, demo the UI standalone and narrate the backend flow verbally |

---

*End of document. Once the team has reviewed this, the first concrete action is the 30–45 minute contract sync in Section 9 — lock the `CostAnalysis` schema, then split into the four tracks.*
