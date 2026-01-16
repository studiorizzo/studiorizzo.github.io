import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import styles from './Layout.module.css'

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={styles.layout}>
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
