import Calendar from '../components/calendar/Calendar'
import styles from './Dashboard.module.css'

function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <Calendar />
    </div>
  )
}

export default Dashboard
