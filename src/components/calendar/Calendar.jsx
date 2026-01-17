import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'
import ScadenzaModal from './ScadenzaModal'
import styles from './Calendar.module.css'

function Calendar() {
  const { user, isStudio } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scadenze, setScadenze] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedScadenza, setSelectedScadenza] = useState(null)

  // Filter scadenze based on user role
  const filteredScadenze = isStudio()
    ? scadenze
    : scadenze.filter(s => s.clienteId === user?.clienteId)

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
    if (data.id) {
      // Modifica scadenza esistente
      setScadenze(prev => prev.map(s =>
        s.id === data.id ? { ...s, ...data } : s
      ))
    } else {
      // Nuova scadenza
      const newScadenza = {
        ...data,
        id: Date.now().toString()
      }
      setScadenze(prev => [...prev, newScadenza])
    }
    handleModalClose()
  }

  const handleDeleteScadenza = (id) => {
    setScadenze(prev => prev.filter(s => s.id !== id))
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
        scadenze={filteredScadenze}
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
          onDelete={selectedScadenza ? handleDeleteScadenza : null}
        />
      )}
    </div>
  )
}

export default Calendar
