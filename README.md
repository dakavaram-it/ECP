# Local Body Elections Portal

A prototype of a candidate nomination workflow for local body elections, styled as a
party internal portal.

- **`Frontend/`** — React 18 + Vite SPA. No router, no state library; the only
  runtime deps are `react` and `react-dom`.
- **`Backend/`** — FastAPI + PyMySQL read-only API, used to populate the
  election-type / constituency / mandal / town picklists.

Most application data is still in-memory seed data (`Frontend/src/leap/data.js`) and
resets on reload. Only the picklists come from the database.

## Setup

Requires Node.js 18+ and Python 3.12+. Run these from the project root.

```bash
cd Frontend && npm install && cd ..

cd Backend
python -m venv .venv
```

Activate the venv, then install the Python deps:

```bash
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
```

Copy `.env.example` to `.env` in the **project root** and fill in your MySQL
connection details. `Backend/main.py` reads it at startup and exits with a message
naming the missing key if it is absent.

## Running

Two terminals. Both processes are needed — Vite proxies `/api/*` to the backend and
returns `500` for every `/api/*` call when the backend is down.

```bash
# terminal 1 — backend on :8001, with the venv activated
cd Backend
python -m uvicorn main:app --port 8001 --reload

# terminal 2 — frontend on 0.0.0.0:9001
cd Frontend
npm run dev
```

The backend command uses whichever Python is first on your PATH, so activate the venv
in that terminal first — or call the venv interpreter directly:
`./.venv/Scripts/python.exe -m uvicorn ...` (`./.venv/bin/python` on macOS/Linux).

API docs: <http://127.0.0.1:8001/docs>

npm scripts, all run from `Frontend/`:

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server on `0.0.0.0:9001` |
| `npm run build` | production build to `Frontend/dist/` |
| `npm run preview` | serve `dist/` on `0.0.0.0:9001` (also proxies `/api`) |

There is no test runner, linter, or formatter. Verification means `npm run build` plus
clicking through in the browser.

## Deployment

Run `./install.sh` **from `Frontend/`**. It installs deps, builds, and (re)starts the
frontend under PM2 using `ecosystem.config.cjs` (process name `portal-frontend`,
`vite preview` on port 9001). It does **not** start the backend — run that separately.

## Layout

```
Frontend/
  package.json         npm scripts; run them from here
  vite.config.js       dev/preview server on :9001, proxies /api to :8001
  install.sh           PM2 deploy for the frontend
  src/
    App.jsx            toggles between login and the app
    Login.jsx          visual-only login; accepts any credentials
    leap/
      Leap.jsx         owns all state, acts as the ad-hoc router
      data.js          seed dataset, stage definitions, derived helpers
      api.js           /api fetch wrappers + useList hook
      components/      NewPositionModal, PositionDetail, Sidebar, ...
      Leap.css         every class for the module
Backend/
  main.py              four GET endpoints (S1–S4), see Backend/README.md
.env                   DB credentials, read by Backend/main.py
```

## Notes

- There is no authentication. `Login.jsx` accepts any username/password.
- `.env` is committed to this repository, so anyone with read access has the database
  credentials.
- Some screens (`AllPositions`, `PositionCard`) and `components/Dashboard.jsx` are
  not reachable from the current UI. See `CLAUDE.md` for the details and for the
  truncated `STAGES` pipeline caveat.
