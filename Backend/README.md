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
| `GET /S5getProposalConstituenciesByTehsilId` | Proposal constituencies in a mandal (enrollment_id=1) | `constituency_id`, `tehsil_id`, `proposal_election_type_id` (required) |
| `GET /S6getProposalConstituenciesByTownId` | Proposal constituencies in a town (enrollment_id=1) | `constituency_id`, `town_id`, `proposal_election_type_id` (required) |
| `GET /S7getProposalPositionsOverviewByProposalConstituencyId` | Positions with max_positions/max_proposals and proposed count | `proposal_constituency_id` (required) |
| `GET /S8getProposalPositionsByProposalConstituencyId` | Positions with role names | `proposal_constituency_id` (required) |
| `GET /S9getProposalConstituencyReservation` | Reservation for a proposal constituency | `proposal_constituency_id` (required) |
| `GET /S10checkProposalPositionAvailability` | `Available` / `Not Available` for a position | `proposal_position_id` (required) |
| `POST /S11assignProposalCandidate` | Proposes a cadre for a position after reservation + availability checks; returns the new `proposal_candidate_id` | JSON body: `proposal_position_id`, `tdp_cadre_id` |
| `GET /S12cadreSearch` | Cadre in a constituency by membership id, mobile or name | `constituency_id`, `search_type` (`MembershipId`\|`MobileNo`\|`Name`), `search_value` |
| `GET /S13getProposalCandidatesByProposalPositionId` | Cadre currently proposed for a position (`is_active = 'Y'`), same fields as S12 | `proposal_position_id` (required) |

`S11` is the only write endpoint. It rejects with `404` for an unknown position or cadre,
and `409` when the cadre's caste category or gender does not match the proposal
constituency's reservation, when the position has reached `max_proposals`, or when the
cadre is already proposed for that position. The inserted row is
`is_active = 'Y'`, `enrollment_id = 1`.

`S8` and `S10` are unused by the frontend: `S7` already returns the role names `S8`
gives, and its `max_proposals`/`proposed_cnt` pair is the same predicate `S10`
evaluates. Both remain for API consumers.

Caveats found while wiring the UI:

- `S5`/`S6` take `proposal_election_type_id` from the caller (they used to hardcode `8`).
  Row 8 is **Panchayat**, and it originally had `is_active` and `order_no` both `NULL`,
  so `S1` hid the only type the seeded data uses. It has since been activated
  (`is_active='Y'`, `order_no=8`), so step 1 of the wizard now filters for real.
  All seeded data is `proposal_election_type_id = 8`, so every other type legitimately
  returns an empty list.
- A `Name` search is `LIKE '%value%'` across the constituency and can return
  thousands of rows (~4s for a common substring); the UI renders only the first 50.
