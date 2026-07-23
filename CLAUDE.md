# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All npm commands run from `Frontend/`, not the repo root.

```bash
npm install          # install deps
npm run dev          # Vite dev server on 0.0.0.0:9001
npm run build        # production build to Frontend/dist/
npm run preview      # serve the built output on 0.0.0.0:9001
```

There is no test runner, linter, or formatter configured — do not assume `npm test` or `npm run lint` exist. Verification means building (`npm run build`) and clicking through in the browser.

Deployment: `Frontend/install.sh` installs deps, builds, and (re)starts the app under PM2 using `ecosystem.config.cjs` (process name `portal-frontend`, `vite preview` on port 9001). Run it from `Frontend/`.

## What this is

A prototype of a nomination workflow for local body elections, styled as a party internal portal. React 18 + Vite SPA, plain JSX with hand-written CSS, backed by a FastAPI + PyMySQL service in `Backend/` (see `Backend/README.md` for the endpoint table). **No router, no tests, no state library.** The only frontend deps are `react` and `react-dom`.

The reachable flow is backend-driven end to end: picklists, reservation, positions, cadre search, and candidate assignment all hit the database, and proposed candidates persist across reloads. What stays in memory is the *position wrapper* `Leap.jsx` builds on create (stage index, title, seat labels) — that resets on reload; the `proposal_position_id` it carries is what makes the candidate list durable.

Two top-level screens, switched by a boolean in `Frontend/src/App.jsx`:
- `Frontend/src/Login.jsx` — visual-only login. `handleSubmit` accepts *any* credentials, `console.log`s the username/password, and calls `onLoginSuccess()`. There is no auth.
- `Frontend/src/leap/Leap.jsx` — the actual app.

## The `leap/` module

`Leap.jsx` owns all application state and acts as the ad-hoc router:
- `positions` — the entire dataset, seeded from `POSITIONS` in `data.js`, mutated only through `createPosition` / `advanceStage` defined there. Candidates are *not* in this state: `PositionDetail` loads them from the backend.
- `view` — a discriminated object (`{ name: 'newPosition' | 'positions' | 'detail', id?, filter? }`). Adding a screen means adding a `view.name` branch, not a route.

**Initial view is `newPosition`**, so after login the user lands directly on the creation wizard, and "← Back" from a detail page returns there. There is no list screen in the reachable flow.

Local position IDs come from module-level counters (`_newId` in `Leap.jsx`; `_cid`, `_phone`, `_pid` in `data.js`). Backend IDs (`proposalConstituencyId`, `proposalPositionId`, `assemblyId`) are carried on the position object and are what every API call keys off.

### Screens

| Component | Reached via | Notes |
|---|---|---|
| `NewPositionModal` | `view.name === 'newPosition'` (initial) | 6-step wizard, each step revealed only when the previous is filled |
| `PositionDetail` | `view.name === 'detail'` after create or open | Stage tabs, candidate list (S13), "Add Candidate" cadre-search modal (S12 → S11) |
| `AllPositions` | `view.name === 'positions'` | **Unreachable** — nothing sets this view |
| `PositionCard` | rendered by `AllPositions` | therefore also unreachable |
| `Sidebar` | always | Static; the single nav button has no handler |

`NewPositionModal` always creates `kind: 'nominated'` positions and maps its wizard fields oddly onto the position shape: `electionType` → both `dept` and `level`, `assembly` → `title`. Its steps resolve, in order: S1 election types → S2 assemblies → S3/S4 mandals+towns → S5/S6 proposal constituency → S9 reservation + S7 positions. The mandal/town `<select>` shares one list for two endpoints, so its option values are tagged `m:<tehsil_id>` / `t:<town_id>` — keep that encoding if you touch step 3.

`PositionDetail` branches on `stage.key === 'profiles'` (stage 0) for the "add candidates" layout and falls through to a review layout for every other stage. Both branches render the S13 list; the `reloadKey` state is bumped after a successful S11 assign to re-run it.

Candidates use the **backend cadre shape** everywhere (`member_name`, `membership_id`, `mobile_no`, `category_name`, `mandal_town_name`, …) — not the `data.js` `candidate()` shape (`name`, `score`, `idNo`, `phone`). The seeded `POSITIONS` candidates are in the old shape and would render blank, but no reachable view shows them.

### `Frontend/src/leap/data.js`

Central source of both the seed dataset and the domain vocabulary. It exports:
- Config constants (`STATE_NAME`, `PARTY_NAME`, `PARTY_SHORT`, `TERM_LABEL`).
- `STAGES` / `STAGE_COLORS` — the nomination pipeline (see the stage caveat below).
- Picklists (`AP_ASSEMBLIES`, `AP_MANDAL_TOWNS`) — now dead: both screens get these from S2/S3/S4.
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

**Only one path through the wizard reaches live data.** The database holds exactly one
`proposal_consituency` row, reachable only via **ACHANTA (`constituency_id` 181) →
Achanta mandal (`tehsil_id` 658)**. Every other assembly/mandal ends at an empty
proposal-constituency select (the UI says so rather than dead-ending silently). That
row has no `local_election_body`, so the towns half of the picklist (S4/S6) yields
nothing for it. Its two positions are `President` (`max_proposals` 3, already full —
the card is disabled and S11 would 409) and `Vice-President` (open). Reservation is
`BC-GENERAL`, so only cadre with `caste_category_id = 2` can be assigned.

**Step 1 of the wizard is live, but only Panchayat has data.** S5/S6 take
`proposal_election_type_id` from the caller. Every seeded `proposal_consituency` row is
type 8 = **Panchayat**, so picking any other type correctly yields an empty
proposal-constituency select and the "No &lt;type&gt; is configured…" hint. Row 8 was
originally `is_active = NULL, order_no = NULL` — S1 hid the one type the data used;
it has since been activated. If step 1 ever shows no Panchayat option again, check
those two columns first.

**Candidate eligibility is location + reservation, enforced in two places.** A cadre may
be proposed only if their `user_address` matches the proposal constituency's own address
(assembly + mandal + panchayat, or local election body for towns) *and* satisfies its
reservation. `S12` applies it to the search pool, `S11` re-checks it on write — both via
the shared `proposal_context()` / `eligibility_filter()` in `main.py`. Change eligibility
there, not in either endpoint.

Some seeded `proposal_candidate` rows pre-date the rule and would fail it now (rows 1/6/7
are KUPPAM cadre on a VALLURU position). `S13` still returns them — it reports what *is*
assigned, and filtering it would desync the list from `S7`'s `proposed_cnt`.

**A "proposal constituency" is the local body being contested** — for this data a
*panchayat* (`VALLURU`, `constituency_id` 58153, `election_scope_id` 33), one level below
the mandal. Positions and reservation hang off it, not off the mandal, which is why
step 3 has a second select. Its label is the step-1 election type name
(`localBodyLabel`), and it auto-selects when the mandal resolves to exactly one body.

**Branding is not actually centralized.** The CLAUDE-visible intent is that `data.js` drives naming, but `Sidebar.jsx` and `Login.jsx` hardcode "Telugu Desam Party" and `index.html` hardcodes a TDP title, while `PARTY_NAME` in `data.js` says "Praja Vikas Party". Changing one does not change the others — grep for both strings.

**`AllPositions` reads `filter !== 'all'`** but `view.filter` starts `undefined`, so the "← All Positions" reset button would always show.

## Styling

`Frontend/src/leap/Leap.css` (~1440 lines) holds every class for the leap module; `Login.css` (~180) covers the login screen; `index.css` is a 17-line reset. Classes are flat and prefixed `leap-`. No CSS modules, no utility framework — add styles to the existing file matching the surrounding naming. Fonts (Montserrat, Inter) load from Google Fonts in `index.html`.

## Known dead / inert code

Mention rather than silently remove:
- `Frontend/src/leap/components/Dashboard.jsx` (~167 lines) is not imported anywhere.
- `AllPositions` and `PositionCard` are unreachable (see table above). `AllPositions`'s `onNewPosition` prop is never passed, and it renders `st.nomOnly`, a field `STAGES` entries no longer have.
- `stageCounts` and `TERM_LABEL` are exported from `data.js` but used only by the dead `Dashboard`.
- `Frontend/src/circle.svg` is used only by the login screen.
- `PositionDetail` imports `STAGES` without using it (pre-dates the backend wiring).
- `AP_ASSEMBLIES`, `AP_MANDAL_TOWNS`, `PARTY_NAME` and the seeded candidates' fields
  (`score`, `idNo`, `casteCommunityPct`, `appPoints`, …) lost their last JSX consumer
  when the candidate form was replaced by cadre search. `data.js` still exports them.
- `Backend` `S8` and `S10` are unused by the frontend; `S7` already carries the role
  names and the counts that make both redundant.
