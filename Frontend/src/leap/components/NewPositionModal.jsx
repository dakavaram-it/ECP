import { useState } from 'react'
import { getElectionTypes, getAssemblies, getMandals, getTowns, useList } from '../api.js'

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function IconHouse() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}

function IconCity() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="4" y="9" width="6" height="11" />
      <rect x="14" y="4" width="6" height="16" />
      <path d="M17 8h.01M17 11h.01M17 14h.01M17 17h.01" />
    </svg>
  )
}

function IconRoad() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M7 20L10 4h4l3 16" />
      <path d="M12 5v3M12 11v3M12 17v2" />
    </svg>
  )
}

function IconLandscape() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="7" cy="7" r="2" />
      <path d="M3 19l6-9 4 5.5 3-4L21 19z" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconColumns() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 9l9-5 9 5" />
      <path d="M5 9v11M19 9v11" />
      <path d="M8 21v-8M12 21v-8M16 21v-8" />
      <path d="M4 21h16" />
    </svg>
  )
}

function IconTower() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="7" y="9" width="10" height="12" />
      <path d="M9 9V4h6v5" />
      <circle cx="12" cy="6.5" r="1" />
      <path d="M4 21h16" />
    </svg>
  )
}

function IconFactory() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 21V11l4 3V11l4 3V11l4 3V8h4v13z" />
      <path d="M3 21h18" />
    </svg>
  )
}

const ELECTION_TYPE_ICONS = {
  Panchayat: IconHouse,
  Ward: IconCity,
  MPTC: IconRoad,
  ZPTC: IconLandscape,
  MPP: IconGrid,
  ZP: IconColumns,
  Municipality: IconTower,
  Corporation: IconFactory,
}

const RESERVATION = 'BC - General'

const MEMBERS_TABLE = [
  { position: 'President', maxProposals: 5, filledMembers: 1, maxPositions: 1 },
  { position: 'Vice President', maxProposals: 4, filledMembers: 0, maxPositions: 1 },
]

export default function NewPositionModal({ onCreate }) {
  const [electionType, setElectionType] = useState('')
  const [assemblyId, setAssemblyId] = useState('')
  const [location, setLocation] = useState('')

  const [membersAction, setMembersAction] = useState('')

  const [role, setRole] = useState('President')
  const seats = 1

  const electionTypes = useList(getElectionTypes, [])
  const assemblies = useList(getAssemblies, [])
  const mandals = useList(assemblyId ? () => getMandals(assemblyId) : null, [assemblyId])
  const towns = useList(assemblyId ? () => getTowns(assemblyId) : null, [assemblyId])

  const assemblyName = assemblies.find((a) => String(a.constituency_id) === assemblyId)?.constituency_name || ''

  const isValid = electionType && assemblyId && location && role && seats > 0

  const step1Done = !!electionType
  const step2Done = step1Done && !!assemblyId
  const step3Done = step2Done && !!location
  const step4Done = step3Done && !!membersAction
  const step5Done = step4Done && membersAction === 'add' && !!role

  const selectElectionType = (t) => {
    setElectionType(t)
    setAssemblyId('')
    setLocation('')
    setMembersAction('')
    setRole('President')
  }

  const selectAssembly = (id) => {
    setAssemblyId(id)
    setLocation('')
  }

  const handleCreate = () => {
    if (!isValid) return
    onCreate({
      kind: 'nominated',
      electionType,
      assembly: assemblyName,
      location,
      dept: electionType,
      title: assemblyName,
      role: role.toUpperCase(),
      seats: Number(seats),
    })
  }

  return (
    <div className="leap-modal">
      <div className="leap-modal-header">
        <h2>Election Candidates Proposal</h2>
        <p>Create a new post for the local body election.</p>
      </div>

        <div className="leap-modal-step">
          <div className="leap-modal-step-header"><span className="num">1</span><b>Election Type</b><p>Select the local body election this post covers.</p></div>
          <div className="leap-chip-list">
            {electionTypes.map(({ proposal_election_type_id, election_type }) => {
              const Icon = ELECTION_TYPE_ICONS[election_type] || IconHouse
              return (
                <button
                  type="button"
                  key={proposal_election_type_id}
                  className={`leap-chip-option leap-chip-option-lg ${electionType === election_type ? 'selected' : ''}`}
                  onClick={() => selectElectionType(election_type)}
                >
                  <span className="leap-chip-icon"><Icon /></span>
                  {election_type}
                </button>
              )
            })}
          </div>
        </div>

        {step1Done && (
        <div className="leap-modal-step-row">
          <div className="leap-modal-step">
            <div className="leap-modal-step-header"><span className="num">2</span><b>Assembly</b><p>Select the assembly constituency this post covers.</p></div>
            <label>Assembly</label>
            <select value={assemblyId} onChange={(e) => selectAssembly(e.target.value)}>
              <option value="">Select…</option>
              {assemblies.map((a) => (
                <option key={a.constituency_id} value={a.constituency_id}>{a.constituency_name}</option>
              ))}
            </select>
          </div>

          {step2Done && (
          <div className="leap-modal-step">
            <div className="leap-modal-step-header"><span className="num">3</span><b>Mandal/Town/District</b><p>Narrow down to the exact local area.</p></div>
            <label>Mandal/Town/District</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">Select…</option>
              {mandals.map((m) => (
                <option key={`m-${m.tehsil_id}`} value={m.tehsil_name}>{m.tehsil_name}</option>
              ))}
              {towns.map((t) => (
                <option key={`t-${t.town_id}`} value={t.town_name}>{t.town_name}</option>
              ))}
            </select>
          </div>
          )}
        </div>
        )}

        {step3Done && (
        <div className="leap-modal-step">
          <div className="leap-modal-step-header"><span className="num">4</span><b>Reservation &amp; Members</b><p>Reservation status for this constituency.</p></div>
          <div className="leap-selected-tag">Reservation: {RESERVATION}</div>
          <div className="leap-chip-list">
            <button
              type="button"
              className={`leap-chip-option ${membersAction === 'view' ? 'selected' : ''}`}
              onClick={() => setMembersAction('view')}
            >
              View Members
            </button>
            <button
              type="button"
              className={`leap-chip-option ${membersAction === 'add' ? 'selected' : ''}`}
              onClick={() => setMembersAction('add')}
            >
              Add Members
            </button>
          </div>

          {membersAction === 'view' && (
            <table className="leap-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Max Proposals</th>
                  <th>Filled Members</th>
                  <th>Max Positions</th>
                </tr>
              </thead>
              <tbody>
                {MEMBERS_TABLE.map((row) => (
                  <tr key={row.position}>
                    <td>{row.position}</td>
                    <td>{row.maxProposals}</td>
                    <td>{row.filledMembers}</td>
                    <td>{row.maxPositions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        )}

        {step4Done && membersAction === 'add' && (
        <div className="leap-modal-step">
          <div className="leap-modal-step-header"><span className="num">5</span><b>Select Position</b><p>Choose the role for this post.</p></div>
          <label>Role</label>
          <div className="leap-position-card-list">
            {MEMBERS_TABLE.map((row) => {
              const open = row.maxPositions - row.filledMembers
              return (
                <button
                  type="button"
                  key={row.position}
                  className={`leap-position-card ${role === row.position ? 'selected' : ''}`}
                  onClick={() => setRole(row.position)}
                >
                  <span className="leap-position-card-name">{row.position}</span>
                  <span className="leap-position-card-badges">
                    <span className="leap-position-card-total">{row.maxPositions}</span>
                    <span className={`leap-position-card-open ${open === 0 ? 'zero' : ''}`}>{open} open</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        )}

        {step5Done && (
        <div className="leap-modal-footer">
          <div className="leap-modal-validation">
            <span className={electionType ? 'ok' : ''}>• Election Type {electionType ? 'selected' : 'not selected'}</span>
            <span className={assemblyId ? 'ok' : ''}>• Assembly {assemblyId ? 'selected' : 'not selected'}</span>
            <span className={location ? 'ok' : ''}>• Mandal/Town/District {location ? 'selected' : 'not selected'}</span>
            <span className={role ? 'ok' : ''}>• Position {role ? 'set' : 'not set'}</span>
          </div>
          <div className="leap-modal-actions">
            <button className="leap-create-btn" disabled={!isValid} onClick={handleCreate}>✓ Create Position</button>
          </div>
        </div>
        )}
    </div>
  )
}
