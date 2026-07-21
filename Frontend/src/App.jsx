import { useState } from 'react'
import Login from './Login.jsx'
import Leap from './leap/Leap.jsx'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  return loggedIn ? <Leap /> : <Login onLoginSuccess={() => setLoggedIn(true)} />
}
