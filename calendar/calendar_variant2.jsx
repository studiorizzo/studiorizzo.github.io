import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTheme } from '../src/context/ThemeContext';

const BASE_CONFIG = {
  cols: 7,
  rows: 6,
  headerHeight: 40,
  // Parametri nastro curvo con twist
  bendAngle: Math.PI * 0.8,  // Quanto si curva il nastro (non un loop completo)
  twistAngle: Math.PI * 0.5, // Mezzo giro di twist (Möbius)
  radius: 350,               // Raggio della curva
  perspective: 1000,
  autoRotateSpeed: 0.002,
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
      background: '#F5FAFC',
      surface: '#F5FAFC',
      surfaceContainer: '#E9EFF0',
      surfaceContainerHigh: '#E3E9EB',
      onSurface: '#171D1E',
      onSurfaceVariant: '#3F484A',
      outline: '#6F797B',
      outlineVariant: '#BFC8CB',
      primary: '#006877',
      onPrimary: '#FFFFFF',
    },
    medium: {
      background: '#F5FAFC',
      surface: '#F5FAFC',
      surfaceContainer: '#E9EFF0',
      surfaceContainerHigh: '#E3E9EB',
      onSurface: '#0C1213',
      onSurfaceVariant: '#2B3436',
      outline: '#4B5456',
      outlineVariant: '#7B8486',
      primary: '#003C45',
      onPrimary: '#FFFFFF',
    },
    high: {
      background: '#F5FAFC',
      surface: '#F5FAFC',
      surfaceContainer: '#E9EFF0',
      surfaceContainerHigh: '#E3E9EB',
      onSurface: '#000000',
      onSurfaceVariant: '#000000',
      outline: '#252E30',
      outlineVariant: '#252E30',
      primary: '#003139',
      onPrimary: '#FFFFFF',
    },
  },
  dark: {
    standard: {
      background: '#0E1416',
      surface: '#0E1416',
      surfaceContainer: '#1B2122',
      surfaceContainerHigh: '#252B2C',
      onSurface: '#DEE3E5',
      onSurfaceVariant: '#BFC8CB',
      outline: '#899295',
      outlineVariant: '#3F484A',
      primary: '#83D2E3',
      onPrimary: '#00363E',
    },
    medium: {
      background: '#0E1416',
      surface: '#0E1416',
      surfaceContainer: '#1B2122',
      surfaceContainerHigh: '#252B2C',
      onSurface: '#F2F7F9',
      onSurfaceVariant: '#C3CCD0',
      outline: '#C3CCD0',
      outlineVariant: '#5B6467',
      primary: '#87D6E7',
      onPrimary: '#003139',
    },
    high: {
      background: '#0E1416',
      surface: '#0E1416',
      surfaceContainer: '#1B2122',
      surfaceContainerHigh: '#252B2C',
      onSurface: '#FFFFFF',
      onSurfaceVariant: '#FFFFFF',
      outline: '#E8F2F4',
      outlineVariant: '#BBC4C7',
      primary: '#D2F6FF',
      onPrimary: '#000000',
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

const CELL_COLORS = {
  light: {
    standard: { notCurrentMonth: '#e3e9eb', checker1: '#eff5f6', checker2: '#e9eff0', hover: '#d5dbdd' },
    medium: { notCurrentMonth: '#e3e9eb', checker1: '#eff5f6', checker2: '#e9eff0', hover: '#d5dbdd' },
    high: { notCurrentMonth: '#e3e9eb', checker1: '#eff5f6', checker2: '#e9eff0', hover: '#d5dbdd' },
  },
  dark: {
    standard: { notCurrentMonth: '#252b2c', checker1: '#171d1e', checker2: '#1b2122', hover: '#343a3c' },
    medium: { notCurrentMonth: '#252b2c', checker1: '#171d1e', checker2: '#1b2122', hover: '#343a3c' },
    high: { notCurrentMonth: '#252b2c', checker1: '#171d1e', checker2: '#1b2122', hover: '#343a3c' },
  },
};

// ============================================
// TWISTED RIBBON GEOMETRY
// ============================================
class TwistedRibbon {
  constructor(config) {
    this.config = config;
    this.bendAngle = config.bendAngle;
    this.twistAngle = config.twistAngle;
    this.radius = config.radius;
    this.perspective = config.perspective;

    // Dimensioni griglia
    this.cellWidth = 70;
    this.cellHeight = 55;
    this.gridWidth = this.cellWidth * 7;
    this.gridHeight = this.cellHeight * 6;

    // Rotazione camera
    this.rotationX = 0.2;
    this.rotationY = 0;

    this.centerX = 0;
    this.centerY = 0;
  }

  setCenter(x, y) {
    this.centerX = x;
    this.centerY = y;
  }

  // Trasforma punto 2D griglia -> 3D nastro curvo con twist
  gridTo3D(gridX, gridY) {
    // Normalizza posizione sulla griglia (0-1)
    const u = gridX / this.gridWidth;  // 0 = sinistra, 1 = destra
    const v = gridY / this.gridHeight; // 0 = top, 1 = bottom

    // Angolo lungo la curva del nastro (basato sulla posizione orizzontale)
    const angle = (u - 0.5) * this.bendAngle;

    // Twist progressivo lungo la larghezza
    const twist = (u - 0.5) * this.twistAngle;

    // Posizione verticale sulla strip (centrata)
    const localY = (v - 0.5) * this.gridHeight;

    // Applica twist alla posizione Y
    const twistedY = localY * Math.cos(twist);
    const twistedZ = localY * Math.sin(twist);

    // Curva il nastro
    const x = Math.sin(angle) * this.radius;
    const z = (Math.cos(angle) - 1) * this.radius + twistedZ;
    const y = twistedY;

    return { x, y, z };
  }

  rotate3D(point) {
    let { x, y, z } = point;

    // Rotazione X
    const cosX = Math.cos(this.rotationX);
    const sinX = Math.sin(this.rotationX);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    y = y1;
    z = z1;

    // Rotazione Y
    const cosY = Math.cos(this.rotationY);
    const sinY = Math.sin(this.rotationY);
    const x1 = x * cosY + z * sinY;
    const z2 = -x * sinY + z * cosY;
    x = x1;
    z = z2;

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

  getCellVertices(row, col) {
    const x1 = col * this.cellWidth;
    const x2 = (col + 1) * this.cellWidth;
    const y1 = row * this.cellHeight;
    const y2 = (row + 1) * this.cellHeight;

    const p1 = this.project(this.gridTo3D(x1, y1)); // top-left
    const p2 = this.project(this.gridTo3D(x2, y1)); // top-right
    const p3 = this.project(this.gridTo3D(x2, y2)); // bottom-right
    const p4 = this.project(this.gridTo3D(x1, y2)); // bottom-left

    const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;
    const avgScale = (p1.scale + p2.scale + p3.scale + p4.scale) / 4;

    return {
      topLeft: p1,
      topRight: p2,
      bottomRight: p3,
      bottomLeft: p4,
      avgZ,
      avgScale,
    };
  }

  // Calcola normale per lighting
  getNormal(row, col) {
    const cx = (col + 0.5) * this.cellWidth;
    const cy = (row + 0.5) * this.cellHeight;

    const eps = 2;
    const p0 = this.gridTo3D(cx, cy);
    const px = this.gridTo3D(cx + eps, cy);
    const py = this.gridTo3D(cx, cy + eps);

    const tu = { x: px.x - p0.x, y: px.y - p0.y, z: px.z - p0.z };
    const tv = { x: py.x - p0.x, y: py.y - p0.y, z: py.z - p0.z };

    const normal = {
      x: tu.y * tv.z - tu.z * tv.y,
      y: tu.z * tv.x - tu.x * tv.z,
      z: tu.x * tv.y - tu.y * tv.x,
    };

    const len = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2) || 1;
    normal.x /= len;
    normal.y /= len;
    normal.z /= len;

    const rotated = this.rotate3D(normal);
    // Lighting: quanto la faccia guarda verso la camera (z positivo)
    return Math.max(0.4, Math.min(1, 0.5 + rotated.z * 0.5));
  }

  // Controlla se la cella è visibile (faccia verso la camera)
  isFacingCamera(row, col) {
    const cx = (col + 0.5) * this.cellWidth;
    const cy = (row + 0.5) * this.cellHeight;

    const eps = 2;
    const p0 = this.gridTo3D(cx, cy);
    const px = this.gridTo3D(cx + eps, cy);
    const py = this.gridTo3D(cx, cy + eps);

    const tu = { x: px.x - p0.x, y: px.y - p0.y, z: px.z - p0.z };
    const tv = { x: py.x - p0.x, y: py.y - p0.y, z: py.z - p0.z };

    const normal = {
      x: tu.y * tv.z - tu.z * tv.y,
      y: tu.z * tv.x - tu.x * tv.z,
      z: tu.x * tv.y - tu.y * tv.x,
    };

    const rotated = this.rotate3D(normal);
    return rotated.z > -0.3; // Mostra anche celle leggermente di lato
  }
}

// ============================================
// RENDERER
// ============================================
class TwistedCalendarRenderer {
  constructor(canvas, ribbon, colors, cellColors) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ribbon = ribbon;
    this.colors = colors;
    this.cellColors = cellColors;
  }

  setColors(colors, cellColors) {
    this.colors = colors;
    this.cellColors = cellColors;
  }

  setupCanvas(width, height) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.ribbon.setCenter(width / 2, height / 2);
  }

  render(calendarDays, eventsByDate, hoveredCell) {
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const c = this.colors;

    // Sfondo
    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, width, height);

    // Raccogli tutte le celle
    const cells = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const idx = row * 7 + col;
        const vertices = this.ribbon.getCellVertices(row, col);
        const lighting = this.ribbon.getNormal(row, col);
        const visible = this.ribbon.isFacingCamera(row, col);

        cells.push({
          idx,
          row,
          col,
          vertices,
          lighting,
          visible,
          day: calendarDays[idx],
          events: eventsByDate[calendarDays[idx]?.date?.toDateString()] || [],
        });
      }
    }

    // Ordina back-to-front
    cells.sort((a, b) => a.vertices.avgZ - b.vertices.avgZ);

    // Disegna celle
    cells.forEach(cell => {
      this.drawCell(cell, cell.idx === hoveredCell);
    });

    // Disegna header giorni settimana
    this.drawWeekdayHeaders();
  }

  drawCell(cell, isHovered) {
    const ctx = this.ctx;
    const { vertices, lighting, visible, day, events, row, col } = cell;
    const c = this.colors;
    const cc = this.cellColors;
    const hasEvents = events.length > 0 && day?.isCurrentMonth;

    // Pattern scacchiera
    const isEven = (row + col) % 2 === 0;

    // Disegna quadrilatero
    ctx.beginPath();
    ctx.moveTo(vertices.topLeft.x, vertices.topLeft.y);
    ctx.lineTo(vertices.topRight.x, vertices.topRight.y);
    ctx.lineTo(vertices.bottomRight.x, vertices.bottomRight.y);
    ctx.lineTo(vertices.bottomLeft.x, vertices.bottomLeft.y);
    ctx.closePath();

    // Colore base
    let baseColor;
    if (!day?.isCurrentMonth) {
      baseColor = cc.notCurrentMonth;
    } else if (isHovered && visible) {
      baseColor = cc.hover;
    } else if (hasEvents) {
      baseColor = PAYMENT_TYPES[events[0].type]?.color + '25';
    } else {
      baseColor = isEven ? cc.checker1 : cc.checker2;
    }

    ctx.fillStyle = this.applyLighting(baseColor, lighting);
    ctx.fill();

    // Bordo
    if (hasEvents) {
      ctx.strokeStyle = PAYMENT_TYPES[events[0].type]?.color + (isHovered ? 'cc' : '88');
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = c.outlineVariant + '50';
      ctx.lineWidth = 1;
    }
    ctx.stroke();

    // Contenuto solo se visibile
    if (visible && day && vertices.avgScale > 0.3) {
      this.drawCellContent(cell, vertices);
    }
  }

  applyLighting(color, lighting) {
    const hex = color.replace('#', '');
    let r, g, b, a = 1;

    if (hex.length === 8) {
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
      a = parseInt(hex.substr(6, 2), 16) / 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else {
      return color;
    }

    r = Math.round(r * lighting);
    g = Math.round(g * lighting);
    b = Math.round(b * lighting);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  drawCellContent(cell, vertices) {
    const ctx = this.ctx;
    const { day, events } = cell;
    const c = this.colors;
    const hasEvents = events.length > 0 && day.isCurrentMonth;

    // Centro cella
    const cx = (vertices.topLeft.x + vertices.topRight.x + vertices.bottomLeft.x + vertices.bottomRight.x) / 4;
    const cy = (vertices.topLeft.y + vertices.topRight.y + vertices.bottomLeft.y + vertices.bottomRight.y) / 4;

    const scale = Math.min(vertices.avgScale, 1.1);

    if (!day.isCurrentMonth) ctx.globalAlpha = 0.4;

    // Numero giorno
    ctx.font = `${day.isToday ? 'bold ' : ''}${Math.round(14 * scale)}px 'Orbitron', sans-serif`;
    ctx.fillStyle = hasEvents ? c.onSurface : c.onSurfaceVariant;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const dayY = hasEvents ? cy - 8 * scale : cy;
    ctx.fillText(day.day.toString(), cx, dayY);

    // Eventi
    if (hasEvents && scale > 0.6) {
      const event = events[0];
      const evColor = PAYMENT_TYPES[event.type]?.color || c.primary;
      const amount = event.amount >= 1000
        ? `€${(event.amount/1000).toFixed(0)}k`
        : `€${event.amount}`;

      ctx.font = `${Math.round(10 * scale)}px 'Orbitron', sans-serif`;
      ctx.fillStyle = evColor;
      ctx.fillText(amount, cx, cy + 10 * scale);

      if (events.length > 1) {
        ctx.fillStyle = c.onSurfaceVariant;
        ctx.fillText(`+${events.length - 1}`, cx, cy + 20 * scale);
      }
    }

    ctx.globalAlpha = 1;
  }

  drawWeekdayHeaders() {
    const ctx = this.ctx;
    const c = this.colors;
    const ribbon = this.ribbon;

    ctx.font = "600 11px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let col = 0; col < 7; col++) {
      const vertices = ribbon.getCellVertices(0, col);
      const visible = ribbon.isFacingCamera(0, col);

      if (visible && vertices.avgScale > 0.4) {
        const cx = (vertices.topLeft.x + vertices.topRight.x) / 2;
        const cy = (vertices.topLeft.y + vertices.topRight.y) / 2 - 12 * vertices.avgScale;

        ctx.globalAlpha = Math.min(1, vertices.avgScale);
        ctx.fillStyle = c.primary;
        ctx.fillText(WEEKDAYS[col], cx, cy);
        ctx.globalAlpha = 1;
      }
    }
  }

  hitTest(px, py, calendarDays) {
    const cells = [];

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const idx = row * 7 + col;
        const vertices = this.ribbon.getCellVertices(row, col);
        const visible = this.ribbon.isFacingCamera(row, col);
        if (visible) {
          cells.push({ idx, vertices });
        }
      }
    }

    // Front to back per hit test
    cells.sort((a, b) => b.vertices.avgZ - a.vertices.avgZ);

    for (const cell of cells) {
      if (this.pointInQuad(px, py, cell.vertices)) {
        return cell.idx;
      }
    }

    return -1;
  }

  pointInQuad(px, py, v) {
    const points = [
      { x: v.topLeft.x, y: v.topLeft.y },
      { x: v.topRight.x, y: v.topRight.y },
      { x: v.bottomRight.x, y: v.bottomRight.y },
      { x: v.bottomLeft.x, y: v.bottomLeft.y },
    ];

    let inside = true;
    for (let i = 0; i < 4; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % 4];
      const cross = (p2.x - p1.x) * (py - p1.y) - (p2.y - p1.y) * (px - p1.x);
      if (cross < 0) {
        inside = false;
        break;
      }
    }

    return inside;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function CalendarVariant2() {
  const { mode, contrast } = useTheme();

  const colors = useMemo(() => MD3_COLORS[mode][contrast], [mode, contrast]);
  const headerColors = useMemo(() => CALENDAR_HEADER_COLORS[mode][contrast], [mode, contrast]);
  const cellColors = useMemo(() => CELL_COLORS[mode][contrast], [mode, contrast]);

  const canvasWrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const ribbonRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  const dataRef = useRef({ calendarDays: [], eventsByDate: {}, hoveredCell: -1 });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(-1);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startRotX: 0, startRotY: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalType, setModalType] = useState('altro');
  const [modalAmount, setModalAmount] = useState('');

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setColors(colors, cellColors);
    }
  }, [colors, cellColors]);

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
    dataRef.current = { calendarDays, eventsByDate, hoveredCell };
  }, [calendarDays, eventsByDate, hoveredCell]);

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

    if (!ribbonRef.current) {
      ribbonRef.current = new TwistedRibbon(BASE_CONFIG);
      rendererRef.current = new TwistedCalendarRenderer(canvasRef.current, ribbonRef.current, colors, cellColors);
    }

    rendererRef.current.setupCanvas(canvasSize.width, canvasSize.height);

    if (!rafRef.current) {
      const animate = () => {
        if (autoRotate && !isDragging) {
          ribbonRef.current.rotationY += BASE_CONFIG.autoRotateSpeed;
        }

        const { calendarDays, eventsByDate, hoveredCell } = dataRef.current;
        rendererRef.current.render(calendarDays, eventsByDate, hoveredCell);
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
  }, [canvasSize, colors, cellColors, autoRotate, isDragging]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRotX: ribbonRef.current?.rotationX || 0,
      startRotY: ribbonRef.current?.rotationY || 0,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!ribbonRef.current || !canvasRef.current) return;

    if (isDragging) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      ribbonRef.current.rotationY = dragRef.current.startRotY + dx * 0.005;
      ribbonRef.current.rotationX = Math.max(-0.5, Math.min(0.5, dragRef.current.startRotX + dy * 0.005));
    } else {
      const rect = canvasRef.current.getBoundingClientRect();
      const idx = rendererRef.current?.hitTest(
        e.clientX - rect.left,
        e.clientY - rect.top,
        dataRef.current.calendarDays
      );
      setHoveredCell(idx);
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

  const handleToday = () => setCurrentDate(new Date());

  return (
    <div style={{ fontFamily: "'Exo 2', sans-serif", background: colors.background, color: colors.onSurface, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: headerColors.background,
        flexShrink: 0
      }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 500, textTransform: 'capitalize', color: headerColors.text }}>
          {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: autoRotate ? headerColors.text + '20' : 'transparent',
              border: `1px solid ${headerColors.text}40`,
              color: headerColors.text,
              padding: '6px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {autoRotate ? '⏸ Stop' : '▶ Ruota'}
          </button>
          <button onClick={handleToday}
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

      {/* Canvas wrapper */}
      <div
        ref={canvasWrapperRef}
        style={{ flex: 1, background: colors.background, minHeight: 450 }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setHoveredCell(-1); setIsDragging(false); }}
          onClick={handleClick}
          style={{ display: 'block', width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
        />
      </div>

      {/* Istruzioni */}
      <div style={{ padding: '8px 16px', background: colors.surfaceContainer, fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center' }}>
        Trascina per ruotare il nastro • Click su una cella per aggiungere eventi
      </div>

      {/* Modal */}
      {modalOpen && modalDate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{ background: colors.surface, border: `1px solid ${colors.outlineVariant}`, borderRadius: 12, padding: 20, width: 360, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 5px', color: colors.onSurface, fontFamily: "'Orbitron', sans-serif" }}>Aggiungi Pagamento</h3>
            <p style={{ margin: '0 0 15px', color: colors.onSurfaceVariant, fontSize: 14, textTransform: 'capitalize' }}>
              {modalDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 5, fontFamily: "'Orbitron', sans-serif" }}>TIPO</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {Object.entries(PAYMENT_TYPES).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setModalType(k)}
                    style={{
                      padding: '8px 4px',
                      background: modalType === k ? v.color + '20' : colors.surfaceContainer,
                      border: `1px solid ${modalType === k ? v.color : colors.outlineVariant}`,
                      borderRadius: 6,
                      color: colors.onSurface,
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
              <label style={{ display: 'block', fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 5, fontFamily: "'Orbitron', sans-serif" }}>IMPORTO €</label>
              <input
                type="number"
                value={modalAmount}
                onChange={e => setModalAmount(e.target.value)}
                placeholder="0"
                autoFocus
                style={{
                  width: '100%',
                  padding: 10,
                  background: colors.surface,
                  border: `1px solid ${colors.outlineVariant}`,
                  borderRadius: 6,
                  color: colors.onSurface,
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
                      background: colors.surfaceContainer,
                      border: `1px solid ${colors.outlineVariant}`,
                      borderRadius: 4,
                      color: colors.onSurfaceVariant,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontFamily: "'Orbitron', sans-serif"
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
                  background: colors.surface,
                  border: `1px solid ${colors.outlineVariant}`,
                  borderRadius: 6,
                  color: colors.onSurfaceVariant,
                  cursor: 'pointer',
                  fontFamily: "'Orbitron', sans-serif"
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
                  background: Number(modalAmount) > 0 ? colors.primary : colors.surfaceContainer,
                  border: 'none',
                  borderRadius: 6,
                  color: Number(modalAmount) > 0 ? colors.onPrimary : colors.onSurfaceVariant,
                  cursor: Number(modalAmount) > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: "'Orbitron', sans-serif"
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
