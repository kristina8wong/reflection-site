import {
  createContext,
  useContext,
  useState,
  useLayoutEffect,
  ReactNode
} from 'react'

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

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(loadStoredScheme)

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
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
