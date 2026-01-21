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

// Colori celle (scacchiera)
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
// MÖBIUS STRIP GEOMETRY
// ============================================
class MobiusStrip {
  constructor() {
    this.rotationAngle = 0; // Controlled by mouse scroll
  }

  // Parametric Möbius strip
  // u: 0 to 2π (around the loop)
  // v: -1 to 1 (across the width)
  getPoint3D(u, v, R, w) {
    const halfTwist = Math.PI; // Single half-twist
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    const twist = halfTwist * u / (2 * Math.PI);
    const cosT = Math.cos(twist);
    const sinT = Math.sin(twist);

    const x = (R + (w / 2) * v * cosT) * cosU;
    const y = (R + (w / 2) * v * cosT) * sinU;
    const z = (w / 2) * v * sinT;

    return { x, y, z };
  }

  // Apply rotation around Y axis (for scrolling)
  rotateY(point) {
    const cos = Math.cos(this.rotationAngle);
    const sin = Math.sin(this.rotationAngle);
    return {
      x: point.x * cos + point.z * sin,
      y: point.y,
      z: -point.x * sin + point.z * cos,
    };
  }

  // Project 3D to 2D with perspective
  project(point3D, centerX, centerY, perspective, tiltX = 0.35) {
    // First tilt around X axis for better view
    const cosT = Math.cos(tiltX);
    const sinT = Math.sin(tiltX);
    const y1 = point3D.y * cosT - point3D.z * sinT;
    const z1 = point3D.y * sinT + point3D.z * cosT;

    // Then rotate around Y (user scroll)
    const rotated = this.rotateY({ x: point3D.x, y: y1, z: z1 });

    const scale = perspective / (perspective + rotated.z);
    return {
      x: centerX + rotated.x * scale,
      y: centerY + rotated.y * scale,
      z: rotated.z,
      scale,
    };
  }

  // Get segment for a day
  getDaySegment(dayIndex, totalDays, R, w, centerX, centerY, perspective, vSteps = 6) {
    const u1 = (dayIndex / totalDays) * Math.PI * 2 + this.rotationAngle;
    const u2 = ((dayIndex + 1) / totalDays) * Math.PI * 2 + this.rotationAngle;

    const points = [];
    for (let i = 0; i <= vSteps; i++) {
      const v = (i / vSteps) * 2 - 1;
      const p1 = this.getPoint3D(u1, v, R, w);
      const p2 = this.getPoint3D(u2, v, R, w);
      points.push({
        left: this.project(p1, centerX, centerY, perspective),
        right: this.project(p2, centerX, centerY, perspective),
      });
    }

    // Average Z for sorting
    let avgZ = 0;
    points.forEach(p => { avgZ += p.left.z + p.right.z; });
    avgZ /= points.length * 2;

    return { points, avgZ };
  }

  // Get vertical line for day separator
  getDayLine(dayIndex, totalDays, R, w, centerX, centerY, perspective, vSteps = 8) {
    const u = (dayIndex / totalDays) * Math.PI * 2 + this.rotationAngle;
    const line = [];

    for (let i = 0; i <= vSteps; i++) {
      const v = (i / vSteps) * 2 - 1;
      const p = this.getPoint3D(u, v, R, w);
      line.push(this.project(p, centerX, centerY, perspective));
    }

    return line;
  }

  // Get center point of a day
  getDayCenter(dayIndex, totalDays, R, w, centerX, centerY, perspective) {
    const u = ((dayIndex + 0.5) / totalDays) * Math.PI * 2 + this.rotationAngle;
    const p = this.getPoint3D(u, 0, R, w);
    return this.project(p, centerX, centerY, perspective);
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

  render(days, eventsByDate, hoveredDay, colors, cellColors) {
    const ctx = this.ctx;
    const c = colors;
    const cc = cellColors;

    // Clear
    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, this.width, this.height);

    const totalDays = days.length;
    if (totalDays === 0) return;

    // Calculate dimensions to fit the page
    const padding = 16;
    const availableWidth = this.width - padding * 2;
    const availableHeight = this.height - padding * 2;

    // Radius and width based on available space
    const R = Math.min(availableWidth, availableHeight) * 0.38;
    const w = R * 0.5; // Strip width

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const perspective = Math.max(this.width, this.height) * 1.2;

    // Collect all segments
    const segments = [];
    for (let i = 0; i < totalDays; i++) {
      const seg = this.mobius.getDaySegment(i, totalDays, R, w, centerX, centerY, perspective);
      segments.push({
        index: i,
        segment: seg,
        day: days[i],
        events: eventsByDate[days[i]?.date?.toDateString()] || [],
      });
    }

    // Sort back to front
    segments.sort((a, b) => a.segment.avgZ - b.segment.avgZ);

    // Draw segments
    segments.forEach(seg => {
      this.drawSegment(seg, seg.index === hoveredDay, cc, c, totalDays, R, w, centerX, centerY, perspective);
    });

    // Draw day lines (sorted)
    this.drawDayLines(totalDays, R, w, centerX, centerY, perspective, cc);
  }

  drawSegment(seg, isHovered, cc, c, totalDays, R, w, centerX, centerY, perspective) {
    const ctx = this.ctx;
    const { segment, day, events, index } = seg;
    const hasEvents = events.length > 0;

    // Checkerboard color
    const isEven = index % 2 === 0;
    let fillColor = isEven ? cc.checker1 : cc.checker2;

    if (isHovered) {
      fillColor = c.surfaceContainer;
    } else if (hasEvents) {
      fillColor = PAYMENT_TYPES[events[0].type]?.color + '30';
    }

    // Draw the segment
    const pts = segment.points;
    ctx.beginPath();
    ctx.moveTo(pts[0].left.x, pts[0].left.y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].left.x, pts[i].left.y);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      ctx.lineTo(pts[i].right.x, pts[i].right.y);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Event border
    if (hasEvents) {
      ctx.strokeStyle = PAYMENT_TYPES[events[0].type]?.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw content
    const center = this.mobius.getDayCenter(index, totalDays, R, w, centerX, centerY, Math.max(this.width, this.height) * 1.2);
    this.drawDayContent(day, events, center, c);
  }

  drawDayLines(totalDays, R, w, centerX, centerY, perspective, cc) {
    const ctx = this.ctx;

    ctx.strokeStyle = cc.gridLine;
    ctx.lineWidth = 1;

    // Collect and sort lines by Z
    const lines = [];
    for (let i = 0; i <= totalDays; i++) {
      const line = this.mobius.getDayLine(i % totalDays, totalDays, R, w, centerX, centerY, perspective);
      const avgZ = line.reduce((sum, p) => sum + p.z, 0) / line.length;
      lines.push({ line, avgZ });
    }

    lines.sort((a, b) => a.avgZ - b.avgZ);

    lines.forEach(({ line, avgZ }) => {
      // Fade lines based on depth
      ctx.globalAlpha = Math.max(0.3, Math.min(1, 0.5 - avgZ / 500));
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      for (let j = 1; j < line.length; j++) {
        ctx.lineTo(line[j].x, line[j].y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  drawDayContent(day, events, center, c) {
    const ctx = this.ctx;
    const hasEvents = events.length > 0;
    const scale = Math.max(0.6, Math.min(1.3, center.scale));

    // Only draw if reasonably visible
    if (scale < 0.5) return;

    // Fade based on depth
    ctx.globalAlpha = Math.max(0.4, Math.min(1, 0.6 - center.z / 400));

    // Day number
    const fontSize = Math.round(13 * scale);
    ctx.font = `${day.isToday ? 'bold ' : ''}${fontSize}px 'Orbitron', sans-serif`;
    ctx.fillStyle = hasEvents ? PAYMENT_TYPES[events[0]?.type]?.color : c.onSurface;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const dayY = hasEvents ? center.y - 7 * scale : center.y;
    ctx.fillText(day.day.toString(), center.x, dayY);

    // Weekday
    const weekday = WEEKDAYS[day.date.getDay() === 0 ? 6 : day.date.getDay() - 1];
    ctx.font = `500 ${Math.round(8 * scale)}px 'Orbitron', sans-serif`;
    ctx.fillStyle = c.onSurfaceVariant;
    ctx.fillText(weekday, center.x, center.y - 18 * scale);

    // Event amount
    if (hasEvents && scale > 0.7) {
      const amount = events[0].amount >= 1000
        ? `€${(events[0].amount/1000).toFixed(0)}k`
        : `€${events[0].amount}`;
      ctx.font = `${Math.round(9 * scale)}px 'Orbitron', sans-serif`;
      ctx.fillStyle = PAYMENT_TYPES[events[0].type]?.color;
      ctx.fillText(amount, center.x, center.y + 9 * scale);
    }

    ctx.globalAlpha = 1;
  }

  hitTest(px, py, days, R, w, centerX, centerY, perspective) {
    const totalDays = days.length;

    for (let i = 0; i < totalDays; i++) {
      const center = this.mobius.getDayCenter(i, totalDays, R, w, centerX, centerY, perspective);
      const dx = px - center.x;
      const dy = py - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only front-facing segments
      if (center.z < 100 && dist < 30 * center.scale) {
        return i;
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
  const rafRef = useRef(null);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(-1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalType, setModalType] = useState('altro');
  const [modalAmount, setModalAmount] = useState('');

  // Days of the current month only
  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toDateString();

    const result = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      result.push({
        day: i,
        date,
        isToday: date.toDateString() === todayStr,
      });
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

  // Resize observer
  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });

    resizeObserver.observe(wrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Setup and render
  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;

    if (!mobiusRef.current) {
      mobiusRef.current = new MobiusStrip();
      rendererRef.current = new MobiusRenderer(canvasRef.current, mobiusRef.current);
    }

    rendererRef.current.setupCanvas(canvasSize.width, canvasSize.height);

    const render = () => {
      rendererRef.current.render(days, eventsByDate, hoveredDay, colors, cellColors);
    };

    render();

    // No animation loop needed - render on demand
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [canvasSize, days, eventsByDate, hoveredDay, colors, cellColors]);

  // Mouse wheel to scroll/rotate
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!mobiusRef.current || !rendererRef.current) return;

    mobiusRef.current.rotationAngle += e.deltaY * 0.002;
    rendererRef.current.render(days, eventsByDate, hoveredDay, colors, cellColors);
  }, [days, eventsByDate, hoveredDay, colors, cellColors]);

  // Mouse move for hover
  const handleMouseMove = useCallback((e) => {
    if (!mobiusRef.current || !rendererRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const padding = 16;
    const R = Math.min(canvasSize.width - padding * 2, canvasSize.height - padding * 2) * 0.38;
    const w = R * 0.5;
    const perspective = Math.max(canvasSize.width, canvasSize.height) * 1.2;

    const idx = rendererRef.current.hitTest(
      px, py, days, R, w, canvasSize.width / 2, canvasSize.height / 2, perspective
    );
    setHoveredDay(idx);
  }, [days, canvasSize]);

  // Click to add event
  const handleClick = useCallback((e) => {
    if (hoveredDay >= 0 && days[hoveredDay]) {
      setModalDate(days[hoveredDay].date);
      setModalType('altro');
      setModalAmount('');
      setModalOpen(true);
    }
  }, [hoveredDay, days]);

  const handleAddEvent = () => {
    const numAmount = Number(modalAmount);
    if (numAmount > 0 && modalDate) {
      setEvents(prev => [...prev, { type: modalType, amount: numAmount, date: modalDate }]);
      setModalOpen(false);
    }
  };

  const goToToday = () => setCurrentDate(new Date());
  const goPrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: colors.background }}>
      {/* Canvas - full page */}
      <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }}>
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredDay(-1)}
          onClick={handleClick}
          style={{ display: 'block', width: '100%', height: '100%', cursor: hoveredDay >= 0 ? 'pointer' : 'default' }}
        />
      </div>

      {/* Header inside the center */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        pointerEvents: 'auto',
      }}>
        <span style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '22px',
          fontWeight: 600,
          textTransform: 'capitalize',
          color: colors.onSurface,
        }}>
          {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={goPrevMonth}
            style={{ background: headerColors.background, border: 'none', color: headerColors.text, padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button onClick={goToToday}
            style={{ fontFamily: "'Orbitron', sans-serif", background: headerColors.background, border: 'none', color: headerColors.text, padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: '13px' }}>
            Oggi
          </button>
          <button onClick={goNextMonth}
            style={{ background: headerColors.background, border: 'none', color: headerColors.text, padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 11, color: colors.onSurfaceVariant, fontFamily: "'Orbitron', sans-serif" }}>
          Scorri per ruotare
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
