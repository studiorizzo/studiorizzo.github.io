import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import Sidebar from './Sidebar'
import Header from './Header'
import styles from './Layout.module.css'

// Colori sfondo pagina (uguali all'header)
const PAGE_COLORS = {
  light: '#f5fafc',
  dark: '#2b3133',
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { mode } = useTheme()

  // Variante-2 è una pagina fullscreen senza header
  const isFullscreenPage = location.pathname.includes('variante-2')

  // Applica sfondo tematizzato su calendario-canvas-light, variante-1 e variante-2
  const isThemedPage = location.pathname.includes('calendario-canvas-light') || location.pathname.includes('variante-1') || location.pathname.includes('variante-2')
  const backgroundColor = isThemedPage ? PAGE_COLORS[mode] : '#ffffff'

  const btnBg = mode === 'dark' ? '#0E1416' : '#F5FAFC'
  const btnColor = mode === 'dark' ? '#DEE3E5' : '#171D1E'
  const borderColor = mode === 'dark' ? '#3d4665' : '#d0d7de'

  return (
    <div className={styles.layout} style={{ backgroundColor }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`${styles.main} ${sidebarOpen ? styles.shifted : ''}`}>
        {!isFullscreenPage && <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
        <main className={`${styles.content} ${isFullscreenPage ? styles.fullscreen : ''}`}>
          {children}
        </main>
      </div>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Floating menu button for fullscreen pages */}
      {isFullscreenPage && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            padding: 0,
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            backgroundColor: btnBg,
            color: btnColor,
            cursor: 'pointer',
            zIndex: 100,
          }}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"></path>
          </svg>
        </button>
      )}
    </div>
  )
}

export default Layout
