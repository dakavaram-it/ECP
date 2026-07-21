# Local Body Elections Portal

A prototype of a candidate nomination workflow for local body elections, styled as a
party internal portal.

- **Frontend** — React 18 + Vite SPA (`src/`). No router, no state library; the only
  runtime deps are `react` and `react-dom`.
- **Backend** — FastAPI + PyMySQL read-only API (`Backend/`), used to populate the
  election-type / constituency / mandal / town picklists.

Most application data is still in-memory seed data (`src/leap/data.js`) and resets on
reload. Only the picklists come from the database.

## Setup

Requires Node.js 18+ and Python 3.12+.

```bash
npm install

cd Backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
```

Create a `.env` in the project root with the MySQL connection details read by
`Backend/main.py`:

```
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

## Running

Both processes are needed — Vite proxies `/api/*` to the backend, and returns `500`
for every `/api/*` call when the backend is down.

```bash
npm run dev:api  (or)  uvicorn main:app --port 8001 --reload    # FastAPI on :8001  (Windows-only script path)
npm run dev       # Vite on 0.0.0.0:9001
```

API docs: <http://127.0.0.1:8001/docs>

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server on `0.0.0.0:9001` |
| `npm run dev:api` | uvicorn on `:8001` with reload |
| `npm run build` | production build to `dist/` |
| `npm run preview` | serve `dist/` on `0.0.0.0:9001` (also proxies `/api`) |

There is no test runner, linter, or formatter. Verification means `npm run build` plus
clicking through in the browser.

## Deployment

`./install.sh` installs deps, builds, and (re)starts the frontend under PM2 using
`ecosystem.config.cjs` (process name `portal-frontend`, `vite preview` on port 9001).
It does **not** start the backend — run that separately.

## Layout

```
src/
  App.jsx              toggles between login and the app
  Login.jsx            visual-only login; accepts any credentials
  leap/
    Leap.jsx           owns all state, acts as the ad-hoc router
    data.js            seed dataset, stage definitions, derived helpers
    api.js             /api fetch wrappers + useList hook
    components/        NewPositionModal, PositionDetail, Sidebar, ...
    Leap.css           every class for the module
Backend/
  main.py              four GET endpoints (S1–S4), see Backend/README.md
```

## Notes

- There is no authentication. `Login.jsx` accepts any username/password.
- `.env` is committed to the repository and not listed in `.gitignore`, so the
  database credentials are in git history. Rotate them and untrack the file before
  this goes anywhere public.
- `Backend/.venv/` is also tracked in git.
- Some screens (`AllPositions`, `PositionCard`) and `components/Dashboard.jsx` are
  not reachable from the current UI. See `CLAUDE.md` for the details and for the
  truncated `STAGES` pipeline caveat.
