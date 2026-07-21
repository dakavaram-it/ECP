import { useState } from 'react'
import { STAGES, STAGE_COLORS, stagesFor, PARTY_NAME } from '../data.js'
import { getAssemblies, getMandals, useList } from '../api.js'

const GENDERS = ['Male', 'Female', 'Other']
const CASTE_CATEGORIES = ['OC', 'BC', 'SC', 'ST']
const CASTE_SUBCASTES = {
  OC: ['Kamma', 'Reddy', 'Kapu', 'Brahmin', 'Vaishya'],
  BC: ['Weaver community', 'Fisherman community', 'Yadava', 'Kummari'],
  SC: ['Mala', 'Madiga'],
  ST: ['Konda Reddy', 'Sugali', 'Yerukala'],
}
const OCCUPATIONS = ['Politician', 'Business', 'Farmer', 'Government Employee', 'Private Employee', 'Other']
const EDUCATIONS = ['Below 10th', '10th', 'Intermediate', 'Graduate', 'Post Graduate']
const PARTIES = [PARTY_NAME, 'Independent', 'Other']
const PARLIAMENTS = [
  'Srikakulam', 'Vizianagaram', 'Visakhapatnam', 'Anakapalli', 'Kakinada', 'Amalapuram',
  'Rajahmundry', 'Narasapuram', 'Eluru', 'Machilipatnam', 'Vijayawada', 'Guntur',
  'Narasaraopet', 'Bapatla', 'Ongole', 'Nandyal', 'Kurnool', 'Anantapur',
  'Hindupur', 'Kadapa', 'Nellore', 'Chittoor', 'Rajampet', 'Tirupati',
]

const EMPTY_CANDIDATE_FORM = {
  name: '', mobile: '', gender: '', age: '', dob: '',
  casteCategory: '', casteSub: '', occupation: '', education: '', party: '',
  parliament: '', assembly: '', mandal: '',
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14.2c2.4.3 4.5 2.3 4.5 5.3" />
    </svg>
  )
}

function initials(name) {
  return name
    .replace(/^[A-Z]\.\s*/, '')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function CandidateCard({ candidate, role }) {
  return (
    <div className="leap-candidate-card">
      <div className="leap-candidate-top">
        <span className="leap-candidate-avatar">{initials(candidate.name)}</span>
        <div className="leap-candidate-headline">
          <span className="leap-candidate-score">{candidate.score}<em>SCORE</em></span>
          {candidate.status && <span className="leap-candidate-status">✓ {candidate.status}</span>}
          <div className="leap-candidate-name">{candidate.name}</div>
          <div className="leap-candidate-considered">Considered for <b>{role}</b></div>
          <div className="leap-candidate-contact">
            <span>{candidate.idNo}</span>
            <span>📞 {candidate.phone}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PositionDetail({ position, onBack, onAdvance, onRetreat, onAddCandidate }) {
  const stages = stagesFor(position.kind)
  const [viewStage, setViewStage] = useState(position.stageIndex)
  const stage = stages[viewStage] || stages[stages.length - 1]
  const isCurrent = viewStage === position.stageIndex
  const shortlisted = position.candidates.filter((c) => !c.status).length

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState(EMPTY_CANDIDATE_FORM)

  const assemblies = useList(getAssemblies, [])
  const mandals = useList(form.assembly ? () => getMandals(form.assembly) : null, [form.assembly])
  const assemblyName = assemblies.find((a) => String(a.constituency_id) === form.assembly)?.constituency_name || ''

  const openCreateModal = () => setShowCreateModal(true)
  const closeCreateModal = () => {
    setShowCreateModal(false)
    setForm(EMPTY_CANDIDATE_FORM)
  }

  const updateForm = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'casteCategory') next.casteSub = ''
      if (field === 'assembly') next.mandal = ''
      return next
    })
  }

  const handleCreateCandidate = () => {
    if (!form.name.trim()) return
    onAddCandidate({
      name: form.name.trim(),
      score: 0,
      status: null,
      idNo: `MEM-${Math.floor(100000 + Math.random() * 900000)}`,
      phone: form.mobile,
      gender: form.gender || 'Male',
      age: form.age ? Number(form.age) : undefined,
      dob: form.dob,
      caste: form.casteCategory ? `${form.casteCategory}${form.casteSub ? ' · ' + form.casteSub : ''}` : '',
      occupation: form.occupation || 'Politician',
      education: form.education || 'Graduate',
      parliament: form.parliament,
      assembly: assemblyName,
      mandal: form.mandal,
      casteCommunityPct: 0,
      memberSince: new Date().getFullYear(),
      renewals: 0,
      appPoints: 0,
      stateRank: '-',
      constituencyRank: '-',
      totalCount: 0,
      totalPosts: 0,
      totalEvents: 0,
    })
    closeCreateModal()
  }

  return (
    <div className="leap-view">
      <div className="leap-breadcrumb">
        <button onClick={onBack}>← Back</button>
      </div>

      <div className="leap-detail-header">
        <div>
          <h1>{position.title}</h1>
          <p>{position.kind === 'nominated' ? 'Board' : 'Committee'} · {position.level} · {position.state} · {1} position · {position.seats} seat{position.seats > 1 ? 's' : ''}</p>
          {(position.assembly || position.location) && (
            <p className="leap-detail-location">
              {[
                position.assembly && `${position.assembly} Assembly`,
                position.location,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="leap-position-tab">
        <span className="leap-position-tab-label">POSITIONS</span>
        <span className="leap-position-tab-chip">{position.role} · {position.seats} seat{position.seats > 1 ? 's' : ''} · {position.candidates.length} cand <b>{String(position.stageIndex + 1).padStart(2, '0')}</b></span>
      </div>

      {stage.key === 'profiles' && (
        <div className="leap-detail-info-grid">
          <div><span>POSITION</span><b>{position.role}</b></div>
          <div><span>SEATS</span><b>{position.seats}</b></div>
          <div><span>CANDIDATES ADDED</span><b>{position.candidates.length}</b></div>
          <div><span>COMMITTEE</span><b>{position.title}</b></div>
          <div><span>TYPE</span><b>{position.kind === 'nominated' ? 'Board' : 'Committee'}</b></div>
          <div><span>SUB-TYPE</span><b>{position.dept}</b></div>
          <div><span>LEVEL</span><b>{position.level} · {position.state}</b></div>
          <div><span>STATUS</span><b>{position.stageIndex === 0 ? 'DRAFT' : 'IN REVIEW'}</b></div>
          <div><span>LAST UPDATED</span><b>Recently</b></div>
          <div>
            <span>ADD CANDIDATES</span>
            <div className="leap-add-candidates-btns">
              <button type="button" className="leap-chip-btn-outline mid" onClick={openCreateModal}>+ Add Profile</button>
            </div>
          </div>
        </div>
      )}

      <div className="leap-stage-tabs">
        {stages.map((st, i) => (
          <button
            key={st.key}
            className={`leap-stage-tab ${i === viewStage ? 'selected' : ''} ${i > position.stageIndex ? 'disabled' : ''}`}
            style={i <= position.stageIndex ? { borderColor: STAGE_COLORS[i] } : undefined}
            disabled={i > position.stageIndex}
            onClick={() => setViewStage(i)}
            title={st.team}
          >
            {i < position.stageIndex && <span className="check">✓</span>}
            {st.full}
          </button>
        ))}
      </div>

      <div className="leap-stage-actions">
        <span className="leap-seats-badge">S: {position.seats}</span>
        <button className="leap-btn-secondary" disabled={position.stageIndex === 0} onClick={onRetreat}>← Back</button>
        <button className="leap-btn-primary" disabled={position.stageIndex >= stages.length - 1} onClick={onAdvance}>
          Move to Step {String(position.stageIndex + 2).padStart(2, '0')} →
        </button>
      </div>

      {stage.key === 'profiles' ? (
        <>
          <div className="leap-mapped-candidates-label">MAPPED CANDIDATES</div>

          {position.candidates.length === 0 ? (
            <div className="leap-candidates-empty">
              <div className="leap-candidates-empty-icon"><IconPeople /></div>
              <div className="leap-candidates-empty-title">No candidates added yet</div>
              <div className="leap-candidates-empty-sub">Add cadre members to start building this position.</div>
              <div className="leap-candidates-empty-actions">
                <button type="button" className="leap-btn-add-candidates" onClick={openCreateModal}>+ Add Profile</button>
              </div>
            </div>
          ) : (
            <div className="leap-candidate-list">
              {position.candidates.map((c) => (
                <CandidateCard key={c.id} candidate={c} role={position.role} />
              ))}
            </div>
          )}

          {showCreateModal && (
            <div className="leap-modal-overlay" onClick={closeCreateModal}>
              <div className="leap-create-candidate-modal" onClick={(e) => e.stopPropagation()}>
                <div className="leap-modal-title-row">
                  <div>
                    <h3>Add Profile</h3>
                    <p>Add a new candidate to this position</p>
                  </div>
                  <button type="button" className="leap-modal-close" onClick={closeCreateModal}>✕</button>
                </div>

                <div className="leap-create-candidate-grid">
                  <div>
                    <label>NAME</label>
                    <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <label>MOBILE NO</label>
                    <input value={form.mobile} onChange={(e) => updateForm('mobile', e.target.value)} placeholder="10-digit mobile" />
                  </div>
                  <div>
                    <label>GENDER</label>
                    <select value={form.gender} onChange={(e) => updateForm('gender', e.target.value)}>
                      <option value="">Select…</option>
                      {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>AGE</label>
                    <input type="number" min="18" value={form.age} onChange={(e) => updateForm('age', e.target.value)} placeholder="Age" />
                  </div>
                  <div>
                    <label>DATE OF BIRTH</label>
                    <input type="date" value={form.dob} onChange={(e) => updateForm('dob', e.target.value)} />
                  </div>
                  <div>
                    <label>CASTE CATEGORY</label>
                    <select value={form.casteCategory} onChange={(e) => updateForm('casteCategory', e.target.value)}>
                      <option value="">Select category…</option>
                      {CASTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>CASTE / SUB-CASTE</label>
                    <select
                      value={form.casteSub}
                      onChange={(e) => updateForm('casteSub', e.target.value)}
                      disabled={!form.casteCategory}
                    >
                      <option value="">{form.casteCategory ? 'Select…' : 'Select a category first'}</option>
                      {(CASTE_SUBCASTES[form.casteCategory] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>OCCUPATION</label>
                    <select value={form.occupation} onChange={(e) => updateForm('occupation', e.target.value)}>
                      <option value="">Select occupation…</option>
                      {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>EDUCATION</label>
                    <select value={form.education} onChange={(e) => updateForm('education', e.target.value)}>
                      <option value="">Select education…</option>
                      {EDUCATIONS.map((e2) => <option key={e2} value={e2}>{e2}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>PARTY</label>
                    <select value={form.party} onChange={(e) => updateForm('party', e.target.value)}>
                      <option value="">Select party…</option>
                      {PARTIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>PARLIAMENT</label>
                    <select value={form.parliament} onChange={(e) => updateForm('parliament', e.target.value)}>
                      <option value="">Select parliament…</option>
                      {PARLIAMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>ASSEMBLY</label>
                    <select value={form.assembly} onChange={(e) => updateForm('assembly', e.target.value)}>
                      <option value="">Select assembly…</option>
                      {assemblies.map((a) => (
                        <option key={a.constituency_id} value={a.constituency_id}>{a.constituency_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>MANDAL</label>
                    <select
                      value={form.mandal}
                      onChange={(e) => updateForm('mandal', e.target.value)}
                      disabled={!form.assembly}
                    >
                      <option value="">{form.assembly ? 'Select…' : 'Select an assembly first'}</option>
                      {mandals.map((m) => (
                        <option key={m.tehsil_id} value={m.tehsil_name}>{m.tehsil_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="leap-modal-actions-row">
                  <button type="button" className="leap-btn-secondary" onClick={closeCreateModal}>Cancel</button>
                  <button type="button" className="leap-btn-primary" disabled={!form.name.trim()} onClick={handleCreateCandidate}>
                    Add Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {isCurrent && (
            <div className="leap-info-banner">
              {position.candidates.length} candidate{position.candidates.length !== 1 ? 's' : ''} assigned for <b>{position.role}</b>.
              {position.stageIndex < stages.length - 1
                ? <> Review the list below, then click <b>&quot;Move to Step {String(position.stageIndex + 2).padStart(2, '0')}&quot;</b> to advance.</>
                : <> This is the final stage.</>}
            </div>
          )}

          {!isCurrent && (
            <div className="leap-info-banner muted">Viewing stage &quot;{stage.full}&quot; — assigned to {stage.team}.</div>
          )}

          <div className="leap-candidate-list">
            {position.candidates.length === 0 && <div className="leap-empty">No candidates added yet.</div>}
            {position.candidates.map((c) => (
              <CandidateCard key={c.id} candidate={c} role={position.role} />
            ))}
          </div>

          {shortlisted > 0 && position.candidates.length > 0 && (
            <div className="leap-detail-footnote">{shortlisted} candidate{shortlisted !== 1 ? 's' : ''} still shortlisted, awaiting decision.</div>
          )}
        </>
      )}
    </div>
  )
}
