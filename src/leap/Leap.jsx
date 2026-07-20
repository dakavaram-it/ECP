import { useState } from 'react'
import { POSITIONS } from './data.js'
import Sidebar from './components/Sidebar.jsx'
import AllPositions from './components/AllPositions.jsx'
import PositionDetail from './components/PositionDetail.jsx'
import NewPositionModal from './components/NewPositionModal.jsx'
import './Leap.css'

let _newId = 1000
let _candId = 5000

export default function Leap() {
  const [positions, setPositions] = useState(POSITIONS)
  const [view, setView] = useState({ name: 'newPosition' })

  const openPosition = (id) => setView({ name: 'detail', id })

  const advanceStage = (id, delta) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stageIndex: Math.max(0, p.stageIndex + delta) } : p))
    )
  }

  const createPosition = ({ kind, electionType, assembly, location, dept, title, role, seats }) => {
    _newId += 1
    const newPos = {
      id: `pos-new-${_newId}`,
      kind,
      dept,
      state: positions[0]?.state,
      level: electionType,
      assembly,
      location,
      title,
      role,
      seats,
      seatsFilled: 0,
      stageIndex: 0,
      candidates: [],
    }
    setPositions((prev) => [newPos, ...prev])
    setView({ name: 'detail', id: newPos.id })
  }

  const addCandidate = (positionId, candidate) => {
    _candId += 1
    setPositions((prev) =>
      prev.map((p) =>
        p.id === positionId ? { ...p, candidates: [...p.candidates, { ...candidate, id: `cand-${_candId}` }] } : p
      )
    )
  }

  const activePosition = view.name === 'detail' ? positions.find((p) => p.id === view.id) : null

  return (
    <div className="leap-app">
      <Sidebar />
      <main className="leap-main">
        {view.name === 'newPosition' && <NewPositionModal onCreate={createPosition} />}
        {view.name === 'positions' && (
          <AllPositions
            positions={positions}
            filter={view.filter}
            onFilterChange={(filter) => setView({ name: 'positions', filter })}
            onOpen={openPosition}
          />
        )}
        {view.name === 'detail' && activePosition && (
          <PositionDetail
            key={activePosition.id}
            position={activePosition}
            onBack={() => setView({ name: 'newPosition' })}
            onAdvance={() => advanceStage(activePosition.id, 1)}
            onRetreat={() => advanceStage(activePosition.id, -1)}
            onAddCandidate={(candidate) => addCandidate(activePosition.id, candidate)}
          />
        )}
      </main>
    </div>
  )
}
