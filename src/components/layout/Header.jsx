import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import styles from './Header.module.css'

// Colori header
const HEADER_COLORS = {
  light: {
    normal: '#f5fafc',
    scrolled: '#d7e4e7',
    text: '#171D1E',
  },
  dark: {
    normal: '#2b3133',
    scrolled: '#232f31',
    text: '#DEE3E5',
  },
}

// Colori toggle contrasto
const TOGGLE_COLORS = {
  light: {
    background: '#e9eff1',
    selected: '#545d7e',
    unselected: '#dbe1ff',
    selectedText: '#ffffff',
    unselectedText: '#545d7e',
  },
  dark: {
    background: '#1f2527',
    selected: '#bcc5eb',
    unselected: '#3d4665',
    selectedText: '#1f2527',
    unselectedText: '#bcc5eb',
  },
}

function Header({ onMenuClick }) {
  const location = useLocation()
  const { mode, contrast, toggleMode, setContrastLevel } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)

  // Mostra controlli tema su calendario-canvas-light, variante-1 e variante-2
  const showThemeControls = location.pathname.includes('calendario-canvas-light') || location.pathname.includes('variante-1') || location.pathname.includes('variante-2')

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const headerColors = HEADER_COLORS[mode]
  const toggleColors = TOGGLE_COLORS[mode]

  return (
    <header
      className={styles.header}
      style={{
        backgroundColor: isScrolled ? headerColors.scrolled : headerColors.normal,
        color: headerColors.text,
      }}
    >
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onMenuClick}
          style={{
            backgroundColor: isScrolled ? headerColors.scrolled : headerColors.normal,
            borderColor: mode === 'light' ? '#d0d7de' : '#3d4665',
            color: headerColors.text,
          }}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"></path>
          </svg>
        </button>
        <span className={styles.repoName} style={{ color: headerColors.text }}>studiorizzo</span>
      </div>

      {showThemeControls && (
        <div className={styles.right}>
          {/* Contrast selector */}
          <div
            className={styles.contrastSelector}
            style={{ backgroundColor: toggleColors.background }}
          >
            <button
              className={styles.contrastBtn}
              onClick={() => setContrastLevel('standard')}
              title="Contrasto standard"
              style={{
                backgroundColor: contrast === 'standard' ? toggleColors.selected : toggleColors.unselected,
                color: contrast === 'standard' ? toggleColors.selectedText : toggleColors.unselectedText,
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </button>
            <button
              className={styles.contrastBtn}
              onClick={() => setContrastLevel('medium')}
              title="Contrasto medio"
              style={{
                backgroundColor: contrast === 'medium' ? toggleColors.selected : toggleColors.unselected,
                color: contrast === 'medium' ? toggleColors.selectedText : toggleColors.unselectedText,
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </button>
            <button
              className={styles.contrastBtn}
              onClick={() => setContrastLevel('high')}
              title="Contrasto alto"
              style={{
                backgroundColor: contrast === 'high' ? toggleColors.selected : toggleColors.unselected,
                color: contrast === 'high' ? toggleColors.selectedText : toggleColors.unselectedText,
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </button>
          </div>

          {/* Dark/Light toggle */}
          <button
            className={styles.themeBtn}
            onClick={toggleMode}
            title={mode === 'light' ? 'Passa a tema scuro' : 'Passa a tema chiaro'}
            style={{ color: headerColors.text }}
          >
            {mode === 'light' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
              </svg>
            )}
          </button>
        </div>
      )}
    </header>
  )
}

export default Header
