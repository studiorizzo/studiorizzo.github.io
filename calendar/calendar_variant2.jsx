import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTheme } from '../src/context/ThemeContext';

const BASE_CONFIG = {
  // Möbius strip parameters
  radius: 180,           // Raggio principale del nastro
  stripWidth: 80,        // Larghezza del nastro (altezza visiva)
  segments: 42,          // Numero di giorni
  radialSegments: 60,    // Risoluzione lungo il nastro
  twists: 1,             // Numero di mezzi giri (1 = Möbius classico)
  perspective: 800,
  autoRotateSpeed: 0.008,
};

const PAYMENT_TYPES = {
  mutui: { label: 'Mutui', icon: '🏠', color: '#dc2626', multiplier: 1.20 },
  riscossione: { label: 'Riscossione', icon: '⚠️', color: '#ea580c', multiplier: 1.15 },
  stipendi: { label: 'Stipendi', icon: '💼', color: '#ca8a04', multiplier: 1.10 },
  imposte: { label: 'Imposte', icon: '🏛️', color: '#16a34a', multiplier: 1.05 },
  altro: { label: 'Altro', icon: '📌', color: '#2563eb', multiplier: 1.0 },
};

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

// Colori MD3
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
// MÖBIUS STRIP - TRUE PARAMETRIC SURFACE
// ============================================
class MobiusStrip {
  constructor(config) {
    this.R = config.radius;
    this.w = config.stripWidth;
    this.twists = config.twists;
    this.perspective = config.perspective;
    this.segments = config.segments;

    this.rotationX = 0.4;
    this.rotationY = 0;
    this.rotationZ = 0;

    this.centerX = 0;
    this.centerY = 0;
  }

  setCenter(x, y) {
    this.centerX = x;
    this.centerY = y;
  }

  // Parametric Möbius strip
  // u: 0 to 2π (around the loop)
  // v: -1 to 1 (across the width)
  getPoint3D(u, v) {
    const halfTwist = Math.PI * this.twists;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    const cosHalf = Math.cos(halfTwist * u / (2 * Math.PI));
    const sinHalf = Math.sin(halfTwist * u / (2 * Math.PI));

    const x = (this.R + (this.w / 2) * v * cosHalf) * cosU;
    const y = (this.R + (this.w / 2) * v * cosHalf) * sinU;
    const z = (this.w / 2) * v * sinHalf;

    return { x, y, z };
  }

  rotate3D(point) {
    let { x, y, z } = point;

    // Rotate X
    let cosA = Math.cos(this.rotationX);
    let sinA = Math.sin(this.rotationX);
    let y1 = y * cosA - z * sinA;
    let z1 = y * sinA + z * cosA;
    y = y1; z = z1;

    // Rotate Y
    cosA = Math.cos(this.rotationY);
    sinA = Math.sin(this.rotationY);
    let x1 = x * cosA + z * sinA;
    z1 = -x * sinA + z * cosA;
    x = x1; z = z1;

    // Rotate Z
    cosA = Math.cos(this.rotationZ);
    sinA = Math.sin(this.rotationZ);
    x1 = x * cosA - y * sinA;
    y1 = x * sinA + y * cosA;
    x = x1; y = y1;

    return { x, y, z };
  }

  project(point3D) {
    const rotated = this.rotate3D(point3D);
    const scale = this.perspective / (this.perspective + rotated.z);
    return {
      x: this.centerX + rotated.x * scale,
      y: this.centerY + rotated.y * scale,
      z: rotated.z,
      scale,
    };
  }

  // Get surface normal at a point
  getNormal(u, v) {
    const eps = 0.01;
    const p0 = this.getPoint3D(u, v);
    const pu = this.getPoint3D(u + eps, v);
    const pv = this.getPoint3D(u, v + eps);

    const tu = { x: pu.x - p0.x, y: pu.y - p0.y, z: pu.z - p0.z };
    const tv = { x: pv.x - p0.x, y: pv.y - p0.y, z: pv.z - p0.z };

    // Cross product
    const n = {
      x: tu.y * tv.z - tu.z * tv.y,
      y: tu.z * tv.x - tu.x * tv.z,
      z: tu.x * tv.y - tu.y * tv.x,
    };
    const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z) || 1;
    n.x /= len; n.y /= len; n.z /= len;

    const rotated = this.rotate3D(n);
    return rotated.z; // Facing camera = positive
  }

  // Get day segment boundaries on the strip
  getDayU(dayIndex) {
    // 42 days spread around 2π
    return (dayIndex / this.segments) * Math.PI * 2;
  }

  // Get quad vertices for a day segment
  getDayQuad(dayIndex, vSteps = 8) {
    const u1 = this.getDayU(dayIndex);
    const u2 = this.getDayU(dayIndex + 1);

    const points = [];
    const projected = [];

    // Create strip of points for this day
    for (let i = 0; i <= vSteps; i++) {
      const v = (i / vSteps) * 2 - 1; // -1 to 1

      const p1 = this.getPoint3D(u1, v);
      const p2 = this.getPoint3D(u2, v);

      points.push({ left: p1, right: p2 });
      projected.push({
        left: this.project(p1),
        right: this.project(p2),
      });
    }

    // Calculate average Z and normal for sorting/lighting
    const centerU = (u1 + u2) / 2;
    const normal = this.getNormal(centerU, 0);

    let avgZ = 0;
    projected.forEach(p => {
      avgZ += p.left.z + p.right.z;
    });
    avgZ /= projected.length * 2;

    return { points, projected, avgZ, normal, u1, u2 };
  }

  // Get line along the strip for vertical day separators
  getDayLine(dayIndex, vSteps = 12) {
    const u = this.getDayU(dayIndex);
    const line = [];

    for (let i = 0; i <= vSteps; i++) {
      const v = (i / vSteps) * 2 - 1;
      const p = this.project(this.getPoint3D(u, v));
      line.push(p);
    }

    return line;
  }

  // Get center point of a day segment
  getDayCenter(dayIndex) {
    const u = this.getDayU(dayIndex + 0.5);
    const p3d = this.getPoint3D(u, 0);
    return this.project(p3d);
  }
}

// ============================================
// RENDERER
// ============================================
class MobiusRenderer {
  constructor(canvas, mobius, colors) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mobius = mobius;
    this.colors = colors;
  }

  setColors(colors) {
    this.colors = colors;
  }

  setupCanvas(width, height) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.mobius.setCenter(width / 2, height / 2);
    this.width = width;
    this.height = height;
  }

  render(calendarDays, eventsByDate, hoveredDay) {
    const ctx = this.ctx;
    const c = this.colors;

    // Clear
    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, this.width, this.height);

    // Collect all day segments with depth info
    const segments = [];
    for (let i = 0; i < 42; i++) {
      const quad = this.mobius.getDayQuad(i);
      segments.push({
        index: i,
        quad,
        day: calendarDays[i],
        events: eventsByDate[calendarDays[i]?.date?.toDateString()] || [],
      });
    }

    // Sort back to front
    segments.sort((a, b) => a.quad.avgZ - b.quad.avgZ);

    // Draw segments
    segments.forEach(seg => {
      this.drawDaySegment(seg, seg.index === hoveredDay);
    });

    // Draw vertical lines (day separators)
    this.drawDayLines(segments);
  }

  drawDaySegment(seg, isHovered) {
    const ctx = this.ctx;
    const { quad, day, events, index } = seg;
    const c = this.colors;
    const hasEvents = events.length > 0 && day?.isCurrentMonth;

    // Calculate lighting
    const lighting = Math.max(0.3, Math.min(1, 0.5 + quad.normal * 0.5));

    // Base color
    let baseColor;
    const weekNum = Math.floor(index / 7);
    const dayNum = index % 7;
    const isEven = (weekNum + dayNum) % 2 === 0;

    if (!day?.isCurrentMonth) {
      baseColor = this.applyLighting('#8899aa', lighting * 0.6);
    } else if (isHovered && quad.normal > 0) {
      baseColor = this.applyLighting('#aabbcc', lighting);
    } else if (hasEvents) {
      const evColor = PAYMENT_TYPES[events[0].type]?.color || c.primary;
      baseColor = this.applyLighting(evColor, lighting * 0.5);
    } else {
      baseColor = this.applyLighting(isEven ? '#c8d8e8' : '#b0c4d8', lighting);
    }

    // Draw the curved surface segment
    const proj = quad.projected;

    ctx.beginPath();
    // Left edge (bottom to top)
    ctx.moveTo(proj[0].left.x, proj[0].left.y);
    for (let i = 1; i < proj.length; i++) {
      ctx.lineTo(proj[i].left.x, proj[i].left.y);
    }
    // Top edge
    ctx.lineTo(proj[proj.length - 1].right.x, proj[proj.length - 1].right.y);
    // Right edge (top to bottom)
    for (let i = proj.length - 2; i >= 0; i--) {
      ctx.lineTo(proj[i].right.x, proj[i].right.y);
    }
    ctx.closePath();

    ctx.fillStyle = baseColor;
    ctx.fill();

    // Draw content if facing camera
    if (quad.normal > 0.1 && day) {
      this.drawDayContent(seg);
    }
  }

  drawDayLines(segments) {
    const ctx = this.ctx;
    const c = this.colors;

    // Draw vertical lines for each day
    ctx.strokeStyle = c.outline;
    ctx.lineWidth = 1;

    for (let i = 0; i <= 42; i++) {
      const line = this.mobius.getDayLine(i);

      // Check if line is visible (front-facing)
      const midU = this.mobius.getDayU(i);
      const normal = this.mobius.getNormal(midU, 0);

      if (normal > -0.2) {
        ctx.globalAlpha = Math.max(0.2, Math.min(1, normal + 0.5));
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        for (let j = 1; j < line.length; j++) {
          ctx.lineTo(line[j].x, line[j].y);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawDayContent(seg) {
    const ctx = this.ctx;
    const { quad, day, events, index } = seg;
    const c = this.colors;
    const hasEvents = events.length > 0 && day.isCurrentMonth;

    const center = this.mobius.getDayCenter(index);
    const scale = Math.min(center.scale, 1.2);

    // Opacity based on facing direction
    const alpha = Math.max(0.3, Math.min(1, quad.normal));

    if (!day.isCurrentMonth) {
      ctx.globalAlpha = alpha * 0.4;
    } else {
      ctx.globalAlpha = alpha;
    }

    // Day number
    const fontSize = Math.round(12 * scale);
    ctx.font = `${day.isToday ? 'bold ' : ''}${fontSize}px 'Orbitron', sans-serif`;
    ctx.fillStyle = hasEvents ? '#ffffff' : c.onSurface;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const dayY = hasEvents ? center.y - 8 * scale : center.y;
    ctx.fillText(day.day.toString(), center.x, dayY);

    // Weekday label for first row
    if (index < 7) {
      ctx.font = `600 ${Math.round(9 * scale)}px 'Orbitron', sans-serif`;
      ctx.fillStyle = c.primary;
      ctx.fillText(WEEKDAYS[index], center.x, center.y - 22 * scale);
    }

    // Event info
    if (hasEvents && scale > 0.6) {
      const event = events[0];
      const evColor = PAYMENT_TYPES[event.type]?.color || c.primary;
      const amount = event.amount >= 1000
        ? `€${(event.amount/1000).toFixed(0)}k`
        : `€${event.amount}`;

      ctx.font = `${Math.round(9 * scale)}px 'Orbitron', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(amount, center.x, center.y + 8 * scale);
    }

    ctx.globalAlpha = 1;
  }

  applyLighting(hexColor, lighting) {
    const hex = hexColor.replace('#', '');
    const r = Math.round(parseInt(hex.substr(0, 2), 16) * lighting);
    const g = Math.round(parseInt(hex.substr(2, 2), 16) * lighting);
    const b = Math.round(parseInt(hex.substr(4, 2), 16) * lighting);
    return `rgb(${r}, ${g}, ${b})`;
  }

  hitTest(px, py, calendarDays) {
    // Simple radial hit test based on day center positions
    for (let i = 0; i < 42; i++) {
      const center = this.mobius.getDayCenter(i);
      const normal = this.mobius.getNormal(this.mobius.getDayU(i + 0.5), 0);

      if (normal > 0) { // Only front-facing
        const dx = px - center.x;
        const dy = py - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 25 * center.scale) {
          return i;
        }
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
  const headerColors = useMemo(() => CALENDAR_HEADER_COLORS[mode][contrast], [mode, contrast]);

  const canvasWrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const mobiusRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  const dataRef = useRef({ calendarDays: [], eventsByDate: {}, hoveredDay: -1 });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(-1);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startRotX: 0, startRotY: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalType, setModalType] = useState('altro');
  const [modalAmount, setModalAmount] = useState('');

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setColors(colors);
    }
  }, [colors]);

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

  useEffect(() => {
    dataRef.current = { calendarDays, eventsByDate, hoveredDay };
  }, [calendarDays, eventsByDate, hoveredDay]);

  useEffect(() => {
    if (!canvasWrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    resizeObserver.observe(canvasWrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;

    if (!mobiusRef.current) {
      mobiusRef.current = new MobiusStrip(BASE_CONFIG);
      rendererRef.current = new MobiusRenderer(canvasRef.current, mobiusRef.current, colors);
    }

    rendererRef.current.setupCanvas(canvasSize.width, canvasSize.height);

    if (!rafRef.current) {
      const animate = () => {
        if (autoRotate && !isDragging) {
          mobiusRef.current.rotationY += BASE_CONFIG.autoRotateSpeed;
        }

        const { calendarDays, eventsByDate, hoveredDay } = dataRef.current;
        rendererRef.current.render(calendarDays, eventsByDate, hoveredDay);
        rafRef.current = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [canvasSize, colors, autoRotate, isDragging]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRotX: mobiusRef.current?.rotationX || 0,
      startRotY: mobiusRef.current?.rotationY || 0,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!mobiusRef.current || !canvasRef.current) return;

    if (isDragging) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      mobiusRef.current.rotationY = dragRef.current.startRotY + dx * 0.01;
      mobiusRef.current.rotationX = dragRef.current.startRotX + dy * 0.01;
    } else {
      const rect = canvasRef.current.getBoundingClientRect();
      const idx = rendererRef.current?.hitTest(
        e.clientX - rect.left,
        e.clientY - rect.top,
        dataRef.current.calendarDays
      );
      setHoveredDay(idx);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback((e) => {
    if (!rendererRef.current || !canvasRef.current || isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const idx = rendererRef.current.hitTest(
      e.clientX - rect.left,
      e.clientY - rect.top,
      dataRef.current.calendarDays
    );

    if (idx >= 0 && dataRef.current.calendarDays[idx]?.isCurrentMonth) {
      setModalDate(dataRef.current.calendarDays[idx].date);
      setModalType('altro');
      setModalAmount('');
      setModalOpen(true);
    }
  }, [isDragging]);

  const handleAddEvent = () => {
    const numAmount = Number(modalAmount);
    if (numAmount > 0 && modalDate) {
      setEvents(prev => [...prev, { type: modalType, amount: numAmount, date: modalDate }]);
      setModalOpen(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Exo 2', sans-serif", background: colors.background, color: colors.onSurface, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: headerColors.background, flexShrink: 0
      }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 500, textTransform: 'capitalize', color: headerColors.text }}>
          {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setAutoRotate(!autoRotate)}
            style={{ fontFamily: "'Orbitron', sans-serif", background: autoRotate ? headerColors.text + '20' : 'transparent', border: `1px solid ${headerColors.text}40`, color: headerColors.text, padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }}>
            {autoRotate ? '⏸ Stop' : '▶ Ruota'}
          </button>
          <button onClick={() => setCurrentDate(new Date())}
            style={{ fontFamily: "'Orbitron', sans-serif", background: 'transparent', border: `1px solid ${headerColors.text}40`, color: headerColors.text, padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '14px' }}>Oggi</button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            style={{ background: 'transparent', border: `1px solid ${headerColors.text}40`, color: headerColors.text, padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            style={{ background: 'transparent', border: `1px solid ${headerColors.text}40`, color: headerColors.text, padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasWrapperRef} style={{ flex: 1, background: colors.background, minHeight: 450 }}>
        <canvas ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setHoveredDay(-1); setIsDragging(false); }}
          onClick={handleClick}
          style={{ display: 'block', width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
        />
      </div>

      {/* Instructions */}
      <div style={{ padding: '8px 16px', background: colors.surfaceContainer, fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center' }}>
        Trascina per ruotare il nastro di Möbius • Click su un giorno per aggiungere eventi
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
