// src/renderer/src/hooks/useLocalStorage.ts

import { useCallback, useEffect, useState } from 'react'

/**
 * Persistente state in localStorage met JSON-serialisatie
 * en sync over browser-tabs via het `storage` event.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const readValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch (err) {
      console.warn(`useLocalStorage: kon "${key}" niet lezen`, err)
      return initialValue
    }
  }, [key, initialValue])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch (err) {
          console.warn(`useLocalStorage: kon "${key}" niet schrijven`, err)
        }
        return next
      })
    },
    [key]
  )

  useEffect(() => {
    const handler = (e: StorageEvent): void => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T)
        } catch {
          /* ignore parse errors */
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [key])

  return [storedValue, setValue]
}
