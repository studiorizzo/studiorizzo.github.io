import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

/**
 * SPACETIME CALENDAR v5.9
 * 
 * Nuova logica: redistribuzione proporzionale dell'area
 * - Area totale costante (come universo finito di Einstein)
 * - Celle vuote hanno massa basata sulla media degli importi
 * - Nessun limite artificiale, le proporzioni derivano dalle masse
 */

const VERSION = '5.9.6';

const CONFIG = {
  cols: 7,
  rows: 6,
  canvasWidth: 980,
  canvasHeight: 680,
  padding: 30,
  headerHeight: 35,
  
  emptyMassMultiplier: 0.9, // Moltiplicatore per massa celle vuote
  animationSpeed: 0.1,
};

const PAYMENT_TYPES = {
  mutui: { label: 'Mutui', icon: '🏠', color: '#e53935', multiplier: 1.20 },
  riscossione: { label: 'Riscossione', icon: '⚠️', color: '#ff7043', multiplier: 1.15 },
  stipendi: { label: 'Stipendi', icon: '💼', color: '#fdd835', multiplier: 1.10 },
  imposte: { label: 'Imposte', icon: '🏛️', color: '#66bb6a', multiplier: 1.05 },
  altro: { label: 'Altro', icon: '📌', color: '#42a5f5', multiplier: 1.0 },
};

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

// Calcolo massa per cella con eventi
const calculateMass = (events) => {
  if (!events?.length) return 0;
  return events.reduce((total, e) => {
    const mult = PAYMENT_TYPES[e.type]?.multiplier || 1;
    return total + Math.log10(e.amount + 1) * mult * 100;
  }, 0);
};

// ============================================
// MESH CON REDISTRIBUZIONE PROPORZIONALE
// ============================================
class VertexMesh {
  constructor(config) {
    this.config = config;
    this.cols = config.cols;
    this.rows = config.rows;
    
    this.gridLeft = config.padding;
    this.gridTop = config.padding + config.headerHeight;
    this.totalWidth = config.canvasWidth - config.padding * 2;
    this.totalHeight = config.canvasHeight - config.padding * 2 - config.headerHeight;
    this.baseCellWidth = this.totalWidth / this.cols;
    this.baseCellHeight = this.totalHeight / this.rows;
    
    this.vertexCols = config.cols + 1;
    this.vertexRows = config.rows + 1;
    
    this.vertices = [];
    this.targetVertices = [];
    this.initVertices();
    
    this.masses = new Array(config.cols * config.rows).fill(0);
  }
  
  initVertices() {
    for (let row = 0; row <= this.rows; row++) {
      for (let col = 0; col <= this.cols; col++) {
        const x = this.gridLeft + col * this.baseCellWidth;
        const y = this.gridTop + row * this.baseCellHeight;
        this.vertices.push({ x, y, baseX: x, baseY: y });
        this.targetVertices.push({ x, y });
      }
    }
  }
  
  getVertexIndex(row, col) {
    return row * this.vertexCols + col;
  }
  
  getVertex(row, col) {
    return this.vertices[this.getVertexIndex(row, col)];
  }
  
  getCellIndex(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1;
    return row * this.cols + col;
  }
  
  setMasses(masses, emptyMass) {
    this.emptyMass = emptyMass;
    // Sostituisce massa 0 con emptyMass, e -1 (fuori mese) con emptyMass
    this.masses = masses.map(m => m <= 0 ? emptyMass : m);
    this.calculateTargetPositions();
  }
  
  calculateTargetPositions() {
    // Calcola larghezze per ogni riga
    const rowWidths = [];
    for (let row = 0; row < this.rows; row++) {
      const rowMasses = [];
      for (let col = 0; col < this.cols; col++) {
        const idx = row * this.cols + col;
        rowMasses.push(this.masses[idx]);
      }
      const totalRowMass = rowMasses.reduce((a, b) => a + b, 0);
      rowWidths.push(rowMasses.map(m => (m / totalRowMass) * this.totalWidth));
    }
    
    // Calcola altezze per ogni colonna
    const colHeights = [];
    for (let col = 0; col < this.cols; col++) {
      const colMasses = [];
      for (let row = 0; row < this.rows; row++) {
        const idx = row * this.cols + col;
        colMasses.push(this.masses[idx]);
      }
      const totalColMass = colMasses.reduce((a, b) => a + b, 0);
      colHeights.push(colMasses.map(m => (m / totalColMass) * this.totalHeight));
    }
    
    // Posiziona i vertici
    for (let row = 0; row <= this.rows; row++) {
      for (let col = 0; col <= this.cols; col++) {
        const vIdx = this.getVertexIndex(row, col);
        
        // Calcola X: somma delle larghezze delle celle a sinistra in questa riga
        let x = this.gridLeft;
        if (col > 0) {
          // Media delle posizioni X calcolate dalle righe adiacenti
          let sumX = 0;
          let count = 0;
          
          // Riga sopra (se esiste)
          if (row > 0) {
            let rowX = this.gridLeft;
            for (let c = 0; c < col; c++) {
              rowX += rowWidths[row - 1][c];
            }
            sumX += rowX;
            count++;
          }
          
          // Riga corrente (se esiste)
          if (row < this.rows) {
            let rowX = this.gridLeft;
            for (let c = 0; c < col; c++) {
              rowX += rowWidths[row][c];
            }
            sumX += rowX;
            count++;
          }
          
          x = sumX / count;
        }
        
        // Calcola Y: somma delle altezze delle celle sopra in questa colonna
        let y = this.gridTop;
        if (row > 0) {
          // Media delle posizioni Y calcolate dalle colonne adiacenti
          let sumY = 0;
          let count = 0;
          
          // Colonna a sinistra (se esiste)
          if (col > 0) {
            let colY = this.gridTop;
            for (let r = 0; r < row; r++) {
              colY += colHeights[col - 1][r];
            }
            sumY += colY;
            count++;
          }
          
          // Colonna corrente (se esiste)
          if (col < this.cols) {
            let colY = this.gridTop;
            for (let r = 0; r < row; r++) {
              colY += colHeights[col][r];
            }
            sumY += colY;
            count++;
          }
          
          y = sumY / count;
        }
        
        this.targetVertices[vIdx] = { x, y };
      }
    }
  }
  
  update() {
    const { animationSpeed } = this.config;
    
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      const t = this.targetVertices[i];
      v.x += (t.x - v.x) * animationSpeed;
      v.y += (t.y - v.y) * animationSpeed;
    }
  }
  
  getCellVertices(cellIndex) {
    const cellRow = Math.floor(cellIndex / this.cols);
    const cellCol = cellIndex % this.cols;
    
    const tl = this.getVertex(cellRow, cellCol);
    const tr = this.getVertex(cellRow, cellCol + 1);
    const bl = this.getVertex(cellRow + 1, cellCol);
    const br = this.getVertex(cellRow + 1, cellCol + 1);
    
    return {
      topLeft: { x: tl.x, y: tl.y },
      topRight: { x: tr.x, y: tr.y },
      bottomLeft: { x: bl.x, y: bl.y },
      bottomRight: { x: br.x, y: br.y },
    };
  }
  
  getCellCenter(cellIndex) {
    const v = this.getCellVertices(cellIndex);
    return {
      x: (v.topLeft.x + v.topRight.x + v.bottomLeft.x + v.bottomRight.x) / 4,
      y: (v.topLeft.y + v.topRight.y + v.bottomLeft.y + v.bottomRight.y) / 4,
    };
  }
  
  getColumnCenter(col) {
    return this.gridLeft + (col + 0.5) * this.baseCellWidth;
  }
  
  hitTest(px, py) {
    // Usa bounding box base per hit test (più affidabile)
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const idx = row * this.cols + col;
        const v = this.getCellVertices(idx);
        const minX = Math.min(v.topLeft.x, v.bottomLeft.x);
        const maxX = Math.max(v.topRight.x, v.bottomRight.x);
        const minY = Math.min(v.topLeft.y, v.topRight.y);
        const maxY = Math.max(v.bottomLeft.y, v.bottomRight.y);
        if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
          return idx;
        }
      }
    }
    return -1;
  }
}

// ============================================
// RENDERER
// ============================================
class CalendarRenderer {
  constructor(canvas, mesh) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mesh = mesh;
    this.setupCanvas();
  }
  
  setupCanvas() {
    const { canvasWidth, canvasHeight } = this.mesh.config;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = canvasWidth * dpr;
    this.canvas.height = canvasHeight * dpr;
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';
    this.ctx.scale(dpr, dpr);
  }
  
  render(calendarDays, eventsByDate, hoveredCell, showGrid) {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.mesh.config;
    
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    this.drawWeekdays();
    
    // Glow
    calendarDays.forEach((day, i) => {
      const events = eventsByDate[day.date?.toDateString()] || [];
      const mass = calculateMass(events);
      if (mass > 0 && day.isCurrentMonth) {
        this.drawCellGlow(i, events, mass);
      }
    });
    
    // Grid
    if (showGrid) this.drawMeshLines();
    
    // Cells
    calendarDays.forEach((day, i) => {
      const events = eventsByDate[day.date?.toDateString()] || [];
      const mass = calculateMass(events);
      this.drawCell(i, day, events, mass, i === hoveredCell);
    });
    
    // Content
    calendarDays.forEach((day, i) => {
      const events = eventsByDate[day.date?.toDateString()] || [];
      this.drawCellContent(i, day, events);
    });
  }
  
  drawWeekdays() {
    const ctx = this.ctx;
    const mesh = this.mesh;
    const { padding, headerHeight } = mesh.config;
    
    ctx.font = "600 11px 'Segoe UI', sans-serif";
    ctx.fillStyle = '#6366f1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const y = padding + headerHeight / 2;
    
    for (let col = 0; col < 7; col++) {
      ctx.fillText(WEEKDAYS[col], mesh.getColumnCenter(col), y);
    }
  }
  
  drawMeshLines() {
    const ctx = this.ctx;
    const mesh = this.mesh;
    
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.lineWidth = 1;
    
    for (let row = 0; row <= mesh.rows; row++) {
      ctx.beginPath();
      for (let col = 0; col <= mesh.cols; col++) {
        const v = mesh.getVertex(row, col);
        if (col === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      }
      ctx.stroke();
    }
    
    for (let col = 0; col <= mesh.cols; col++) {
      ctx.beginPath();
      for (let row = 0; row <= mesh.rows; row++) {
        const v = mesh.getVertex(row, col);
        if (row === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      }
      ctx.stroke();
    }
  }
  
  drawCellGlow(index, events, mass) {
    const ctx = this.ctx;
    const center = this.mesh.getCellCenter(index);
    const color = events[0] ? PAYMENT_TYPES[events[0].type]?.color : '#6366f1';
    const radius = 60 + Math.min(mass / 500, 1) * 50;
    
    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    gradient.addColorStop(0, color + '50');
    gradient.addColorStop(0.5, color + '20');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawCell(index, day, events, mass, isHovered) {
    const ctx = this.ctx;
    const v = this.mesh.getCellVertices(index);
    const hasEvents = events.length > 0 && day.isCurrentMonth;
    const color = hasEvents ? PAYMENT_TYPES[events[0].type]?.color : null;
    
    ctx.beginPath();
    ctx.moveTo(v.topLeft.x, v.topLeft.y);
    ctx.lineTo(v.topRight.x, v.topRight.y);
    ctx.lineTo(v.bottomRight.x, v.bottomRight.y);
    ctx.lineTo(v.bottomLeft.x, v.bottomLeft.y);
    ctx.closePath();
    
    if (!day.isCurrentMonth) {
      ctx.fillStyle = 'rgba(8, 8, 13, 0.95)';
    } else if (hasEvents) {
      ctx.fillStyle = color + (isHovered ? '40' : '25');
    } else if (day.isToday) {
      ctx.fillStyle = isHovered ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)';
    } else {
      ctx.fillStyle = isHovered ? 'rgba(30, 30, 45, 0.9)' : 'rgba(15, 15, 22, 0.7)';
    }
    ctx.fill();
    
    if (hasEvents) {
      ctx.strokeStyle = color + (isHovered ? 'ee' : 'aa');
      ctx.lineWidth = 2;
      ctx.stroke();
      if (mass > 300) {
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.min(mass / 30, 20);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    } else if (day.isToday) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (isHovered && day.isCurrentMonth) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  
  drawCellContent(index, day, events) {
    const ctx = this.ctx;
    const center = this.mesh.getCellCenter(index);
    const v = this.mesh.getCellVertices(index);
    const hasEvents = events.length > 0 && day.isCurrentMonth;
    
    const cellWidth = Math.abs(v.topRight.x - v.topLeft.x);
    const cellHeight = Math.abs(v.bottomLeft.y - v.topLeft.y);
    const scale = Math.min(Math.max(Math.sqrt(cellWidth * cellHeight) / Math.sqrt(this.mesh.baseCellWidth * this.mesh.baseCellHeight), 0.5), 1.8);
    
    if (!day.isCurrentMonth) ctx.globalAlpha = 0.2;
    
    ctx.font = `${day.isToday ? 'bold ' : ''}${Math.round(14 * scale)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = day.isToday ? '#818cf8' : (hasEvents ? '#fff' : '#555');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const dayY = hasEvents ? center.y - cellHeight * 0.25 : center.y;
    ctx.fillText(day.day.toString(), center.x, dayY);
    
    if (hasEvents) {
      const maxEvents = Math.min(events.length, 2);
      const spacing = 16 * scale;
      const startY = center.y + 5 * scale;
      
      events.slice(0, maxEvents).forEach((event, i) => {
        const evColor = PAYMENT_TYPES[event.type]?.color || '#6366f1';
        const icon = PAYMENT_TYPES[event.type]?.icon || '•';
        const amount = event.amount >= 1000 
          ? `€${(event.amount/1000).toFixed(0)}k` 
          : `€${event.amount}`;
        
        ctx.font = `${Math.round(10 * scale)}px 'Segoe UI', sans-serif`;
        ctx.fillStyle = evColor;
        ctx.fillText(`${icon} ${amount}`, center.x, startY + i * spacing);
      });
      
      if (events.length > 2) {
        ctx.font = `${Math.round(9 * scale)}px 'Segoe UI', sans-serif`;
        ctx.fillStyle = '#666';
        ctx.fillText(`+${events.length - 2}`, center.x, startY + 2 * spacing);
      }
    }
    
    ctx.globalAlpha = 1;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SpacetimeCalendar() {
  const canvasRef = useRef(null);
  const meshRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  
  // REF per dati dinamici
  const dataRef = useRef({
    calendarDays: [],
    eventsByDate: {},
    hoveredCell: -1,
    showGrid: true,
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(-1);
  const [showGrid, setShowGrid] = useState(true);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalType, setModalType] = useState('altro');
  const [modalAmount, setModalAmount] = useState('');
  
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
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
  
  const eventsByDate = useMemo(() => {
    const grouped = {};
    events.forEach(event => {
      const key = event.date.toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [events]);
  
  // Calcola massa per celle vuote basata sulla media degli importi
  const emptyMass = useMemo(() => {
    const monthEvents = events.filter(e => 
      e.date.getMonth() === currentDate.getMonth() && 
      e.date.getFullYear() === currentDate.getFullYear()
    );
    if (monthEvents.length === 0) return 100; // Default se nessun evento
    
    const totalAmount = monthEvents.reduce((sum, e) => sum + e.amount, 0);
    const avgAmount = totalAmount / monthEvents.length;
    
    return Math.log10(avgAmount + 1) * CONFIG.emptyMassMultiplier * 100;
  }, [events, currentDate]);
  
  const masses = useMemo(() => {
    return calendarDays.map(day => {
      if (!day.isCurrentMonth) return -1; // Fuori mese
      const dayEvents = eventsByDate[day.date?.toDateString()] || [];
      return calculateMass(dayEvents); // 0 se vuota, >0 se ha eventi
    });
  }, [calendarDays, eventsByDate]);
  
  const stats = useMemo(() => {
    const monthEvents = events.filter(e => 
      e.date.getMonth() === currentDate.getMonth() && 
      e.date.getFullYear() === currentDate.getFullYear()
    );
    const totalAmount = monthEvents.reduce((sum, e) => sum + e.amount, 0);
    const validMasses = masses.filter(m => m > 0);
    const totalMass = validMasses.reduce((sum, m) => sum + m, 0);
    const maxMass = Math.max(...validMasses, 0);
    return { totalAmount, totalMass, maxMass, eventCount: monthEvents.length };
  }, [events, masses, currentDate]);
  
  // Aggiorna dataRef quando cambiano i dati
  useEffect(() => {
    dataRef.current = { calendarDays, eventsByDate, hoveredCell, showGrid };
  }, [calendarDays, eventsByDate, hoveredCell, showGrid]);
  
  // Aggiorna masse nella mesh
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.setMasses(masses, emptyMass);
    }
  }, [masses, emptyMass]);
  
  // Init e animation loop
  useEffect(() => {
    if (!canvasRef.current) return;
    
    meshRef.current = new VertexMesh(CONFIG);
    rendererRef.current = new CalendarRenderer(canvasRef.current, meshRef.current);
    
    const animate = () => {
      meshRef.current.update();
      const { calendarDays, eventsByDate, hoveredCell, showGrid } = dataRef.current;
      rendererRef.current.render(calendarDays, eventsByDate, hoveredCell, showGrid);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    if (!meshRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setHoveredCell(meshRef.current.hitTest(e.clientX - rect.left, e.clientY - rect.top));
  }, []);
  
  const handleClick = useCallback((e) => {
    if (!meshRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const idx = meshRef.current.hitTest(e.clientX - rect.left, e.clientY - rect.top);
    
    if (idx >= 0 && dataRef.current.calendarDays[idx]?.isCurrentMonth) {
      setModalDate(dataRef.current.calendarDays[idx].date);
      setModalType('altro');
      setModalAmount('');
      setModalOpen(true);
    }
  }, []);
  
  const handleAddEvent = () => {
    const numAmount = Number(modalAmount);
    if (numAmount > 0 && modalDate) {
      setEvents(prev => [...prev, { type: modalType, amount: numAmount, date: modalDate }]);
      setModalOpen(false);
    }
  };
  
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#030306', minHeight: '100vh', padding: 16, color: '#e8e8f0' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', background: 'linear-gradient(135deg, #e8e8f0, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Spacetime Calendar
            </h1>
            <span style={{ fontSize: '0.65rem', color: '#6366f1' }}>v{VERSION}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#e8e8f0', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>←</button>
            <span style={{ minWidth: 160, textAlign: 'center', textTransform: 'capitalize' }}>
              {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#e8e8f0', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>→</button>
          </div>
        </div>
        
        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 10, padding: '8px 12px', background: 'rgba(99,102,241,0.05)', borderRadius: 6, flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: 10, color: '#666' }}>MASSA</div><div style={{ color: '#818cf8' }}>{stats.totalMass.toFixed(0)} M☉</div></div>
          <div><div style={{ fontSize: 10, color: '#666' }}>FLUSSO</div><div style={{ color: '#818cf8' }}>€{stats.totalAmount.toLocaleString('it-IT')}</div></div>
          <div><div style={{ fontSize: 10, color: '#666' }}>EVENTI</div><div style={{ color: '#818cf8' }}>{stats.eventCount}</div></div>
        </div>
        
        {/* Canvas */}
        <div style={{ background: '#0a0a12', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)', overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={() => setHoveredCell(-1)}
            style={{ display: 'block', cursor: 'pointer' }}
          />
        </div>
        
        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowGrid(!showGrid)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', padding: '6px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>
            {showGrid ? '⬜ Griglia' : '⬛ Griglia'}
          </button>
          <span style={{ fontSize: 12, color: '#555' }}>💡 Clicca su un giorno per aggiungere pagamenti</span>
        </div>
        
        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10, padding: '8px 12px', background: 'rgba(99,102,241,0.04)', borderRadius: 6 }}>
          {Object.entries(PAYMENT_TYPES).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888' }}>
              <span style={{ width: 8, height: 8, background: v.color, borderRadius: 2 }} />
              <span>{v.icon} {v.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Modal */}
      {modalOpen && modalDate && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setModalOpen(false)}
        >
          <div 
            style={{ background: '#111', border: '1px solid #6366f1', borderRadius: 12, padding: 20, width: 360 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 5px', color: '#fff' }}>Aggiungi Pagamento</h3>
            <p style={{ margin: '0 0 15px', color: '#888', fontSize: 14, textTransform: 'capitalize' }}>
              {modalDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 5 }}>TIPO</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {Object.entries(PAYMENT_TYPES).map(([k, v]) => (
                  <button 
                    key={k} 
                    type="button" 
                    onClick={() => setModalType(k)} 
                    style={{
                      padding: '8px 4px', 
                      background: modalType === k ? '#6366f120' : '#0a0a0f',
                      border: `1px solid ${modalType === k ? v.color : '#333'}`, 
                      borderRadius: 6,
                      color: '#aaa', 
                      cursor: 'pointer', 
                      fontSize: 10
                    }}
                  >
                    <div style={{ fontSize: 16 }}>{v.icon}</div>
                    <div>{v.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 5 }}>IMPORTO €</label>
              <input 
                type="number" 
                value={modalAmount} 
                onChange={e => setModalAmount(e.target.value)}
                placeholder="0" 
                autoFocus 
                style={{
                  width: '100%', 
                  padding: 10, 
                  background: '#0a0a0f', 
                  border: '1px solid #333',
                  borderRadius: 6, 
                  color: '#fff', 
                  fontSize: 16, 
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {[500, 1000, 5000, 10000, 25000, 50000].map(v => (
                  <button 
                    key={v} 
                    type="button" 
                    onClick={() => setModalAmount(String(v))} 
                    style={{
                      flex: 1, 
                      padding: 6, 
                      background: '#1a1a2e', 
                      border: '1px solid #333',
                      borderRadius: 4, 
                      color: '#888', 
                      cursor: 'pointer', 
                      fontSize: 11
                    }}
                  >
                    {v >= 1000 ? `${v/1000}k` : v}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)} 
                style={{
                  flex: 1, 
                  padding: 12, 
                  background: 'transparent', 
                  border: '1px solid #333',
                  borderRadius: 6, 
                  color: '#888', 
                  cursor: 'pointer'
                }}
              >
                Annulla
              </button>
              <button 
                type="button"
                onClick={handleAddEvent}
                style={{
                  flex: 1, 
                  padding: 12, 
                  background: Number(modalAmount) > 0 ? '#6366f1' : '#333',
                  border: 'none', 
                  borderRadius: 6, 
                  color: '#fff', 
                  cursor: Number(modalAmount) > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
