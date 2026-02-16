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

const STORAGE_KEY = 'year-reflection-color-scheme'

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

function loadStoredScheme(): ColorScheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && VALID_SCHEMES.includes(stored as ColorScheme)) {
      return stored as ColorScheme
    }
  } catch {
    // ignore
  }
  return 'gold'
}

export function ThemeProvider({ children, userId }: ThemeProviderProps) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(loadStoredScheme)
  // Load color scheme from Firestore when user logs in
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    getUserColorScheme(userId).then((scheme) => {
      if (!cancelled && scheme && VALID_SCHEMES.includes(scheme as ColorScheme)) {
        setColorSchemeState(scheme as ColorScheme)
        try {
          localStorage.setItem(STORAGE_KEY, scheme)
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
      localStorage.setItem(STORAGE_KEY, colorScheme)
    } catch {
      // ignore
    }
  }, [colorScheme])

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
