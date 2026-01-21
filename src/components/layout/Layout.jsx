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

  // Applica sfondo tematizzato su calendario-canvas-light e variante-1
  const isThemedPage = location.pathname.includes('calendario-canvas-light') || location.pathname.includes('variante-1')
  const backgroundColor = isThemedPage ? PAGE_COLORS[mode] : '#ffffff'

  return (
    <div className={styles.layout} style={{ backgroundColor }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`${styles.main} ${sidebarOpen ? styles.shifted : ''}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}

export default Layout
