# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install deps
npm run dev          # Vite dev server on 0.0.0.0:9001
npm run build        # production build to dist/
npm run preview      # serve the built output on 0.0.0.0:9001
```

There is no test runner, linter, or formatter configured — do not assume `npm test` or `npm run lint` exist.

Deployment: `./install.sh` installs deps, builds, and (re)starts the app under PM2 using `ecosystem.config.cjs` (process name `portal-frontend`, `vite preview` on port 9001).

## Architecture

React 18 + Vite SPA, plain JSX with hand-written CSS. **No router, no backend, no state library.** All data is in-memory and resets on reload.

Two top-level screens, switched by a boolean in `src/App.jsx`:
- `src/Login.jsx` — a visual-only login. `handleSubmit` accepts *any* credentials and calls `onLoginSuccess()`. There is no auth.
- `src/leap/Leap.jsx` — the actual app.

### The `leap/` module

`Leap.jsx` is the single owner of application state and the ad-hoc router:
- `positions` — the entire dataset, seeded from `POSITIONS` in `data.js`, mutated only through `createPosition` / `addCandidate` / `advanceStage` defined here.
- `view` — a discriminated object (`{ name: 'newPosition' | 'positions' | 'detail', id?, filter? }`) that decides which child renders. Adding a screen means adding a `view.name` branch, not a route.

New IDs come from module-level counters (`_newId`, `_candId` in `Leap.jsx`; `_cid`, `_phone`, `_pid` in `data.js`), not from a server.

### `src/leap/data.js`

Central source of both the seed dataset and the domain vocabulary. It exports:
- Config constants (`STATE_NAME`, `PARTY_NAME`, `PARTY_SHORT`, `TERM_LABEL`) — branding is driven from here, so change these rather than hardcoding names in components.
- `STAGES` / `STAGE_COLORS` — the nomination pipeline. **`STAGES` currently has only 2 entries** while much of the code (`stagesFor`, `summary`, the seed `stage:` values up to 5/6, `STAGE_COLORS` indexing) still assumes a longer 5–7 stage pipeline. Expect index-out-of-range fallbacks and stats that read as zero. If you touch stages, check every consumer.
- Picklists (`AP_ASSEMBLIES`, `AP_MANDAL_TOWNS`) reused by both `NewPositionModal` and the candidate form in `PositionDetail`.
- Derived helpers `stagesFor`, `stageCounts`, `summary` — pure functions over a positions array.

All seed data is fictional; real Andhra Pradesh place names appear only as picklist values.

### Styling

`src/leap/Leap.css` (~1400 lines) holds every class for the leap module; `Login.css` covers the login screen. Classes are flat and prefixed `leap-`. There is no CSS module or utility framework — add styles to the existing file matching the surrounding naming.

## Known dead / inert code

Mention rather than silently remove:
- `src/leap/components/Dashboard.jsx` is not imported anywhere.
- `AllPositions` is wired for `view.name === 'positions'`, but nothing currently sets that view (the `Sidebar` nav button has no handler), so it is unreachable. Its `onNewPosition` prop is never passed.
