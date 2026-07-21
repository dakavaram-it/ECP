import { useEffect, useState } from 'react'

const get = async (path) => {
  const res = await fetch(`/api${path}`)
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

export const getElectionTypes = () => get('/S1getProposalElectionTypes')
export const getAssemblies = () => get('/S2getAssemblyConstituenciesInAState')
export const getMandals = (constituencyId) =>
  get(`/S3getMandalsInAConstituency?constituency_id=${constituencyId}`)
export const getTowns = (constituencyId) =>
  get(`/S4getTownsInAConstituency?constituency_id=${constituencyId}`)

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
