import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

function Sidebar({ isOpen, onClose }) {
  const { isStudio } = useAuth()
  const [clientiOpen, setClientiOpen] = useState(false)
  const [scadenzeOpen, setScadenzeOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <span className={styles.logo}>Studio Rizzo</span>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className={styles.nav}>
        {isStudio() && (
          <div className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => setClientiOpen(!clientiOpen)}
            >
              <span>Clienti</span>
              <svg
                className={`${styles.chevron} ${clientiOpen ? styles.open : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {clientiOpen && (
              <div className={styles.sectionContent}>
                <div className={styles.searchWrapper}>
                  <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Cerca cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => setScadenzeOpen(!scadenzeOpen)}
          >
            <span>Scadenze</span>
            <svg
              className={`${styles.chevron} ${scadenzeOpen ? styles.open : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {scadenzeOpen && (
            <div className={styles.sectionContent}>
              <p className={styles.placeholder}>Nessuna scadenza imminente</p>
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
