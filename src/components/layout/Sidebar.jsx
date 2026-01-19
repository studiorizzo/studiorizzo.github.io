import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

function Sidebar({ isOpen, onClose }) {
  const { isStudio } = useAuth()
  const [clientiVisible, setClientiVisible] = useState(false)
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
        {/* Scadenze */}
        <div className={styles.section}>
          <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className={styles.navIcon}>
              <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z"></path>
            </svg>
            <span>Scadenze</span>
          </NavLink>
        </div>

        {/* Calendario CSS */}
        <div className={styles.section}>
          <NavLink to="/calendario-css" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className={styles.navIcon}>
              <path d="M1.5 1.75C1.5.784 2.284 0 3.25 0h9.5C13.716 0 14.5.784 14.5 1.75v12.5A1.75 1.75 0 0 1 12.75 16h-9.5A1.75 1.75 0 0 1 1.5 14.25V1.75ZM3.25 1.5a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-9.5ZM8 4a.75.75 0 0 1 .75.75v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5A.75.75 0 0 1 8 4Z"></path>
            </svg>
            <span>Calendario CSS</span>
          </NavLink>
        </div>

        {/* Calendario Canvas */}
        <div className={styles.section}>
          <NavLink to="/calendario-canvas" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className={styles.navIcon}>
              <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25ZM6.5 6.5v8h7.75a.25.25 0 0 0 .25-.25V6.5Zm8-1.5V1.75a.25.25 0 0 0-.25-.25H6.5V5ZM5 5V1.5H1.75a.25.25 0 0 0-.25.25V5Zm-3.5 1.5v7.75c0 .138.112.25.25.25H5v-8Z"></path>
            </svg>
            <span>Calendario Canvas</span>
          </NavLink>
        </div>

        {/* Clienti - ULTIMO */}
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
      </nav>
    </aside>
  )
}

export default Sidebar
