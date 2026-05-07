# KBMesh AI Feature Prioritization Scorecard

Interactive scoring tool for the KBMesh AI feature backlog.
Score each feature on **business value**, **implementation effort**, and
**architectural dependency**, and the app auto-ranks the backlog into a
phased roadmap (P1 / P2 / P3 / Backlog) and lets you export the result as CSV.

**Live app:** https://kbmesh.pplx.app

## Features

- 45 AI features across 6 categories — Ingestion Intelligence, Retrieval &
  Answering, Agentic Workflows, Graph-Native, Governance & Trust, Future / Optional
- Per-feature sliders (1–5) for value / effort / dependency
- Adjustable global weights for the three dimensions
- Three views: **Score** (cards by category), **Ranked list** (sortable table),
  **Roadmap** (P1/P2/P3/Backlog kanban)
- CSV export sorted by weighted score
- Light + dark mode, fully responsive

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v3
- 100% static, client-side — no backend, no storage, no API calls

## Develop locally

```bash
cd tools/prioritizer
npm install
npm run dev          # http://localhost:5173
npm run build        # outputs dist/
```

## Deploy

The production bundle is the `dist/` directory after `npm run build`. The live
site at https://kbmesh.pplx.app is hosted on the Perplexity sandbox; to host
elsewhere, just upload `dist/` to any static host.

## Scoring formula

```
score = (V_w · Value* + E_w · (1 − Effort*) + D_w · (1 − Dep*)) / (V_w + E_w + D_w) × 100
```

where each `*` term is min-max normalised to 0–1 from the 1–5 slider scale.
Default weights: Value 0.50 · Effort 0.30 · Dependency 0.20.

Phase thresholds: **P1** ≥ 75 · **P2** 60–74 · **P3** 45–59 · **Backlog** < 45.
