# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install deps
npm run dev          # Vite dev server on 0.0.0.0:9001
npm run build        # production build to dist/
npm run preview      # serve the built output on 0.0.0.0:9001
```

There is no test runner, linter, or formatter configured — do not assume `npm test` or `npm run lint` exist. Verification means building (`npm run build`) and clicking through in the browser.

Deployment: `./install.sh` installs deps, builds, and (re)starts the app under PM2 using `ecosystem.config.cjs` (process name `portal-frontend`, `vite preview` on port 9001).

## What this is

A frontend-only demo/prototype of a nomination workflow for local body elections, styled as a party internal portal. React 18 + Vite SPA, plain JSX with hand-written CSS. **No router, no backend, no tests, no state library.** Only deps are `react` and `react-dom`. All data lives in memory and resets on reload.

Two top-level screens, switched by a boolean in `src/App.jsx`:
- `src/Login.jsx` — visual-only login. `handleSubmit` accepts *any* credentials, `console.log`s the username/password, and calls `onLoginSuccess()`. There is no auth.
- `src/leap/Leap.jsx` — the actual app.

## The `leap/` module

`Leap.jsx` owns all application state and acts as the ad-hoc router:
- `positions` — the entire dataset, seeded from `POSITIONS` in `data.js`, mutated only through `createPosition` / `addCandidate` / `advanceStage` defined there.
- `view` — a discriminated object (`{ name: 'newPosition' | 'positions' | 'detail', id?, filter? }`). Adding a screen means adding a `view.name` branch, not a route.

**Initial view is `newPosition`**, so after login the user lands directly on the creation wizard, and "← Back" from a detail page returns there. There is no list screen in the reachable flow.

New IDs come from module-level counters (`_newId`, `_candId` in `Leap.jsx`; `_cid`, `_phone`, `_pid` in `data.js`), not from a server.

### Screens

| Component | Reached via | Notes |
|---|---|---|
| `NewPositionModal` | `view.name === 'newPosition'` (initial) | 6-step wizard, each step revealed only when the previous is filled |
| `PositionDetail` | `view.name === 'detail'` after create or open | Stage tabs, candidate list, "Add Profile" modal |
| `AllPositions` | `view.name === 'positions'` | **Unreachable** — nothing sets this view |
| `PositionCard` | rendered by `AllPositions` | therefore also unreachable |
| `Sidebar` | always | Static; the single nav button has no handler |

`NewPositionModal` always creates `kind: 'nominated'` positions and maps its wizard fields oddly onto the position shape: `electionType` → both `dept` and `level`, `constituency` → `title`. Its `CONSTITUENCIES`, `RESERVATION`, and `MEMBERS_TABLE` are hardcoded placeholders inside the component, not data from `data.js`.

`PositionDetail` branches on `stage.key === 'profiles'` (stage 0) for the "add candidates" layout and falls through to a review layout for every other stage.

### `src/leap/data.js`

Central source of both the seed dataset and the domain vocabulary. It exports:
- Config constants (`STATE_NAME`, `PARTY_NAME`, `PARTY_SHORT`, `TERM_LABEL`).
- `STAGES` / `STAGE_COLORS` — the nomination pipeline (see the stage caveat below).
- Picklists (`AP_ASSEMBLIES`, `AP_MANDAL_TOWNS`) reused by both `NewPositionModal` and the candidate form in `PositionDetail`.
- `POSITIONS` — 16 seeded positions (8 `nominated`, 8 `committee`) with procedurally generated candidates. `makeCandidate` uses `Math.random()` at module load, so scores/points differ between reloads.
- Derived helpers `stagesFor`, `stageCounts`, `summary` — pure functions over a positions array.

All seed data is fictional; real Andhra Pradesh place names appear only as picklist values.

## Traps to know before editing

**The stage pipeline is truncated.** `STAGES` has only 2 entries (`profiles`, `approval`) while the rest of the code still assumes a 5–7 stage pipeline. Concretely:
- `stagesFor(kind)` returns `STAGES.slice(0, 5)` for committees, which with 2 entries is the *same* array as for nominated — the kind distinction is currently a no-op.
- Seed `stage:` values go up to 5, so most positions have a `stageIndex` outside `STAGES`.
- `PositionCard` does `STAGES[position.stageIndex].full` unguarded — this **throws** for any position with `stageIndex >= 2`. It is only invisible because `AllPositions` is unreachable. Restoring that view without fixing this will crash the render.
- `summary()` counts `stageIndex >= 4` as finalized and `=== 6` as GO-issued, so those stats read as 0 for anything the current UI can produce.
- `stageCounts()` writes `counts[p.stageIndex] += 1` past the array end, producing `NaN` entries.
- `PositionDetail` guards with `stages[viewStage] || stages[stages.length - 1]`, so it degrades rather than crashing.

If you touch `STAGES`, check every one of the consumers above.

**Branding is not actually centralized.** The CLAUDE-visible intent is that `data.js` drives naming, but `Sidebar.jsx` and `Login.jsx` hardcode "Telugu Desam Party" and `index.html` hardcodes a TDP title, while `PARTY_NAME` in `data.js` says "Praja Vikas Party". Changing one does not change the others — grep for both strings.

**`AllPositions` reads `filter !== 'all'`** but `view.filter` starts `undefined`, so the "← All Positions" reset button would always show.

## Styling

`src/leap/Leap.css` (~1440 lines) holds every class for the leap module; `Login.css` (~180) covers the login screen; `index.css` is a 17-line reset. Classes are flat and prefixed `leap-`. No CSS modules, no utility framework — add styles to the existing file matching the surrounding naming. Fonts (Montserrat, Inter) load from Google Fonts in `index.html`.

## Known dead / inert code

Mention rather than silently remove:
- `src/leap/components/Dashboard.jsx` (~167 lines) is not imported anywhere.
- `AllPositions` and `PositionCard` are unreachable (see table above). `AllPositions`'s `onNewPosition` prop is never passed, and it renders `st.nomOnly`, a field `STAGES` entries no longer have.
- `stageCounts` and `TERM_LABEL` are exported from `data.js` but used only by the dead `Dashboard`.
- `src/circle.svg` is used only by the login screen.
