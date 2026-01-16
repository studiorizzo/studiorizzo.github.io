import { useState, useEffect } from 'react'
import styles from './ScadenzaModal.module.css'

function ScadenzaModal({ date, scadenza, onClose, onSave }) {
  const [formData, setFormData] = useState({
    descrizione: '',
    importo: '',
    clienteId: '',
    data: ''
  })

  useEffect(() => {
    if (scadenza) {
      setFormData({
        descrizione: scadenza.descrizione,
        importo: scadenza.importo.toString(),
        clienteId: scadenza.clienteId,
        data: scadenza.data
      })
    } else if (date) {
      setFormData(prev => ({
        ...prev,
        data: date.toISOString().split('T')[0]
      }))
    }
  }, [scadenza, date])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      importo: parseFloat(formData.importo) || 0,
      id: scadenza?.id
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {scadenza ? 'Modifica Scadenza' : 'Nuova Scadenza'}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Data</label>
            <input
              type="date"
              name="data"
              value={formData.data}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descrizione</label>
            <input
              type="text"
              name="descrizione"
              value={formData.descrizione}
              onChange={handleChange}
              className={styles.input}
              placeholder="Es. Scadenza IVA"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Importo (EUR)</label>
            <input
              type="number"
              name="importo"
              value={formData.importo}
              onChange={handleChange}
              className={styles.input}
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Cliente</label>
            <select
              name="clienteId"
              value={formData.clienteId}
              onChange={handleChange}
              className={styles.input}
              required
            >
              <option value="">Seleziona cliente</option>
              <option value="c1">Azienda Alfa</option>
              <option value="c2">Ditta Beta</option>
            </select>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className={styles.saveBtn}>
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScadenzaModal
