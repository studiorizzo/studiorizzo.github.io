import { useAuth } from '../../context/AuthContext'
import styles from './Header.module.css'

function Header({ onMenuClick }) {
  const { user, logout } = useAuth()

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <h1 className={styles.title}>Dashboard</h1>
      </div>

      <div className={styles.right}>
        <span className={styles.userName}>{user?.name}</span>
        <button className={styles.logoutBtn} onClick={logout}>
          Esci
        </button>
      </div>
    </header>
  )
}

export default Header
