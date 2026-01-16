import styles from './Header.module.css'

function Header({ onMenuClick }) {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <button className={styles.menuBtn} onClick={onMenuClick}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"></path>
          </svg>
        </button>
        <span className={styles.repoName}>studiorizzo</span>
      </div>
    </header>
  )
}

export default Header
