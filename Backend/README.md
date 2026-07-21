# Backend

FastAPI + PyMySQL read-only API. Reads DB credentials from the project-root `.env`
(copy `.env.example` to `.env` and fill it in — startup fails with a message naming
the missing key otherwise).

One-time setup:

```bash
cd Backend
python -m venv .venv

.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
```

The frontend proxies `/api/*` here, so **both** processes must be running — start
them in two terminals from the project root:

```bash
cd Backend  && python -m uvicorn main:app --port 8001 --reload   # backend on :8001
cd Frontend && npm run dev                                       # frontend on :9001
```

The backend command needs the venv activated in that terminal, since it invokes plain
`python`.

If the backend is down, the Vite proxy returns `500` for every `/api/*` call.

Docs at http://127.0.0.1:8001/docs

| Endpoint | Description | Params |
|---|---|---|
| `GET /S1getProposalElectionTypes` | Proposal election types | — |
| `GET /S2getAssemblyConstituenciesInAState` | Assembly constituencies (election_type_id=2, state_id=1) | — |
| `GET /S3getMandalsInAConstituency` | Mandals in a constituency | `constituency_id` (required) |
| `GET /S4getTownsInAConstituency` | Towns in a constituency | `constituency_id` (required) |
