import { useState } from 'react'
import { POSITIONS } from './data.js'
import Sidebar from './components/Sidebar.jsx'
import AllPositions from './components/AllPositions.jsx'
import PositionDetail from './components/PositionDetail.jsx'
import NewPositionModal from './components/NewPositionModal.jsx'
import './Leap.css'

let _newId = 1000

export default function Leap() {
  const [positions, setPositions] = useState(POSITIONS)
  const [view, setView] = useState({ name: 'newPosition' })

  const openPosition = (id) => setView({ name: 'detail', id })

  const advanceStage = (id, delta) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stageIndex: Math.max(0, p.stageIndex + delta) } : p))
    )
  }

  const createPosition = ({
    kind, electionType, assembly, assemblyId, location, dept, title, role, seats,
    proposalConstituencyId, proposalPositionId, maxProposals, reservation,
  }) => {
    _newId += 1
    const newPos = {
      id: `pos-new-${_newId}`,
      kind,
      dept,
      state: positions[0]?.state,
      level: electionType,
      assembly,
      assemblyId,
      location,
      title,
      role,
      seats,
      seatsFilled: 0,
      stageIndex: 0,
      candidates: [],
      proposalConstituencyId,
      proposalPositionId,
      maxProposals,
      reservation,
    }
    setPositions((prev) => [newPos, ...prev])
    setView({ name: 'detail', id: newPos.id })
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
          />
        )}
      </main>
    </div>
  )
}
