import React, { useState, useMemo } from 'react';


// Tipi di pagamento con le loro proprietà
const PAYMENT_TYPES = {
  imposte: { label: 'Imposte', icon: '⚖️', baseColor: '#ff6b6b', massMultiplier: 1.5 },
  stipendi: { label: 'Stipendi', icon: '💼', baseColor: '#4ecdc4', massMultiplier: 1.2 },
  mutui: { label: 'Mutui', icon: '🏠', baseColor: '#ffe66d', massMultiplier: 1.8 },
  fatture: { label: 'Fatture', icon: '📄', baseColor: '#95e1d3', massMultiplier: 1.0 },
  utenze: { label: 'Utenze', icon: '⚡', baseColor: '#dda0dd', massMultiplier: 0.8 },
  altro: { label: 'Altro', icon: '📌', baseColor: '#a8e6cf', massMultiplier: 0.6 },
};

// Calcola la massa gravitazionale di una cella
const calculateCellMass = (events) => {
  if (!events || events.length === 0) return 0;
  return events.reduce((total, event) => {
    const typeMultiplier = PAYMENT_TYPES[event.type]?.massMultiplier || 1;
    return total + Math.log10(event.amount + 1) * typeMultiplier * 100;
  }, 0);
};

// Dilatazione: quanto la cella si espande
const calculateDilation = (mass) => {
  const normalizedMass = Math.min(mass / 400, 1);
  const dilation = 1 + normalizedMass * 0.45; // 1.0 → 1.45
  return dilation;
};

// Componente singola cella spazio-temporale
const SpacetimeCell = ({ 
  day, 
  events, 
  isCurrentMonth, 
  isToday, 
  onClick
}) => {
  const mass = calculateCellMass(events);
  const dilation = calculateDilation(mass);
  const hasEvents = events && events.length > 0;
  
  // Intensità normalizzata 0-1
  const gravityIntensity = Math.min(mass / 400, 1);
  
  // Colore dominante basato sull'evento più pesante
  const dominantColor = useMemo(() => {
    if (!hasEvents) return '#6366f1';
    const sorted = [...events].sort((a, b) => b.amount - a.amount);
    return PAYMENT_TYPES[sorted[0].type]?.baseColor || '#6366f1';
  }, [events, hasEvents]);

  // v1.2: Calcola dimensioni del campo gravitazionale esterno
  const fieldSize = 100 + gravityIntensity * 150; // 100% → 250%

  return (
    <div
      onClick={() => isCurrentMonth && onClick(day)}
      className="spacetime-cell"
      style={{
        '--dilation': dilation,
        '--gravity': gravityIntensity,
        '--dominant-color': dominantColor,
        '--mass': mass,
        '--field-size': `${fieldSize}%`,
      }}
      data-current-month={isCurrentMonth}
      data-today={isToday}
      data-has-events={hasEvents}
      data-mass-level={mass > 400 ? 'extreme' : mass > 200 ? 'high' : mass > 50 ? 'medium' : 'low'}
    >
      {/* v1.2: Campo gravitazionale ESTERNO - unico effetto visivo della massa */}
      {hasEvents && (
        <div 
          className="gravity-field"
          style={{
            '--field-size': `${fieldSize}%`,
            '--field-color': dominantColor,
            '--field-intensity': gravityIntensity,
          }}
        />
      )}
      
      {/* Contenuto della cella */}
      <div className="cell-content">
        {/* Numero del giorno */}
        <span className="day-number">{day}</span>
        
        {/* Eventi/Pagamenti */}
        {hasEvents && (
          <div className="events-container">
            {events.slice(0, 3).map((event, idx) => (
              <div 
                key={idx} 
                className="event-marker"
                style={{ 
                  '--event-color': PAYMENT_TYPES[event.type]?.baseColor,
                }}
                title={`${PAYMENT_TYPES[event.type]?.label}: €${event.amount.toLocaleString('it-IT')}`}
              >
                <span className="event-icon">{PAYMENT_TYPES[event.type]?.icon}</span>
                <span className="event-amount">€{event.amount >= 1000 ? `${(event.amount/1000).toFixed(0)}k` : event.amount}</span>
              </div>
            ))}
            {events.length > 3 && (
              <div className="more-events">+{events.length - 3}</div>
            )}
          </div>
        )}
        

      </div>
    </div>
  );
};

// Modal per aggiungere eventi
const AddEventModal = ({ date, onClose, onAdd }) => {
  const [type, setType] = useState('fatture');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      onAdd({
        type,
        amount: parseFloat(amount),
        description,
        date,
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nuovo Pagamento</h3>
          <span className="modal-date">{date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo di Pagamento</label>
            <div className="type-selector">
              {Object.entries(PAYMENT_TYPES).map(([key, { label, icon, baseColor }]) => (
                <button
                  key={key}
                  type="button"
                  className={`type-option ${type === key ? 'selected' : ''}`}
                  onClick={() => setType(key)}
                  style={{ '--type-color': baseColor }}
                >
                  <span className="type-icon">{icon}</span>
                  <span className="type-label">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Importo (€)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              autoFocus
            />
            <div className="amount-presets">
              {[100, 500, 1000, 5000, 10000, 50000].map(preset => (
                <button key={preset} type="button" onClick={() => setAmount(preset.toString())}>
                  €{preset >= 1000 ? `${preset/1000}k` : preset}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Descrizione (opzionale)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="es. IVA trimestrale, F24..."
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn-submit" disabled={!amount}>
              Aggiungi Massa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principale del calendario
export default function SpacetimeCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return [
      // Giorno con massa estrema
      { date: new Date(year, month, 16), type: 'imposte', amount: 45000, description: 'IVA trimestrale' },
      { date: new Date(year, month, 16), type: 'imposte', amount: 12000, description: 'IRES acconto' },
      { date: new Date(year, month, 16), type: 'fatture', amount: 8500, description: 'Fornitore principale' },
      // Giorno con massa alta
      { date: new Date(year, month, 27), type: 'stipendi', amount: 25000, description: 'Dipendenti' },
      { date: new Date(year, month, 27), type: 'stipendi', amount: 8000, description: 'Collaboratori' },
      // Giorno con massa media
      { date: new Date(year, month, 28), type: 'mutui', amount: 3200, description: 'Rata mutuo ufficio' },
      // Giorni con massa bassa
      { date: new Date(year, month, 10), type: 'utenze', amount: 450, description: 'Luce e gas' },
      { date: new Date(year, month, 5), type: 'fatture', amount: 1200, description: 'Consulenza' },
      { date: new Date(year, month, 20), type: 'altro', amount: 180, description: 'Abbonamenti' },
      { date: new Date(year, month, 12), type: 'utenze', amount: 89, description: 'Telefono' },
    ];
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Calcola i giorni del mese corrente
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const days = [];
    
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonth.getDate() - i),
      });
    }
    
    const todayDate = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday: date.toDateString() === todayDate.toDateString(),
        date,
      });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }
    
    return days;
  }, [currentDate]);

  // Raggruppa eventi per data
  const eventsByDate = useMemo(() => {
    const grouped = {};
    events.forEach(event => {
      const key = event.date.toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [events]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCellClick = (day) => {
    const clickedDate = calendarDays.find(d => d.day === day && d.isCurrentMonth)?.date;
    if (clickedDate) {
      setSelectedDate(clickedDate);
      setShowModal(true);
    }
  };

  const handleAddEvent = (newEvent) => {
    setEvents([...events, newEvent]);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Exo+2:wght@300;400;500;600&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        .spacetime-calendar {
          --bg-void: #030306;
          --bg-deep: #08080d;
          --bg-surface: #0e0e16;
          --bg-cell: #121219;
          --text-primary: #e8e8f0;
          --text-secondary: #8888a0;
          --text-muted: #55556a;
          --accent-gravity: #6366f1;
          --accent-glow: #818cf8;
          --accent-intense: #a5b4fc;
          --grid-line: rgba(99, 102, 241, 0.08);
          --cell-border: rgba(136, 136, 160, 0.06);

          font-family: 'Exo 2', sans-serif;
          background: var(--bg-void);
          flex: 1;
          display: flex;
          flex-direction: column;
          color: var(--text-primary);
          position: relative;
          overflow: hidden;
          border: 1px solid #d0d7de;
        }
        
        /* Sfondo cosmico */
        .spacetime-calendar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(129, 140, 248, 0.03) 0%, transparent 50%);
          pointer-events: none;
        }
        
        /* Stelle */
        .spacetime-calendar::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 65%, rgba(255,255,255,0.25) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 55% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 15% 85%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 45%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 15%, rgba(255,255,255,0.3) 0%, transparent 100%);
          pointer-events: none;
          animation: twinkle 8s ease-in-out infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .calendar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
          overflow: hidden;
        }
        
        /* Header */
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--grid-line);
        }
        
        .nav-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-btn {
          background: var(--bg-surface);
          border: 1px solid var(--cell-border);
          color: var(--text-primary);
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-btn svg {
          width: 16px;
          height: 16px;
        }

        .nav-btn:hover {
          background: var(--accent-gravity);
          border-color: var(--accent-glow);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
        }

        .today-btn {
          background: var(--bg-surface);
          border: 1px solid var(--cell-border);
          color: var(--text-primary);
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 4px;
          margin-right: 0.5rem;
        }

        .today-btn:hover {
          background: var(--accent-gravity);
          border-color: var(--accent-glow);
        }

        .current-month {
          font-size: 1.1rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        /* Stats */
        .month-stats {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.5rem;
          padding: 1rem 1.5rem;
          background: var(--bg-surface);
          border-radius: 8px;
          border: 1px solid var(--cell-border);
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        
        .stat-value {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--accent-glow);
        }
        
        /* Weekdays header */
        .weekdays-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 8px;
          padding: 0 4px;
        }
        
        .weekday {
          text-align: center;
          padding: 0.75rem;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.65rem;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }
        
        /* Grid del calendario */
        .calendar-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(6, 1fr);
          gap: 8px;
          padding: 16px;
          background: var(--bg-deep);
          border-radius: 0;
          border-top: 1px solid var(--grid-line);
          position: relative;
          min-height: 500px;
        }
        
        /* ========================================
           v1.2: CELLA SPAZIO-TEMPORALE
           Effetti interni rimossi, solo esterni
           ======================================== */
        
        .spacetime-cell {
          background: var(--bg-cell);
          min-height: 0;
          position: relative;
          cursor: pointer;
          border-radius: 6px;
          border: 1px solid var(--cell-border);
          overflow: hidden;
          
          /* v1.2: Transizione fluida */
          transition: 
            transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.6s ease,
            border-color 0.3s ease,
            z-index 0s;
          
          /* Dilatazione tramite scale */
          transform: scale(var(--dilation, 1));
          z-index: calc(1 + var(--gravity, 0) * 100);
        }
        
        .spacetime-cell[data-current-month="false"] {
          opacity: 0.2;
          transform: scale(0.92);
        }
        
        /* Hover per TUTTE le celle del mese corrente: emergono */
        .spacetime-cell[data-current-month="true"]:hover {
          z-index: 200;
          border-color: var(--accent-glow);
          background: var(--bg-surface);
        }
        
        /* Today a riposo: differenziata */
        .spacetime-cell[data-today="true"] {
          background: rgba(99, 102, 241, 0.15);
          border-color: var(--accent-gravity);
        }
        
        /* Today hover: stesso delle altre celle */
        .spacetime-cell[data-today="true"]:hover {
          z-index: 200;
          border-color: var(--accent-glow);
          background: var(--bg-surface);
        }
        
        /* v1.2: Box-shadow ESTERNO basato sul livello di massa */
        
        .spacetime-cell[data-mass-level="low"][data-has-events="true"] {
          box-shadow: 
            0 0 15px rgba(99, 102, 241, 0.15),
            0 0 30px rgba(99, 102, 241, 0.05);
        }
        
        .spacetime-cell[data-mass-level="medium"] {
          box-shadow: 
            0 0 25px rgba(99, 102, 241, 0.25),
            0 0 50px rgba(99, 102, 241, 0.1),
            0 0 80px rgba(99, 102, 241, 0.05);
          border-color: rgba(99, 102, 241, 0.3);
        }
        
        .spacetime-cell[data-mass-level="high"] {
          box-shadow: 
            0 0 40px rgba(99, 102, 241, 0.35),
            0 0 80px rgba(99, 102, 241, 0.2),
            0 0 120px rgba(99, 102, 241, 0.1),
            0 0 160px rgba(99, 102, 241, 0.05);
          border-color: rgba(129, 140, 248, 0.5);
        }
        
        .spacetime-cell[data-mass-level="extreme"] {
          box-shadow: 
            0 0 50px rgba(99, 102, 241, 0.5),
            0 0 100px rgba(99, 102, 241, 0.35),
            0 0 150px rgba(99, 102, 241, 0.2),
            0 0 200px rgba(99, 102, 241, 0.1),
            0 0 250px rgba(99, 102, 241, 0.05);
          border-color: var(--accent-intense);
          animation: extremePulse 4s ease-in-out infinite;
        }
        
        @keyframes extremePulse {
          0%, 100% { 
            box-shadow: 
              0 0 50px rgba(99, 102, 241, 0.5),
              0 0 100px rgba(99, 102, 241, 0.35),
              0 0 150px rgba(99, 102, 241, 0.2),
              0 0 200px rgba(99, 102, 241, 0.1),
              0 0 250px rgba(99, 102, 241, 0.05);
          }
          50% { 
            box-shadow: 
              0 0 60px rgba(99, 102, 241, 0.6),
              0 0 120px rgba(99, 102, 241, 0.4),
              0 0 180px rgba(99, 102, 241, 0.25),
              0 0 240px rgba(99, 102, 241, 0.15),
              0 0 300px rgba(99, 102, 241, 0.08);
          }
        }
        
        /* ========================================
           v1.2: CAMPO GRAVITAZIONALE ESTERNO
           Gradiente radiale che esce dalla cella
           ======================================== */
        
        .gravity-field {
          position: absolute;
          top: 50%;
          left: 50%;
          width: var(--field-size, 150%);
          height: var(--field-size, 150%);
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: -1;
          border-radius: 50%;
          
          /* Gradiente radiale con colore dominante */
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--field-color, #6366f1) calc(var(--field-intensity, 0.5) * 40%), transparent) 0%,
            color-mix(in srgb, var(--field-color, #6366f1) calc(var(--field-intensity, 0.5) * 20%), transparent) 30%,
            color-mix(in srgb, var(--field-color, #6366f1) calc(var(--field-intensity, 0.5) * 10%), transparent) 50%,
            transparent 70%
          );
          
          /* Animazione pulsante */
          animation: fieldBreathe 5s ease-in-out infinite;
        }
        
        @keyframes fieldBreathe {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 0.85;
          }
        }
        
        /* ========================================
           CONTENUTO CELLA
           ======================================== */
        
        .cell-content {
          position: relative;
          z-index: 2;
          height: 100%;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
        }
        
        .day-number {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .spacetime-cell[data-today="true"] .day-number {
          color: var(--accent-glow);
          font-weight: 700;
        }
        
        .spacetime-cell[data-mass-level="high"] .day-number,
        .spacetime-cell[data-mass-level="extreme"] .day-number {
          color: var(--text-primary);
          text-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }
        
        /* Container eventi */
        .events-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-top: 0.5rem;
        }
        
        .event-marker {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 6px;
          background: rgba(0, 0, 0, 0.6);
          border-left: 3px solid var(--event-color);
          border-radius: 3px;
          font-size: 0.65rem;
          backdrop-filter: blur(4px);
          transition: all 0.2s ease;
        }
        
        .event-marker:hover {
          background: rgba(0, 0, 0, 0.85);
          transform: translateX(3px);
          box-shadow: 0 0 10px var(--event-color);
        }
        
        .event-icon {
          font-size: 0.8rem;
        }
        
        .event-amount {
          font-family: 'Orbitron', sans-serif;
          font-weight: 500;
          color: var(--event-color);
        }
        
        .more-events {
          font-size: 0.6rem;
          color: var(--text-muted);
          text-align: center;
          padding: 2px;
        }
        

        /* ========================================
           MODAL
           ======================================== */
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-content {
          background: var(--bg-deep);
          border: 1px solid var(--grid-line);
          border-radius: 12px;
          padding: 2rem;
          width: 90%;
          max-width: 480px;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-header {
          margin-bottom: 1.5rem;
        }
        
        .modal-header h3 {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }
        
        .modal-date {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        
        .form-group {
          margin-bottom: 1.25rem;
        }
        
        .form-group label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-surface);
          border: 1px solid var(--cell-border);
          border-radius: 6px;
          color: var(--text-primary);
          font-family: 'Exo 2', sans-serif;
          font-size: 1rem;
          transition: all 0.2s ease;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: var(--accent-gravity);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        
        .form-group input::placeholder {
          color: var(--text-muted);
        }
        
        .type-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        
        .type-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem;
          background: var(--bg-surface);
          border: 1px solid var(--cell-border);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-secondary);
        }
        
        .type-option:hover {
          border-color: var(--type-color);
          background: rgba(255, 255, 255, 0.02);
        }
        
        .type-option.selected {
          border-color: var(--type-color);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 
            inset 0 0 20px rgba(255, 255, 255, 0.03),
            0 0 15px color-mix(in srgb, var(--type-color) 30%, transparent);
        }
        
        .type-icon {
          font-size: 1.25rem;
        }
        
        .type-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .amount-presets {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }
        
        .amount-presets button {
          flex: 1;
          min-width: 60px;
          padding: 0.5rem;
          background: var(--bg-surface);
          border: 1px solid var(--cell-border);
          border-radius: 4px;
          color: var(--text-muted);
          font-family: 'Orbitron', sans-serif;
          font-size: 0.65rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .amount-presets button:hover {
          background: var(--accent-gravity);
          border-color: var(--accent-glow);
          color: var(--text-primary);
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .btn-cancel, .btn-submit {
          flex: 1;
          padding: 0.875rem;
          border-radius: 6px;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .btn-cancel {
          background: transparent;
          border: 1px solid var(--cell-border);
          color: var(--text-muted);
        }
        
        .btn-cancel:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
        }
        
        .btn-submit {
          background: var(--accent-gravity);
          border: none;
          color: white;
        }
        
        .btn-submit:hover:not(:disabled) {
          background: var(--accent-glow);
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
        }
        
        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Legenda */
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 1.5rem;
          padding: 1rem;
          background: var(--bg-surface);
          border-radius: 8px;
          border: 1px solid var(--cell-border);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
        
        /* Note versione */
        .version-notes {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(99, 102, 241, 0.08);
          border-radius: 8px;
          border: 1px solid rgba(99, 102, 241, 0.15);
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .version-notes h4 {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.7rem;
          color: var(--accent-glow);
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .version-notes ul {
          margin: 0;
          padding-left: 1.25rem;
        }
        
        .version-notes li {
          margin-bottom: 0.25rem;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .calendar-header {
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
          }

          .calendar-grid {
            gap: 4px;
            padding: 8px;
          }

          .cell-content {
            padding: 0.25rem;
          }

          .day-number {
            font-size: 0.7rem;
          }

          .event-marker {
            padding: 2px 4px;
          }

          .event-amount {
            display: none;
          }

          .type-selector {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
      
      <div className="spacetime-calendar">
        <div className="calendar-container">
          {/* Header */}
          <header className="calendar-header">
            <span className="current-month">
              {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </span>
            <nav className="nav-controls">
              <button className="today-btn" onClick={handleToday}>Oggi</button>
              <button className="nav-btn" onClick={handlePrevMonth}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button className="nav-btn" onClick={handleNextMonth}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </nav>
          </header>
          
          {/* Intestazione giorni */}
          <div className="weekdays-header">
            {weekDays.map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          
          {/* Griglia */}
          <div className="calendar-grid">
            {calendarDays.map((dayData, index) => (
              <SpacetimeCell
                key={index}
                day={dayData.day}
                events={eventsByDate[dayData.date.toDateString()] || []}
                isCurrentMonth={dayData.isCurrentMonth}
                isToday={dayData.isToday}
                onClick={handleCellClick}
              />
            ))}
          </div>
        </div>
        
        {/* Modal */}
        {showModal && selectedDate && (
          <AddEventModal
            date={selectedDate}
            onClose={() => setShowModal(false)}
            onAdd={handleAddEvent}
          />
        )}
      </div>
    </>
  );
}
