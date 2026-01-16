import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

function Sidebar({ isOpen, onClose }) {
  const { isStudio } = useAuth()
  const [clientiVisible, setClientiVisible] = useState(false)
  const [scadenzeVisible, setScadenzeVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>studiorizzo</div>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
          </svg>
        </button>
      </div>

      <nav className={styles.nav}>
        {isStudio() && (
          <div className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => setClientiVisible(!clientiVisible)}>
              <span className={styles.sectionTitle}>Clienti</span>
              <span className={styles.sectionIcon}>
                {clientiVisible ? (
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215Z"></path></svg>
                )}
              </span>
            </div>
            {clientiVisible && (
              <div className={styles.sectionContent}>
                <div className={styles.searchContainer}>
                  <div className={styles.searchIcon}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215Z"></path></svg>
                  </div>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Cerca cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className={styles.searchResults}></div>
              </div>
            )}
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => setScadenzeVisible(!scadenzeVisible)}>
            <span className={styles.sectionTitle}>Scadenze</span>
            <span className={styles.sectionIcon}>
              {scadenzeVisible ? (
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 9l6 6 6-6"></path></svg>
              )}
            </span>
          </div>
          {scadenzeVisible && (
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
