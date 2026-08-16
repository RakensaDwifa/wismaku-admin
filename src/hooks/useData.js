import { useCallback, useEffect, useRef, useState } from 'react'
import { DATA_EVENT } from '../services/auth.js'

export function useData(loader, deps = []) {
  const [data, setData] = useState(null)
  const depsKey = deps.join('|')
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  }, [loader, depsKey])

  const refresh = useCallback(async () => {
    try {
      setData(await loaderRef.current())
    } catch {
      setData([])
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(DATA_EVENT, refresh)
    return () => window.removeEventListener(DATA_EVENT, refresh)
  }, [refresh, depsKey])

  return { data, refresh }
}
