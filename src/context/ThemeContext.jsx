import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light') // 'light' | 'dark'
  const [contrast, setContrast] = useState('standard') // 'standard' | 'medium' | 'high'

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setContrastLevel = (level) => {
    setContrast(level)
  }

  // Applica la classe al body
  useEffect(() => {
    const root = document.documentElement

    // Rimuovi tutte le classi tema
    root.classList.remove('light', 'light-medium-contrast', 'light-high-contrast')
    root.classList.remove('dark', 'dark-medium-contrast', 'dark-high-contrast')

    // Aggiungi la classe corrente
    let themeClass = mode
    if (contrast === 'medium') {
      themeClass = `${mode}-medium-contrast`
    } else if (contrast === 'high') {
      themeClass = `${mode}-high-contrast`
    }

    root.classList.add(themeClass)
  }, [mode, contrast])

  return (
    <ThemeContext.Provider value={{ mode, contrast, toggleMode, setContrastLevel }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
