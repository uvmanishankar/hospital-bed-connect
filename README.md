<div align="center">

# 🏥 Hospital Bed Connect

**Real-Time Hospital Bed & Asset Management System**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![ServiceNow](https://img.shields.io/badge/ServiceNow-PDI-81B5A1?style=flat&logo=servicenow)](https://developer.servicenow.com)
[![Mistral AI](https://img.shields.io/badge/Mistral-AI-F59E0B?style=flat)](https://mistral.ai)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel)](https://vercel.com)

A full-stack web application that gives hospital staff real-time visibility into bed availability, patient admissions, equipment assets, and AI-powered discharge predictions — backed by **ServiceNow** as the workflow engine and **Mistral AI** for clinical analysis.

[Live Demo](#deployment) · [Tech Stack](#tech-stack) · [Setup](#local-development) · [Architecture](#architecture)

</div>

---

## Features

| Module | What it does |
|---|---|
| **Dashboard** | Live KPI cards (total/available/occupied beds), occupancy trend chart, department breakdown |
| **Admissions** | Submit patient admissions, auto-assigns beds via ServiceNow Business Rule, 30s live refresh |
| **Beds** | Visual bed grid by ward, allocate/release/transfer with patient-type matching |
| **AI Analysis** | Mistral AI discharge predictions — estimated stay, clinical recommendations, auto-polled every 30s |
| **Assets** | Equipment inventory tracking |
| **Staff** | Staff availability management |
| **Reports** | Analytics and trend reports |

---

## Tech Stack

**Frontend**
- [React 19](https://react.dev) + [TypeScript 5.8](https://www.typescriptlang.org)
- [TanStack Router v1](https://tanstack.com/router) — file-based routing, type-safe navigation
- [TanStack Query v5](https://tanstack.com/query) — server state, 30s polling, optimistic updates
- [TanStack Start v1](https://tanstack.com/start) — SSR + server functions (RPC boundary)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Recharts](https://recharts.org) — occupancy trend & department charts
- [Zod](https://zod.dev) — runtime schema validation

**Backend / Integration**
- **ServiceNow PDI** (`dev353540`) — database, business rules, REST Table API
- **Scoped App** `x_1811536_hospit_0` — 7 custom hospital tables
- **Mistral AI** (`mistral-small-latest`) — triggered via ServiceNow REST Message
- **TanStack Server Functions** — server-only code, never shipped to browser bundle

**Deploy**
- [Vite 8](https://vite.dev) + [Nitro](https://nitro.build) (`preset: vercel`)
- [Vercel](https://vercel.com) — Node 22.x serverless (Build Output API v3)

---

## Architecture

```
Browser (React 19 + TanStack Router)
  │  useQuery / useMutation — 30s polling
  ▼
TanStack Server Functions  (servicenow.functions.ts)
  │  createServerFn() — runs on Node, credentials never in browser
  ▼
ServiceNow REST Table API  (servicenow.server.ts)
  │  Basic Auth — env vars only
  ▼
ServiceNow Business Rule
  │  Detects condition_notes → calls Mistral AI inline
  ▼
Mistral AI  →  writes ai_analysis back to ServiceNow
  │
  └──▶  Frontend polls /ai-analysis every 30s → results appear automatically
```

### AI Workflow (3-Phase)

```
Phase 1: Nurse submits patient admission form
         → POST to x_1811536_hospit_0_patient_admission

Phase 2: ServiceNow Business Rule auto-assigns bed
         → writes assigned_bed back to the record

Phase 3: Nurse saves condition notes
         → PATCH triggers Business Rule
         → Business Rule calls Mistral AI (sn_ws.RESTMessageV2)
         → AI writes to ai_analysis + ai_prediction table
         → Frontend polls → results surface automatically
```

### ServiceNow Tables

| Table | Purpose |
|---|---|
| `x_1811536_hospit_0_patient_admission` | Core admissions — patient details, assigned bed, AI analysis |
| `x_1811536_hospit_0_bed_inventory` | All beds — ward, status, occupancy |
| `x_1811536_hospit_0_ai_prediction` | AI prediction results (written by Business Rule) |
| `x_1811536_hospit_0_emplo` | Employee table — login credentials & roles |
| `u_hospital_bed` | Legacy bed records |
| `u_hospital_asset` | Equipment inventory |
| `u_bed_request` | Legacy bed request records |

---

## Project Structure

```
src/
├── routes/                    # File-based pages (TanStack Router)
│   ├── index.tsx              # Landing page (public)
│   ├── login.tsx              # Employee login
│   ├── dashboard.tsx          # KPI dashboard + charts
│   ├── admissions.tsx         # Patient admission + nurse update + AI badge
│   ├── beds.tsx               # Bed grid + allocate / release / transfer
│   ├── ai-analysis.tsx        # AI Prediction cards (30s poll)
│   ├── assets.tsx             # Equipment tracker
│   └── __root.tsx             # App shell (QueryClient, Toaster)
├── lib/
│   ├── servicenow.server.ts   # ServiceNow REST client (server-only)
│   ├── servicenow.functions.ts# TanStack server functions (RPC bridge)
│   ├── auth-store.ts          # localStorage session + useAuth hook
│   ├── validation.ts          # Zod schemas for forms
│   └── mock-data.ts           # Fallback data when SN not configured
├── components/
│   ├── AppShell.tsx           # Sidebar + header + auth guard
│   └── ui/                    # shadcn/ui component primitives
├── services/
│   └── bedService.ts          # Bed API abstraction layer
├── server.ts                  # Nitro/h3 SSR entry point
└── start.ts                   # TanStack Start middleware (env + error)
```

---

## Local Development

### Prerequisites

- Node.js 22+
- A [ServiceNow PDI](https://developer.servicenow.com) with the scoped app installed
- (Optional) Mistral AI API key configured as a ServiceNow System Property

### Setup

```bash
# 1. Clone
git clone https://github.com/uvmanishankar/hospital-bed-connect.git
cd hospital-bed-connect

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env
# Fill in your ServiceNow credentials in .env

# 4. Run dev server
npm run dev
# → http://localhost:3000
```

### Environment Variables

```env
# ServiceNow credentials (required for live data)
SERVICENOW_INSTANCE=your-instance-id      # e.g. dev123456
SERVICENOW_USERNAME=your-sn-username
SERVICENOW_PASSWORD=your-sn-password

# Demo login (local dev only — set false in production)
DEMO_LOGIN_ENABLED=false
DEMO_PASSWORD=
```

> Without ServiceNow env vars, the app runs in **mock mode** — all pages work with sample data.

---

## Deployment

### Build

```bash
npm run build
# Generates .vercel/output/ (Vercel Build Output API v3)
```

### Deploy to Vercel

1. Import the GitHub repo at [vercel.com](https://vercel.com/new)
2. Framework Preset: **Other** (detected automatically via `vercel.json`)
3. Add Environment Variables in the Vercel Dashboard:
   - `SERVICENOW_INSTANCE`
   - `SERVICENOW_USERNAME`
   - `SERVICENOW_PASSWORD`
4. Deploy — Vercel picks up `.vercel/output/` automatically

The `vercel.json` and `vite.config.ts` (Nitro `preset: vercel`) handle the rest.

---

## Security

| Area | Implementation |
|---|---|
| **Auth guard** | `AppShell` redirects unauthenticated users to `/login` on every protected route |
| **Server secrets** | ServiceNow credentials read from `process.env` only — never bundled to client JS |
| **Input validation** | Zod schemas on all server function inputs before hitting ServiceNow |
| **Timing-safe auth** | `crypto.timingSafeEqual()` for employee password comparison |
| **Session** | localStorage — role, name, sys_id only (no passwords) |

> **Known limitation:** The ServiceNow employee table stores passwords as plain text. The recommended long-term fix is ServiceNow OAuth 2.0.

---

## Contributing

```bash
# Run type check
npx tsc --noEmit

# Lint
npm run lint

# Format
npm run format
```

---

## Team

Built by **Mani Shankar Udumula** (Balu,nandu,vamsi) as part of a college AI-in-Healthcare project.

---

<div align="center">
<sub>Built with React · ServiceNow · Mistral AI · TanStack · Vercel</sub>
</div>
