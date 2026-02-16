import {
  createContext,
  useContext,
  useState,
  useLayoutEffect,
  useEffect,
  ReactNode
} from 'react'
import { getUserColorScheme, saveUserColorScheme } from '../firestore-storage'

export type ColorScheme =
  | 'gold'
  | 'red-green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'rose'
  | 'coral'

const STORAGE_KEY_PREFIX = 'year-reflection-color-scheme'

function getStorageKey(userId?: string): string {
  return userId ? `${STORAGE_KEY_PREFIX}-${userId}` : STORAGE_KEY_PREFIX
}

const VALID_SCHEMES: ColorScheme[] = [
  'gold',
  'red-green',
  'teal',
  'blue',
  'purple',
  'rose',
  'coral',
]

interface ThemeContextType {
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
  userId?: string
}

function loadStoredScheme(userId?: string): ColorScheme {
  try {
    const key = getStorageKey(userId)
    const stored = localStorage.getItem(key)
    if (stored && VALID_SCHEMES.includes(stored as ColorScheme)) {
      return stored as ColorScheme
    }
  } catch {
    // ignore
  }
  return 'gold'
}

export function ThemeProvider({ children, userId }: ThemeProviderProps) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => loadStoredScheme(userId))
  // Load color scheme from Firestore when user logs in; use per-user localStorage as fallback
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    // First try per-user localStorage (instant, works offline)
    const stored = loadStoredScheme(userId)
    if (stored !== 'gold') {
      setColorSchemeState(stored)
    }
    getUserColorScheme(userId).then((scheme) => {
      if (!cancelled && scheme && VALID_SCHEMES.includes(scheme as ColorScheme)) {
        setColorSchemeState(scheme as ColorScheme)
        try {
          localStorage.setItem(getStorageKey(userId), scheme)
        } catch {
          // ignore
        }
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [userId])

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', colorScheme)
    try {
      if (userId) {
        localStorage.setItem(getStorageKey(userId), colorScheme)
      }
    } catch {
      // ignore
    }
  }, [colorScheme, userId])

  function setColorScheme(scheme: ColorScheme) {
    setColorSchemeState(scheme)
    if (userId) {
      saveUserColorScheme(userId, scheme).catch(() => {
        // ignore - localStorage still saved
      })
    }
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
