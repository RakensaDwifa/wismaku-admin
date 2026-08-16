import { useEffect, useState } from 'react'
import { getActiveUser, logout, SESSION_EVENT } from '../services/auth.js'

export function useAuth() {
  const [user, setUser] = useState(getActiveUser)

  useEffect(() => {
    const onSession = () => setUser(getActiveUser())
    window.addEventListener(SESSION_EVENT, onSession)
    return () => window.removeEventListener(SESSION_EVENT, onSession)
  }, [])

  return { user, logout }
}
