import styles from './CalendarHeader.module.css'

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

function CalendarHeader({ currentDate, onPrevMonth, onNextMonth, onToday }) {
  const month = MONTHS[currentDate.getMonth()]
  const year = currentDate.getFullYear()

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <h2 className={styles.title}>{month} {year}</h2>
      </div>

      <div className={styles.right}>
        <button className={styles.todayBtn} onClick={onToday}>
          Oggi
        </button>
        <div className={styles.navButtons}>
          <button className={styles.navBtn} onClick={onPrevMonth}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className={styles.navBtn} onClick={onNextMonth}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CalendarHeader
