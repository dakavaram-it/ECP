# Backend

FastAPI + PyMySQL read-only API. Reads DB credentials from the project-root `.env`.

One-time setup:

```bash
cd Backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
```

The frontend proxies `/api/*` here, so **both** processes must be running — start
them in two terminals from the project root:

```bash
npm run dev:api   # backend on :8001
npm run dev       # frontend on :9001
```

If the backend is down, the Vite proxy returns `500` for every `/api/*` call.

Docs at http://127.0.0.1:8001/docs

| Endpoint | Description | Params |
|---|---|---|
| `GET /S1` | Proposal election types | — |
| `GET /S2` | Assembly constituencies (election_type_id=2, state_id=1) | — |
| `GET /S3` | Mandals in a constituency | `constituency_id` (required) |
| `GET /S4` | Towns in a constituency | `constituency_id` (required) |
