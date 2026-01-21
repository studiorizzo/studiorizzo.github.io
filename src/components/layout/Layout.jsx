import { useState, cloneElement, isValidElement } from 'react'
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

  // Per variante-2, passa onMenuClick al children
  const childrenWithProps = isFullscreenPage && isValidElement(children)
    ? cloneElement(children, { onMenuClick: () => setSidebarOpen(!sidebarOpen) })
    : children

  return (
    <div className={styles.layout} style={{ backgroundColor }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`${styles.main} ${sidebarOpen ? styles.shifted : ''}`}>
        {!isFullscreenPage && <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
        <main className={`${styles.content} ${isFullscreenPage ? styles.fullscreen : ''}`}>
          {childrenWithProps}
        </main>
      </div>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}

export default Layout
