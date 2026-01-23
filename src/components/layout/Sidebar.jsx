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
        {/* Calendario 3D */}
        <div className={styles.section}>
          <NavLink to="/calendario-3d" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className={styles.navIcon}>
              <path d="M8 0L1 4v8l7 4 7-4V4L8 0zm0 1.5L13.5 4.5 8 7.5 2.5 4.5 8 1.5zM2 5.5l5.5 3v5.5L2 11V5.5zm6.5 8.5V8.5l5.5-3V11l-5.5 3z"></path>
            </svg>
            <span>Calendario 3D</span>
          </NavLink>
        </div>

        {/* Calendario 2D */}
        <div className={styles.section}>
          <NavLink to="/calendario-2d" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className={styles.navIcon}>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.25-11.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0zm3 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0zm-6 3a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0zm3 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0zm3 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0zm-4.5 3a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0zm3 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0z"></path>
            </svg>
            <span>Calendario 2D</span>
          </NavLink>
        </div>

        {/* Variante 1 */}
        <div className={styles.section}>
          <NavLink to="/variante-1" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className={styles.navIcon}>
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"></path>
            </svg>
            <span>Variante 1</span>
          </NavLink>
        </div>

        {/* Variante 2 - Möbius */}
        <div className={styles.section}>
          <NavLink to="/variante-2" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className={styles.navIcon}>
              <path d="M5.5 4.5C3.5 4.5 2 6 2 8s1.5 3.5 3.5 3.5c1.2 0 2.2-.6 2.8-1.5h-.6c-.5.6-1.3 1-2.2 1C4.1 11 3 9.9 3 8s1.1-3 2.5-3c.9 0 1.7.4 2.2 1h.6c-.6-.9-1.6-1.5-2.8-1.5zm5 0c-1.2 0-2.2.6-2.8 1.5h.6c.5-.6 1.3-1 2.2-1C11.9 5 13 6.1 13 8s-1.1 3-2.5 3c-.9 0-1.7-.4-2.2-1h-.6c.6.9 1.6 1.5 2.8 1.5 2 0 3.5-1.5 3.5-3.5s-1.5-3.5-3.5-3.5z"></path>
            </svg>
            <span>Variante 2</span>
          </NavLink>
        </div>

        {/* Scadenze */}
        <div className={styles.section}>
          <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className={styles.navIcon}>
              <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z"></path>
            </svg>
            <span>Scadenze</span>
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

        {/* Calendario Canvas chiaro */}
        <div className={styles.section}>
          <NavLink to="/calendario-canvas-light" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className={styles.navIcon}>
              <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm5.657-9.157a.75.75 0 0 0-1.06-1.06l-.354.353a.75.75 0 0 0 1.061 1.06l.353-.353Zm-9.193 9.193a.75.75 0 0 0-1.06-1.06l-.354.353a.75.75 0 0 0 1.06 1.06l.354-.353ZM8 0a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-1.5 0v-.5A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 3 8Zm-.464-4.464a.75.75 0 0 0 1.06-1.06l-.353-.354a.75.75 0 0 0-1.06 1.06l.353.354Zm9.193 9.193a.75.75 0 0 0 1.06-1.06l-.353-.354a.75.75 0 0 0-1.06 1.06l.353.354ZM8 14a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-1.5 0v-.5A.75.75 0 0 1 8 14Zm5-6a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 13 8Z"></path>
            </svg>
            <span>Calendario Canvas chiaro</span>
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
