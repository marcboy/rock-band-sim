# Rock Band Sim (iOS) — Spec & Prototype

A turn-based career-sim where you manage a fictional rock band over a 10-year career. Every choice nudges two compounding numbers: **albums sold** and **fan count**.

## What's in this repo

- **`rock-band-sim-spec.md`** — 12-section design doc (concept, systems, formulas, roadmap, open questions)
- **`rock-band-sim-prototype.html`** — Single-file interactive prototype. Open in any browser. Real sim math from spec §6. Three working tabs: Band / Studio / Albums.
- **`wireframe-01-dashboard.svg`** — Dashboard mockup (iPhone 14, 390×844)
- **`wireframe-02-studio.svg`** — Studio mockup
- **`wireframe-03-albums.svg`** — Albums / discography mockup
- **`wireframe-04-tour.svg`** — Tour mockup (not yet in prototype)
- **`wireframe-05-charts.svg`** — Charts mockup (not yet in prototype)
- **`playtest.js`** — Headless Node.js playtest harness that simulates the loop and prints a 100-week trace

## Try the prototype

```bash
open rock-band-sim-prototype.html
# or just double-click it
```

Press `Space` on the Band tab to advance a week, `R` to reset. State persists in localStorage.

## Run the playtest

```bash
node playtest.js
```

Simulates an AI player for 100 weeks. Confirms the album-sold → fans → album-sold loop compounds.

## Status

Prototype validates the core loop. Tour, Charts, gigs/income before first album, member system, events beyond the 3 sampled — all still to do. Two playtest findings worth knowing before v1:

1. The spec's original economy ($2K start, $400/wk burn, $2K master fee) was unwinnable without gigs as an early income source. Prototype is loosened ($8K start, $200/wk burn, $1K master fee).
2. Song quality is currently a uniform random roll — needs to be biased by member skills to feel meaningful.

See spec §11 for open design questions.
