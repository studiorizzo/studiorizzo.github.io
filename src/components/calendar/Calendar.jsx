import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'
import ScadenzaModal from './ScadenzaModal'
import styles from './Calendar.module.css'

// Demo data - will be replaced with real data source
const demoScadenze = [
  { id: '1', data: '2024-02-10', descrizione: 'Scadenza IVA', importo: 10000, clienteId: 'c1', clienteNome: 'Azienda Alfa' },
  { id: '2', data: '2024-02-10', descrizione: 'Mutuo', importo: 1500, clienteId: 'c1', clienteNome: 'Azienda Alfa' },
  { id: '3', data: '2024-02-15', descrizione: 'Rateizzazione cartelle', importo: 2500, clienteId: 'c2', clienteNome: 'Ditta Beta' },
  { id: '4', data: '2024-02-20', descrizione: 'F24', importo: 3200, clienteId: 'c1', clienteNome: 'Azienda Alfa' },
  { id: '5', data: '2024-02-28', descrizione: 'INPS', importo: 800, clienteId: 'c2', clienteNome: 'Ditta Beta' },
]

function Calendar() {
  const { user, isStudio } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedScadenza, setSelectedScadenza] = useState(null)

  // Filter scadenze based on user role
  const scadenze = isStudio()
    ? demoScadenze
    : demoScadenze.filter(s => s.clienteId === user?.clienteId)

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (date) => {
    if (isStudio()) {
      setSelectedDate(date)
      setSelectedScadenza(null)
      setModalOpen(true)
    }
  }

  const handleScadenzaClick = (scadenza) => {
    if (isStudio()) {
      setSelectedScadenza(scadenza)
      setSelectedDate(null)
      setModalOpen(true)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedDate(null)
    setSelectedScadenza(null)
  }

  const handleSaveScadenza = (data) => {
    console.log('Save scadenza:', data)
    // TODO: Implement save logic
    handleModalClose()
  }

  return (
    <div className={styles.calendar}>
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
      <CalendarGrid
        currentDate={currentDate}
        scadenze={scadenze}
        onDayClick={handleDayClick}
        onScadenzaClick={handleScadenzaClick}
        canEdit={isStudio()}
      />
      {modalOpen && (
        <ScadenzaModal
          date={selectedDate}
          scadenza={selectedScadenza}
          onClose={handleModalClose}
          onSave={handleSaveScadenza}
        />
      )}
    </div>
  )
}

export default Calendar
