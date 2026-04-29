# Hey, Anrok team.

## Why I built this

I saw the Software Engineer (Early Career) role and wanted to show you how I work rather than just tell you about it. So I built this over a few days. It's a working demo that simulates a SaaS company tripping economic nexus thresholds across the US in real time - Anrok's actual problem space, in miniature.

## What it does

The app simulates "Exemptify," a fictional B2B SaaS selling subscriptions to customers in ten states. The map shades each state by progress toward its economic nexus threshold and flashes red the moment one is crossed. The filing panel below it builds quarterly tax obligations as nexus is established — real state base rates, real thresholds, real Q1/Q2/Q3/Q4 windows. The transaction feed streams sales as they happen, with amber banners marking the exact moment a state tips into nexus. A short spotlight tour walks you through each panel on first load.

The data is real. Nexus thresholds and measurement periods come from the Texas Comptroller, the NY Department of Taxation and Finance, and TaxCloud's 2026 state-by-state guide, all sourced in [`src/data/nexus-data.ts`](src/data/nexus-data.ts). The seed puts several states close to threshold so within seconds of hitting Play you watch nexus actually fire mid-quarter — the dramatic moment Anrok exists to handle.

## Why these technical choices

React + TypeScript + Vite + Tailwind is the foundation.

The business logic lives in pure functions in [`src/lib/nexus.ts`](src/lib/nexus.ts) — nexus detection, tax calculation, and filing aggregation, all taking and returning plain values. They're easy to reason about, trivial to unit test, and would lift cleanly into a Node backend without a rewrite. This separation matters in a tax product because the same calc has to run in batch jobs and in user-facing flows.

State management is React Context + `useReducer` — see [`src/context/SimulationContext.tsx`](src/context/SimulationContext.tsx). The simulation state is small and one-directional, so Redux or Zustand would have been overkill.

The map uses `react-simple-maps` and `d3-geo`. I needed an SVG US map with per-state fills, hover, and labels at each state's centroid; building it manually against a TopoJSON would have cost a day for no incremental learning value.

There's no backend. State is in-memory and resets on refresh. This is a demo, not a product, and a fake API layer would have added complexity without showing you anything new about how I work.

## Honest notes

The biggest deliberate simplification is that the tax and nexus math runs on the frontend. With more time I'd move `src/lib/nexus.ts` behind a small Node API, add Postgres for persistence, and write integration tests against the calc layer. I'd also model state-specific edge cases properly, like Texas's four-month grace period before collection begins, which the demo currently ignores.

This is far from what I'd ship to a real user, but I hope it shows you that I take the domain seriously, can build something end-to-end, and am honest about the tradeoffs.

__[Check out my portfolio](https://heyimhelen.com/)__ | __[LinkedIn](https://www.linkedin.com/in/helen-highwater-96981532/)__
