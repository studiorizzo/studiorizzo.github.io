import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTheme } from '../src/context/ThemeContext';

const PAYMENT_TYPES = {
  mutui: { label: 'Mutui', icon: '🏠', color: '#dc2626', multiplier: 1.20 },
  riscossione: { label: 'Riscossione', icon: '⚠️', color: '#ea580c', multiplier: 1.15 },
  stipendi: { label: 'Stipendi', icon: '💼', color: '#ca8a04', multiplier: 1.10 },
  imposte: { label: 'Imposte', icon: '🏛️', color: '#16a34a', multiplier: 1.05 },
  altro: { label: 'Altro', icon: '📌', color: '#2563eb', multiplier: 1.0 },
};

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

// Colori da canvas chiaro
const MD3_COLORS = {
  light: {
    standard: {
      background: '#F5FAFC', surface: '#F5FAFC', surfaceContainer: '#E9EFF0',
      onSurface: '#171D1E', onSurfaceVariant: '#3F484A', outline: '#6F797B',
      outlineVariant: '#BFC8CB', primary: '#006877', onPrimary: '#FFFFFF',
    },
    medium: {
      background: '#F5FAFC', surface: '#F5FAFC', surfaceContainer: '#E9EFF0',
      onSurface: '#0C1213', onSurfaceVariant: '#2B3436', outline: '#4B5456',
      outlineVariant: '#7B8486', primary: '#003C45', onPrimary: '#FFFFFF',
    },
    high: {
      background: '#F5FAFC', surface: '#F5FAFC', surfaceContainer: '#E9EFF0',
      onSurface: '#000000', onSurfaceVariant: '#000000', outline: '#252E30',
      outlineVariant: '#252E30', primary: '#003139', onPrimary: '#FFFFFF',
    },
  },
  dark: {
    standard: {
      background: '#0E1416', surface: '#0E1416', surfaceContainer: '#1B2122',
      onSurface: '#DEE3E5', onSurfaceVariant: '#BFC8CB', outline: '#899295',
      outlineVariant: '#3F484A', primary: '#83D2E3', onPrimary: '#00363E',
    },
    medium: {
      background: '#0E1416', surface: '#0E1416', surfaceContainer: '#1B2122',
      onSurface: '#F2F7F9', onSurfaceVariant: '#C3CCD0', outline: '#C3CCD0',
      outlineVariant: '#5B6467', primary: '#87D6E7', onPrimary: '#003139',
    },
    high: {
      background: '#0E1416', surface: '#0E1416', surfaceContainer: '#1B2122',
      onSurface: '#FFFFFF', onSurfaceVariant: '#FFFFFF', outline: '#E8F2F4',
      outlineVariant: '#BBC4C7', primary: '#D2F6FF', onPrimary: '#000000',
    },
  },
};

const CELL_COLORS = {
  light: {
    standard: { checker1: '#eff5f6', checker2: '#e9eff0', gridLine: '#006877' },
    medium: { checker1: '#eff5f6', checker2: '#e9eff0', gridLine: '#006877' },
    high: { checker1: '#eff5f6', checker2: '#e9eff0', gridLine: '#006877' },
  },
  dark: {
    standard: { checker1: '#171d1e', checker2: '#1b2122', gridLine: '#83d2e3' },
    medium: { checker1: '#171d1e', checker2: '#1b2122', gridLine: '#83d2e3' },
    high: { checker1: '#171d1e', checker2: '#1b2122', gridLine: '#83d2e3' },
  },
};

const CALENDAR_HEADER_COLORS = {
  light: {
    standard: { background: '#dbe1ff', text: '#3d4665' },
    medium: { background: '#636c8d', text: '#ffffff' },
    high: { background: '#3f4867', text: '#ffffff' },
  },
  dark: {
    standard: { background: '#3d4665', text: '#dbe1ff' },
    medium: { background: '#878fb3', text: '#000000' },
    high: { background: '#b8c1e7', text: '#010926' },
  },
};

// ============================================
// MÖBIUS STRIP - Fixed geometry, scrolling days
// ============================================
class MobiusStrip {
  constructor() {
    this.uSegments = 40;  // Segments around the loop
    this.vSegments = 5;   // Rows across width (like reference image)
  }

  // Parametric Möbius strip
  getPoint3D(u, v, R, w) {
    // u: 0 to 2π (around the strip)
    // v: -1 to 1 (across the width)
    const halfTwist = Math.PI;
    const twist = halfTwist * u / (2 * Math.PI);

    const x = (R + (w / 2) * v * Math.cos(twist)) * Math.cos(u);
    const y = (R + (w / 2) * v * Math.cos(twist)) * Math.sin(u);
    const z = (w / 2) * v * Math.sin(twist);

    return { x, y, z };
  }

  // Apply view tilt (fixed, no rotation)
  transform(point, tiltX) {
    let { x, y, z } = point;

    // Tilt around X axis (view angle from above)
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;

    return { x, y: y1, z: z1 };
  }

  project(point3D, centerX, centerY, perspective) {
    const scale = perspective / (perspective + point3D.z);
    return {
      x: centerX + point3D.x * scale,
      y: centerY + point3D.y * scale,
      z: point3D.z,
      scale,
    };
  }

  // Generate the fixed mesh of the strip
  generateMesh(R, w, centerX, centerY, perspective, tiltX) {
    const mesh = [];

    for (let i = 0; i <= this.uSegments; i++) {
      const row = [];
      const u = (i / this.uSegments) * Math.PI * 2;

      for (let j = 0; j <= this.vSegments; j++) {
        const v = (j / this.vSegments) * 2 - 1;
        const p3d = this.getPoint3D(u, v, R, w);
        const transformed = this.transform(p3d, tiltX);
        const projected = this.project(transformed, centerX, centerY, perspective);
        row.push(projected);
      }
      mesh.push(row);
    }

    return mesh;
  }

  getCell(mesh, uIndex, vIndex) {
    if (uIndex >= mesh.length - 1 || vIndex >= mesh[0].length - 1) return null;

    return {
      topLeft: mesh[uIndex][vIndex],
      topRight: mesh[uIndex][vIndex + 1],
      bottomRight: mesh[uIndex + 1][vIndex + 1],
      bottomLeft: mesh[uIndex + 1][vIndex],
      avgZ: (mesh[uIndex][vIndex].z + mesh[uIndex][vIndex + 1].z +
             mesh[uIndex + 1][vIndex].z + mesh[uIndex + 1][vIndex + 1].z) / 4,
    };
  }
}

// ============================================
// RENDERER
// ============================================
class MobiusRenderer {
  constructor(canvas, mobius) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mobius = mobius;
  }

  setupCanvas(width, height) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = width;
    this.height = height;
  }

  render(days, eventsByDate, dayOffset, hoveredDay, colors, cellColors) {
    const ctx = this.ctx;
    const c = colors;
    const cc = cellColors;

    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, this.width, this.height);

    const totalDays = days.length;
    if (totalDays === 0) return;

    // Calculate dimensions to fit within page like reference image
    const padding = 40;
    const availableWidth = this.width - padding * 2;
    const availableHeight = this.height - padding * 2;

    // The strip must FIT inside the viewport
    // Reference image: strip fills ~90% of width, ~70% of height
    // With tiltX ~1.0, vertical extent ≈ R + w (front) and the back is foreshortened
    const maxR = Math.min(availableWidth / 2.2, availableHeight / 1.8);
    const R = maxR;
    const w = R * 0.65;  // Strip width - thick but not too thick
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const perspective = Math.max(availableWidth, availableHeight) * 1.5;
    const tiltX = 0.95;  // Slight tilt from above like reference

    // Segments around the loop - enough for smooth curve
    this.mobius.uSegments = 40;

    // Generate fixed mesh
    const mesh = this.mobius.generateMesh(R, w, centerX, centerY, perspective, tiltX);
    this.lastMesh = mesh;
    this.lastParams = { R, w, centerX, centerY, perspective, tiltX };

    // Collect all cells for sorting
    const cells = [];
    for (let i = 0; i < this.mobius.uSegments; i++) {
      for (let j = 0; j < this.mobius.vSegments; j++) {
        const cell = this.mobius.getCell(mesh, i, j);
        if (cell) {
          // Map mesh position to day with offset
          const dayIndex = Math.floor((i / this.mobius.uSegments) * totalDays + dayOffset) % totalDays;
          const actualDayIndex = dayIndex < 0 ? dayIndex + totalDays : dayIndex;

          cells.push({
            meshIndex: i,
            vIndex: j,
            cell,
            dayIndex: actualDayIndex,
            day: days[actualDayIndex],
            events: eventsByDate[days[actualDayIndex]?.date?.toDateString()] || [],
          });
        }
      }
    }

    // Sort back to front (painter's algorithm)
    cells.sort((a, b) => a.cell.avgZ - b.cell.avgZ);

    // Draw cells - pure checkerboard, no lighting
    cells.forEach(item => {
      this.drawCell(item, item.dayIndex === hoveredDay, cc, c);
    });

    // Draw vertical grid lines only
    this.drawGridLines(mesh, cc);

    // Draw day content on visible cells
    const drawnDays = new Set();
    for (let i = 0; i < this.mobius.uSegments; i++) {
      const centerCell = this.mobius.getCell(mesh, i, Math.floor(this.mobius.vSegments / 2));
      if (centerCell && centerCell.avgZ < 150) {
        const dayIndex = Math.floor((i / this.mobius.uSegments) * totalDays + dayOffset) % totalDays;
        const actualDayIndex = dayIndex < 0 ? dayIndex + totalDays : dayIndex;

        if (!drawnDays.has(actualDayIndex)) {
          drawnDays.add(actualDayIndex);
          this.drawDayContent(days[actualDayIndex], eventsByDate[days[actualDayIndex]?.date?.toDateString()] || [], centerCell, c);
        }
      }
    }
  }

  drawCell(item, isHovered, cc, c) {
    const ctx = this.ctx;
    const { cell, meshIndex, vIndex, events } = item;
    const hasEvents = events.length > 0;

    // Pure checkerboard - no depth shading
    const isEven = (meshIndex + vIndex) % 2 === 0;
    let fillColor = isEven ? cc.checker1 : cc.checker2;

    if (isHovered) {
      fillColor = c.surfaceContainer;
    } else if (hasEvents && vIndex === Math.floor(this.mobius.vSegments / 2)) {
      fillColor = PAYMENT_TYPES[events[0].type]?.color + '40';
    }

    ctx.beginPath();
    ctx.moveTo(cell.topLeft.x, cell.topLeft.y);
    ctx.lineTo(cell.topRight.x, cell.topRight.y);
    ctx.lineTo(cell.bottomRight.x, cell.bottomRight.y);
    ctx.lineTo(cell.bottomLeft.x, cell.bottomLeft.y);
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  drawGridLines(mesh, cc) {
    const ctx = this.ctx;
    ctx.strokeStyle = cc.gridLine;
    ctx.lineWidth = 1;

    // Collect vertical lines only
    const lines = [];

    for (let i = 0; i <= this.mobius.uSegments; i++) {
      const idx = i % (this.mobius.uSegments + 1);
      if (idx >= mesh.length) continue;

      const line = [];
      let avgZ = 0;
      for (let j = 0; j <= this.mobius.vSegments; j++) {
        const p = mesh[idx][j];
        line.push(p);
        avgZ += p.z;
      }
      avgZ /= line.length;
      lines.push({ points: line, avgZ });
    }

    // Sort by depth
    lines.sort((a, b) => a.avgZ - b.avgZ);

    // Draw lines with depth-based opacity
    lines.forEach(({ points, avgZ }) => {
      ctx.globalAlpha = Math.max(0.1, Math.min(0.8, 0.7 - avgZ / 600));
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let k = 1; k < points.length; k++) {
        ctx.lineTo(points[k].x, points[k].y);
      }
      ctx.stroke();
    });

    ctx.globalAlpha = 1;
  }

  drawDayContent(day, events, cell, c) {
    if (!day) return;

    const ctx = this.ctx;
    const hasEvents = events.length > 0;

    const cx = (cell.topLeft.x + cell.topRight.x + cell.bottomLeft.x + cell.bottomRight.x) / 4;
    const cy = (cell.topLeft.y + cell.topRight.y + cell.bottomLeft.y + cell.bottomRight.y) / 4;

    const scale = Math.max(0.6, Math.min(1.4, cell.topLeft.scale));
    const alpha = Math.max(0.3, Math.min(1, 1 - cell.avgZ / 400));

    ctx.globalAlpha = alpha;

    // Day number
    ctx.font = `${day.isToday ? 'bold ' : ''}${Math.round(14 * scale)}px 'Orbitron', sans-serif`;
    ctx.fillStyle = hasEvents ? PAYMENT_TYPES[events[0]?.type]?.color : c.onSurface;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(day.day.toString(), cx, cy - (hasEvents ? 8 : 0) * scale);

    // Weekday
    const weekday = WEEKDAYS[day.date.getDay() === 0 ? 6 : day.date.getDay() - 1];
    ctx.font = `500 ${Math.round(8 * scale)}px 'Orbitron', sans-serif`;
    ctx.fillStyle = c.onSurfaceVariant;
    ctx.fillText(weekday, cx, cy - 20 * scale);

    // Event amount
    if (hasEvents && scale > 0.65) {
      const amount = events[0].amount >= 1000 ? `€${(events[0].amount/1000).toFixed(0)}k` : `€${events[0].amount}`;
      ctx.font = `${Math.round(9 * scale)}px 'Orbitron', sans-serif`;
      ctx.fillStyle = PAYMENT_TYPES[events[0].type]?.color;
      ctx.fillText(amount, cx, cy + 10 * scale);
    }

    ctx.globalAlpha = 1;
  }

  hitTest(px, py, days, dayOffset) {
    if (!this.lastMesh) return -1;

    const mesh = this.lastMesh;
    const totalDays = days.length;
    const midV = Math.floor(this.mobius.vSegments / 2);

    for (let i = 0; i < this.mobius.uSegments; i++) {
      const cell = this.mobius.getCell(mesh, i, midV);
      if (!cell || cell.avgZ > 150) continue;

      const cx = (cell.topLeft.x + cell.topRight.x + cell.bottomLeft.x + cell.bottomRight.x) / 4;
      const cy = (cell.topLeft.y + cell.topRight.y + cell.bottomLeft.y + cell.bottomRight.y) / 4;
      const dx = px - cx;
      const dy = py - cy;

      if (Math.sqrt(dx * dx + dy * dy) < 30 * cell.topLeft.scale) {
        const dayIndex = Math.floor((i / this.mobius.uSegments) * totalDays + dayOffset) % totalDays;
        return dayIndex < 0 ? dayIndex + totalDays : dayIndex;
      }
    }
    return -1;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function CalendarVariant2() {
  const { mode, contrast } = useTheme();

  const colors = useMemo(() => MD3_COLORS[mode][contrast], [mode, contrast]);
  const cellColors = useMemo(() => CELL_COLORS[mode][contrast], [mode, contrast]);
  const headerColors = useMemo(() => CALENDAR_HEADER_COLORS[mode][contrast], [mode, contrast]);

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const mobiusRef = useRef(null);
  const rendererRef = useRef(null);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(-1);
  const [dayOffset, setDayOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, offset: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalType, setModalType] = useState('altro');
  const [modalAmount, setModalAmount] = useState('');

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toDateString();

    const result = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      result.push({ day: i, date, isToday: date.toDateString() === todayStr });
    }
    return result;
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

  // Resize
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // Render
  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;

    if (!mobiusRef.current) {
      mobiusRef.current = new MobiusStrip();
      rendererRef.current = new MobiusRenderer(canvasRef.current, mobiusRef.current);
    }

    rendererRef.current.setupCanvas(canvasSize.width, canvasSize.height);
    rendererRef.current.render(days, eventsByDate, dayOffset, hoveredDay, colors, cellColors);
  }, [canvasSize, days, eventsByDate, dayOffset, hoveredDay, colors, cellColors]);

  // Mouse handlers - DRAG to scroll days
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      offset: dayOffset,
    };
  }, [dayOffset]);

  const handleMouseMove = useCallback((e) => {
    if (!rendererRef.current || !canvasRef.current) return;

    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      // Convert pixel drag to day offset (negative dx = scroll forward)
      const sensitivity = days.length / (canvasSize.width * 0.8);
      const newOffset = dragStartRef.current.offset - dx * sensitivity;
      setDayOffset(newOffset);
    } else {
      const rect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const idx = rendererRef.current.hitTest(px, py, days, dayOffset);
      setHoveredDay(idx);
    }
  }, [isDragging, days, dayOffset, canvasSize.width]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!isDragging && hoveredDay >= 0 && days[hoveredDay]) {
      setModalDate(days[hoveredDay].date);
      setModalType('altro');
      setModalAmount('');
      setModalOpen(true);
    }
  }, [isDragging, hoveredDay, days]);

  const handleAddEvent = () => {
    const numAmount = Number(modalAmount);
    if (numAmount > 0 && modalDate) {
      setEvents(prev => [...prev, { type: modalType, amount: numAmount, date: modalDate }]);
      setModalOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: colors.background }}>
      <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setHoveredDay(-1); setIsDragging(false); }}
          onClick={handleClick}
          style={{ display: 'block', width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
        />
      </div>

      {/* Header inside center hole */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, pointerEvents: 'auto',
      }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '20px', fontWeight: 600, textTransform: 'capitalize', color: colors.onSurface }}>
          {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            style={{ background: headerColors.background, border: 'none', color: headerColors.text, padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button onClick={() => setCurrentDate(new Date())}
            style={{ fontFamily: "'Orbitron', sans-serif", background: headerColors.background, border: 'none', color: headerColors.text, padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: '13px' }}>
            Oggi
          </button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            style={{ background: headerColors.background, border: 'none', color: headerColors.text, padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: colors.onSurfaceVariant, fontFamily: "'Orbitron', sans-serif" }}>
          Trascina per scorrere i giorni
        </p>
      </div>

      {/* Modal */}
      {modalOpen && modalDate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalOpen(false)}>
          <div style={{ background: colors.surface, border: `1px solid ${colors.outlineVariant}`, borderRadius: 12, padding: 20, width: 360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 5px', color: colors.onSurface, fontFamily: "'Orbitron', sans-serif" }}>Aggiungi Pagamento</h3>
            <p style={{ margin: '0 0 15px', color: colors.onSurfaceVariant, fontSize: 14, textTransform: 'capitalize' }}>
              {modalDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 5, fontFamily: "'Orbitron', sans-serif" }}>TIPO</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {Object.entries(PAYMENT_TYPES).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setModalType(k)}
                    style={{ padding: '8px 4px', background: modalType === k ? v.color + '20' : colors.surfaceContainer, border: `1px solid ${modalType === k ? v.color : colors.outlineVariant}`, borderRadius: 6, color: colors.onSurface, cursor: 'pointer', fontSize: 10 }}>
                    <div style={{ fontSize: 16 }}>{v.icon}</div>
                    <div>{v.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 5, fontFamily: "'Orbitron', sans-serif" }}>IMPORTO €</label>
              <input type="number" value={modalAmount} onChange={e => setModalAmount(e.target.value)} placeholder="0" autoFocus
                style={{ width: '100%', padding: 10, background: colors.surface, border: `1px solid ${colors.outlineVariant}`, borderRadius: 6, color: colors.onSurface, fontSize: 16, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {[500, 1000, 5000, 10000, 25000, 50000].map(v => (
                  <button key={v} type="button" onClick={() => setModalAmount(String(v))}
                    style={{ flex: 1, padding: 6, background: colors.surfaceContainer, border: `1px solid ${colors.outlineVariant}`, borderRadius: 4, color: colors.onSurfaceVariant, cursor: 'pointer', fontSize: 11, fontFamily: "'Orbitron', sans-serif" }}>
                    {v >= 1000 ? `${v/1000}k` : v}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setModalOpen(false)}
                style={{ flex: 1, padding: 12, background: colors.surface, border: `1px solid ${colors.outlineVariant}`, borderRadius: 6, color: colors.onSurfaceVariant, cursor: 'pointer', fontFamily: "'Orbitron', sans-serif" }}>Annulla</button>
              <button type="button" onClick={handleAddEvent}
                style={{ flex: 1, padding: 12, background: Number(modalAmount) > 0 ? colors.primary : colors.surfaceContainer, border: 'none', borderRadius: 6, color: Number(modalAmount) > 0 ? colors.onPrimary : colors.onSurfaceVariant, cursor: Number(modalAmount) > 0 ? 'pointer' : 'not-allowed', fontFamily: "'Orbitron', sans-serif" }}>Aggiungi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
