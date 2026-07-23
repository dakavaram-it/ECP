import { useEffect, useState } from 'react'

const get = async (path) => {
  const res = await fetch(`/api${path}`)
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

// FastAPI reports its own failures as {detail: "..."}; surface that text so the
// UI can show the real reason (reservation mismatch, position full, duplicate).
const post = async (path, body) => {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.detail || `${path} -> ${res.status}`)
  return data
}

export const getElectionTypes = () => get('/S1getProposalElectionTypes')
export const getAssemblies = () => get('/S2getAssemblyConstituenciesInAState')
export const getMandals = (constituencyId) =>
  get(`/S3getMandalsInAConstituency?constituency_id=${constituencyId}`)
export const getTowns = (constituencyId) =>
  get(`/S4getTownsInAConstituency?constituency_id=${constituencyId}`)
export const getProposalConstituenciesByTehsil = (constituencyId, tehsilId, electionTypeId) =>
  get(
    `/S5getProposalConstituenciesByTehsilId?constituency_id=${constituencyId}` +
      `&tehsil_id=${tehsilId}&proposal_election_type_id=${electionTypeId}`
  )
export const getProposalConstituenciesByTown = (constituencyId, townId, electionTypeId) =>
  get(
    `/S6getProposalConstituenciesByTownId?constituency_id=${constituencyId}` +
      `&town_id=${townId}&proposal_election_type_id=${electionTypeId}`
  )
export const getPositionsOverview = (proposalConstituencyId) =>
  get(`/S7getProposalPositionsOverviewByProposalConstituencyId?proposal_constituency_id=${proposalConstituencyId}`)
export const getReservation = (proposalConstituencyId) =>
  get(`/S9getProposalConstituencyReservation?proposal_constituency_id=${proposalConstituencyId}`)
export const checkPositionAvailability = (proposalPositionId) =>
  get(`/S10checkProposalPositionAvailability?proposal_position_id=${proposalPositionId}`)
export const assignCandidate = (proposalPositionId, tdpCadreId) =>
  post('/S11assignProposalCandidate', {
    proposal_position_id: proposalPositionId,
    tdp_cadre_id: tdpCadreId,
  })
export const searchCadre = (constituencyId, searchType, searchValue) =>
  get(
    `/S12cadreSearch?constituency_id=${constituencyId}&search_type=${searchType}` +
      `&search_value=${encodeURIComponent(searchValue)}`
  )
export const getProposalCandidates = (proposalPositionId) =>
  get(`/S13getProposalCandidatesByProposalPositionId?proposal_position_id=${proposalPositionId}`)

// Loads a list on mount / when deps change. Returns [] until it resolves,
// and [] again if the request fails (error is logged, not shown).
export function useList(load, deps) {
  const [items, setItems] = useState([])
  useEffect(() => {
    let cancelled = false
    if (!load) {
      setItems([])
      return
    }
    load()
      .then((data) => { if (!cancelled) setItems(data) })
      .catch((err) => { if (!cancelled) { console.error(err); setItems([]) } })
    return () => { cancelled = true }
  }, deps)
  return items
}
