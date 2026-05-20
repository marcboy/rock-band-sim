# Rock Band Sim — Project Handoff

*Everything you need to restart this project in a new Claude session or on another machine. Written May 20, 2026.*

---

## 1. Original ask & clarifications

**User's first message:** "I want to build a rock band management app for iOS."

**Clarifications I asked, and the answers:**

| Question | Answer |
|---|---|
| Who is this app for? | **Fantasy/sim game** — manage a fictional rock band (career sim, not a real-world tool for actual bands) |
| Core features for v1? | **Albums sold and fan counts** as the central metrics |
| What to produce now? | **Spec + wireframes doc**, then later a clickable HTML prototype |

This narrowed the project to a turn-based career-sim, like Football Manager or Game Dev Tycoon, where the player makes decisions and watches two compounding numbers move.

## 2. The design in one paragraph

A four-piece band starts at 0 fans, $8K cash, a beat-up van. Each turn = one week. The player writes songs, records albums, books gigs (planned, not yet in prototype), and makes career decisions. Every action serves two numbers: **albums sold** (lifetime units across discography) and **fans** (audience size). Sales feed cash and certifications; sales feed *more fans*; more fans feed *bigger first-week sales on the next album*. The loop compounds — or stalls, and the player has to figure out why. Session length: 5–15 minutes. Career length: ~10 in-game years (~520 weeks).

## 3. Core simulation formulas

These are live in the prototype.

```
firstWeekSales = (fans × conversionRate + discoveryFloor) × launchMultiplier × seasonality

conversionRate(quality):
  q<4   → 0.05
  q<7   → 0.15
  q<9   → 0.30
  q≥9   → 0.45

discoveryFloor   = quality × 80           // streaming/algorithm pickup
launchMultiplier = rand(0.6, 2.0)         // press, virality, luck
seasonality      = rand(0.85, 1.15)

weeklyDecay      = 0.85 (or 0.88 if quality ≥ 7)
weeklyFans       = unitsSoldThisWeek/6 + fans×0.002 - (fans×0.005 if dormant)
revenuePerUnit   = $1.50 (self-release tier)
weeklyBurn       = $200
```

A song has 3 quality dimensions (hook, vibe, edge — each 0–10, currently random). Album quality = mean of (hook+vibe+edge)/3 across tracks.

## 4. Files in the repo (already a local git repo with one commit)

Location on this machine: `/Users/marcboyer/Library/Application Support/Claude/local-agent-mode-sessions/46056cf5-300e-45ce-aeac-f06c3679caf1/a85730eb-4527-4309-b9e5-2a754c7f36db/local_554f83a6-178d-43ed-82bb-a7701f55ad0b/outputs/`

| File | Purpose |
|---|---|
| `README.md` | Repo overview |
| `rock-band-sim-spec.md` | **12-section design doc.** Concept, systems (time, band, songwriting, albums, fans, money, tour, events), formulas, screen map, roadmap, open questions |
| `rock-band-sim-prototype.html` | **Single-file interactive prototype.** Open in any browser. Three tabs (Band / Studio / Albums) working. Real sim math. `Space` advances a week, `R` resets. localStorage persistence |
| `wireframe-01-dashboard.svg` | Phone mockup of the Band/Dashboard screen |
| `wireframe-02-studio.svg` | Phone mockup of the Studio screen |
| `wireframe-03-albums.svg` | Phone mockup of the Discography screen |
| `wireframe-04-tour.svg` | Tour mockup (not in prototype yet) |
| `wireframe-05-charts.svg` | Charts mockup (not in prototype yet) |
| `playtest.js` | Headless Node.js harness that simulates an AI player for 100 weeks. Used to validate the loop math |
| `.gitignore` | Standard ignores |

To push to GitHub from terminal:
```bash
cd path/to/outputs
gh repo create rock-band-sim --public --source=. --remote=origin --push
# or, without gh: create empty repo at github.com/new, then:
# git remote add origin https://github.com/USERNAME/rock-band-sim.git && git push -u origin main
```

## 5. Key design decisions worth keeping

- **Two-tab structure for v1 prototype** (Band / Studio / Albums) instead of all 5 tabs from the spec. Reasoning: the Band+Studio+Albums loop *is* the game. Tour and Charts add depth but aren't needed to prove fun.
- **Discovery floor (`quality × 80`)** was added to the formula in the prototype but is NOT in the original spec. Without it, a 0-fan band sells 0 albums forever (chicken-and-egg). Worth adding to spec §6.1.
- **First album bonus**: first release also adds `firstWeek × 0.4` to fans (bootstrap mechanic, not in spec). Otherwise the first album earns cash but the fanbase still starts from zero.
- **iPhone 14 viewport** (390×844) used for all wireframes. Simple iOS aesthetic — black/white/single accent green for positive deltas.
- **The "two numbers" framing** is the design's spine. Every system and every screen serves either albums-sold or fan-count. Don't lose this if expanding scope.

## 6. Playtest findings — read these before changing the economy

I ran 100-week headless simulations with an AI player to validate the loop. Findings:

**Bug 1: original economy was unwinnable.** Spec called for $2K starting cash, $400/week burn, $1K to record per song, $2K master fee, 6-song minimum. Result: even an optimal player can't afford to ship one album. Spec assumed gigs would bridge this gap, but the prototype doesn't have gigs.

**Fix applied to prototype** (not spec):
- Starting cash: $2K → **$8K**
- Weekly burn: $400 → **$200**
- Record cost: $1K → **$500** per song
- Master fee: $2K → **$1K**
- Min tracks per album: 6 → **4** (EP-style first release)

**After fix, the loop compounds cleanly.** 100-week sim outcome with these numbers:

| Week | Fans | Cash | Lifetime sales | Albums |
|---|---|---|---|---|
| Y1 W11 | 766 | $4.7K | 2.8K | 1 |
| Y1 W31 | 3.3K | $15K | 19.7K | 3 |
| Y2 W9 | 8.4K | $40.9K | 51.9K | 6 |
| Y2 W29 | 13.4K | $73.2K | 83.5K | 8 |
| Y2 W49 | 21.2K | $133.3K | 133.9K | 11 |

Loop works. Numbers compound. But 11 albums in 2 years is way too many for realism — real bands ship 1 every 18–24 months. **Pacing problem** to address: either slow down recording (longer recording weeks), make albums expensive enough to be rare, or make songs much harder to write well.

**Bug 2: song quality is uninteresting.** Hook/vibe/edge are uniform random `randint(3,9)`. Average quality is always ~6. The spec calls for member skills to bias these rolls. Until that's implemented, the player has no levers on quality — they just ship albums and hope for a good launch multiplier.

## 7. Open questions (from spec §11) — still unresolved

1. **Naming.** Are album titles, song names, and cover art generated, picked from lists, or written by the player? Currently picked from word lists in the prototype.
2. **World realism.** Real venue/city names (Mohawk, The Echo, Austin) or fictional? Wireframes use real names.
3. **Difficulty model.** Single slider, or per-system (easy money / hard morale)?
4. **Reading-vs-doing ratio.** Spec is ~70/30 reading event cards vs. tuning numbers — needs playtest.
5. **Failure tone.** Band breakup = sad cutscene, "what if" replay, or scoreboard entry?

## 8. What's intentionally missing from the prototype

- **Tour / gigs system** — wireframed but not built. This is the most important missing piece because gigs are the spec's early-game income source.
- **Members & skills** — no member roster, no morale, no energy effects on outcomes. Quality is random.
- **Events beyond 3 sample cards** — only sync deal, blog write-up, gear breaks. Spec calls for ~50 cards by v1.
- **Charts screen** — wireframed only.
- **Member crises, label offers, sync licensing pipeline.**
- **Audio, visuals, music** — none. This is a paper prototype with HTML chrome.

## 9. Roadmap (lifted from spec §10, slightly revised)

**MVP (3–4 months solo dev)**
- Full Band+Studio+Albums+Tour+Charts loop
- 1 genre, 4 producer options, 6 venue tiers
- ~50 hand-crafted event cards
- Local-only save, no online features
- Goal: ship to TestFlight and prove the loop is fun for 2 hours

**v1 (after playtests)**
- Genre system (3 options), lineup variations, member system
- Label negotiation, merch, basic art pass
- iOS-only release

**v1.5 / later**
- Online leaderboards (highest lifetime sales)
- New Game+ with starting reputation
- iCloud save sync, iPad layout
- Cosmetic monetization

## 10. Tech notes for the iOS build

The prototype is HTML, but the spec is targeting iOS. Recommended stack:
- **SwiftUI** for views (the tab/card aesthetic in the wireframes translates 1:1)
- **Combine** or `@Observable` for the game loop state
- Game state is small enough to live entirely in memory + Codable persistence to a JSON file
- No backend needed for MVP — single-player offline game
- Charts can use the Swift Charts framework (iOS 16+)

The `rock-band-sim-prototype.html` JS logic translates straightforwardly to Swift — the data model is just a struct tree.

## 11. Prompt to restart this project in a new Claude session

Paste this in a fresh conversation to bring the next session up to speed:

> I'm working on a rock band management sim game for iOS. It's a fantasy career-sim — the player manages a fictional band over a 10-year career. Every decision serves two compounding numbers: **albums sold** and **fan count**.
>
> The project is in a local git repo at `/Users/marcboyer/Library/Application Support/Claude/local-agent-mode-sessions/.../outputs/` containing: a 12-section design spec (`rock-band-sim-spec.md`), 5 SVG wireframes, a working HTML prototype (`rock-band-sim-prototype.html`) with the Band/Studio/Albums loop running, and a Node.js playtest harness (`playtest.js`). Read `HANDOFF.md` in that folder first — it has the full context including playtest findings and balance decisions.
>
> Today I want to: [pick one]
> - Add the Tour & gigs system to the prototype (spec §5.7)
> - Implement member roster + skills affecting song quality (spec §5.2-5.3)
> - Translate the prototype to a SwiftUI starter project for Xcode
> - Iterate on the spec/wireframes for [specific screen]
> - Other: ___

## 12. Things to remember about the design

- **Don't add a third primary number.** Two compounding numbers is the spine. Cash, energy, morale, reputation tags all matter — but they're inputs to the two big numbers, not co-equals.
- **Time pressure is in the bank account, not the clock.** A player can sit idle for 50 weeks; the burn rate eventually forces a decision. This is intentional — the game shouldn't punish slow play.
- **The Advance Week button is sacred.** It's the only mandatory tap in the loop. Don't bury it; don't make it conditional.
- **Predictions should be honest.** The Studio shows "predicted first-week sales" before shipping. This is the system being transparent. Lying to the player (making predictions wildly wrong) breaks trust — keep the range narrow.
- **Failure should be slow and visible.** A band breaking up shouldn't surprise the player. Morale dropping, cash bleeding, no shows booked — all should show on the Dashboard for weeks before the game-over screen.

---

*If you want a one-paragraph TL;DR for anyone: "Turn-based iOS sim where you manage a fictional rock band over 10 years. Write songs, record albums, tour, watch fans and album sales compound — or stall. Built around two numbers, one tap (Advance Week), and a long enough horizon that you can mess up and recover. Spec, wireframes, and a working HTML prototype exist; iOS build hasn't started."*
