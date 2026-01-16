import styles from './CalendarGrid.module.css'

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function CalendarGrid({ currentDate, scadenze, onDayClick, onScadenzaClick, canEdit }) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Get starting day (Monday = 0)
  let startingDay = firstDay.getDay() - 1
  if (startingDay < 0) startingDay = 6

  // Get days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  // Build calendar days
  const days = []

  // Previous month days
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthLastDay - i)
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    })
  }

  // Next month days
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    })
  }

  // Get scadenze for a specific date
  const getScadenzeForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return scadenze.filter(s => s.data === dateStr)
  }

  // Check if date is today
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className={styles.grid}>
      <div className={styles.weekdays}>
        {DAYS.map(day => (
          <div key={day} className={styles.weekday}>{day}</div>
        ))}
      </div>

      <div className={styles.days}>
        {days.map((dayInfo, index) => {
          const dayScadenze = getScadenzeForDate(dayInfo.date)

          return (
            <div
              key={index}
              className={`
                ${styles.day}
                ${!dayInfo.isCurrentMonth ? styles.otherMonth : ''}
                ${isToday(dayInfo.date) ? styles.today : ''}
                ${canEdit ? styles.clickable : ''}
              `}
              onClick={() => canEdit && onDayClick(dayInfo.date)}
            >
              <span className={styles.dayNumber}>{dayInfo.day}</span>

              {dayScadenze.length > 0 && (
                <div className={styles.scadenze}>
                  {dayScadenze.slice(0, 3).map(scadenza => (
                    <div
                      key={scadenza.id}
                      className={styles.scadenza}
                      onClick={(e) => {
                        e.stopPropagation()
                        onScadenzaClick(scadenza)
                      }}
                    >
                      <span className={styles.scadenzaDesc}>{scadenza.descrizione}</span>
                      <span className={styles.scadenzaAmount}>{formatCurrency(scadenza.importo)}</span>
                    </div>
                  ))}
                  {dayScadenze.length > 3 && (
                    <div className={styles.moreScadenze}>
                      +{dayScadenze.length - 3} altre
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid
