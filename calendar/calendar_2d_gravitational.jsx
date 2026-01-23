import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTheme } from '../src/context/ThemeContext';

const BASE_CONFIG = {
  cols: 7,
  rows: 6,
  padding: 0,
  headerHeight: 30,
  animationSpeed: 0.08,
  gravityStrength: 0.15,
  gravityRadius: 2.5,
  gridSubdivisions: 4,
};

const PAYMENT_TYPES = {
  mutui: { label: 'Mutui', icon: '🏠', color: '#dc2626', multiplier: 1.20 },
  riscossione: { label: 'Riscossione', icon: '⚠️', color: '#ea580c', multiplier: 1.15 },
  stipendi: { label: 'Stipendi', icon: '💼', color: '#ca8a04', multiplier: 1.10 },
  imposte: { label: 'Imposte', icon: '🏛️', color: '#16a34a', multiplier: 1.05 },
  altro: { label: 'Altro', icon: '📌', color: '#2563eb', multiplier: 1.0 },
};

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

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

const WEEKDAYS_COLORS = {
  light: {
    standard: { background: '#e9eff0', text: '#006877' },
    medium: { background: '#e3e9eb', text: '#006877' },
    high: { background: '#dee3e5', text: '#006877' },
  },
  dark: {
    standard: { background: '#1b2122', text: '#83d2e3' },
    medium: { background: '#23292a', text: '#83d2e3' },
    high: { background: '#2b3133', text: '#83d2e3' },
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

const calculateMass = (events) => {
  if (!events?.length) return 0;
  return events.reduce((total, e) => {
    const mult = PAYMENT_TYPES[e.type]?.multiplier || 1;
    return total + Math.log10(e.amount + 1) * mult * 100;
  }, 0);
};

// ============================================
// GRAVITATIONAL FIELD MESH
// ============================================
class GravitationalMesh {
  constructor(config) {
    this.config = config;
    this.cols = config.cols;
    this.rows = config.rows;
    this.subdivisions = config.gridSubdivisions;
    this.gridCols = config.cols * this.subdivisions;
    this.gridRows = config.rows * this.subdivisions;
    this.vertices = [];
    this.targetVertices = [];
    this.masses = [];
    this.massPositions = [];
    this.updateDimensions(config.canvasWidth, config.canvasHeight);
    this.initVertices();
  }

  updateDimensions(width, height) {
    this.config.canvasWidth = width;
    this.config.canvasHeight = height;
    this.gridLeft = this.config.padding;
    this.gridTop = this.config.padding + this.config.headerHeight;
    this.totalWidth = width - this.config.padding * 2;
    this.totalHeight = height - this.config.padding * 2 - this.config.headerHeight;
    this.baseCellWidth = this.totalWidth / this.cols;
    this.baseCellHeight = this.totalHeight / this.rows;
    this.subCellWidth = this.totalWidth / this.gridCols;
    this.subCellHeight = this.totalHeight / this.gridRows;
  }

  resize(width, height) {
    this.updateDimensions(width, height);
    this.vertices = [];
    this.targetVertices = [];
    this.initVertices();
    this.calculateGravitationalField();
  }

  initVertices() {
    for (let row = 0; row <= this.gridRows; row++) {
      for (let col = 0; col <= this.gridCols; col++) {
        const x = this.gridLeft + col * this.subCellWidth;
        const y = this.gridTop + row * this.subCellHeight;
        this.vertices.push({ x, y, baseX: x, baseY: y });
        this.targetVertices.push({ x, y });
      }
    }
  }

  getVertexIndex(row, col) {
    return row * (this.gridCols + 1) + col;
  }

  getVertex(row, col) {
    return this.vertices[this.getVertexIndex(row, col)];
  }

  setMasses(cellMasses, eventsByDate, calendarDays) {
    this.masses = cellMasses;
    this.massPositions = [];

    calendarDays.forEach((day, idx) => {
      if (!day.isCurrentMonth) return;
      const events = eventsByDate[day.date?.toDateString()] || [];
      const mass = calculateMass(events);
      if (mass > 0) {
        const cellRow = Math.floor(idx / this.cols);
        const cellCol = idx % this.cols;
        const centerX = this.gridLeft + (cellCol + 0.5) * this.baseCellWidth;
        const centerY = this.gridTop + (cellRow + 0.5) * this.baseCellHeight;
        this.massPositions.push({ x: centerX, y: centerY, mass, cellIdx: idx });
      }
    });

    this.calculateGravitationalField();
  }

  calculateGravitationalField() {
    const { gravityStrength, gravityRadius } = this.config;
    const maxDisplacement = Math.min(this.baseCellWidth, this.baseCellHeight) * 0.4;

    for (let row = 0; row <= this.gridRows; row++) {
      for (let col = 0; col <= this.gridCols; col++) {
        const vIdx = this.getVertexIndex(row, col);
        const vertex = this.vertices[vIdx];

        let totalDx = 0;
        let totalDy = 0;

        for (const massPoint of this.massPositions) {
          const dx = massPoint.x - vertex.baseX;
          const dy = massPoint.y - vertex.baseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const influenceRadius = gravityRadius * Math.max(this.baseCellWidth, this.baseCellHeight);

          if (distance < influenceRadius && distance > 1) {
            const normalizedMass = Math.min(massPoint.mass / 500, 1);
            const falloff = 1 - Math.pow(distance / influenceRadius, 2);
            const strength = gravityStrength * normalizedMass * falloff * falloff;

            totalDx += (dx / distance) * strength * maxDisplacement;
            totalDy += (dy / distance) * strength * maxDisplacement;
          }
        }

        const displacement = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
        if (displacement > maxDisplacement) {
          const scale = maxDisplacement / displacement;
          totalDx *= scale;
          totalDy *= scale;
        }

        this.targetVertices[vIdx] = {
          x: vertex.baseX + totalDx,
          y: vertex.baseY + totalDy
        };
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

  getCellBounds(cellIndex) {
    const cellRow = Math.floor(cellIndex / this.cols);
    const cellCol = cellIndex % this.cols;

    const startRow = cellRow * this.subdivisions;
    const startCol = cellCol * this.subdivisions;
    const endRow = startRow + this.subdivisions;
    const endCol = startCol + this.subdivisions;

    const tl = this.getVertex(startRow, startCol);
    const tr = this.getVertex(startRow, endCol);
    const bl = this.getVertex(endRow, startCol);
    const br = this.getVertex(endRow, endCol);

    return { tl, tr, bl, br, startRow, startCol, endRow, endCol };
  }

  getCellCenter(cellIndex) {
    const bounds = this.getCellBounds(cellIndex);
    return {
      x: (bounds.tl.x + bounds.tr.x + bounds.bl.x + bounds.br.x) / 4,
      y: (bounds.tl.y + bounds.tr.y + bounds.bl.y + bounds.br.y) / 4,
    };
  }

  getColumnCenter(col) {
    return this.gridLeft + (col + 0.5) * this.baseCellWidth;
  }

  hitTest(px, py) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const idx = row * this.cols + col;
        const bounds = this.getCellBounds(idx);
        const minX = Math.min(bounds.tl.x, bounds.bl.x);
        const maxX = Math.max(bounds.tr.x, bounds.br.x);
        const minY = Math.min(bounds.tl.y, bounds.tr.y);
        const maxY = Math.max(bounds.bl.y, bounds.br.y);
        if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
          return idx;
        }
      }
    }
    return -1;
  }
}

// ============================================
// RENDERER WITH CURVED GRID
// ============================================
class GravitationalRenderer {
  constructor(canvas, mesh, colors, weekdaysColors, cellColors) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mesh = mesh;
    this.colors = colors;
    this.weekdaysColors = weekdaysColors;
    this.cellColors = cellColors;
    this.setupCanvas();
  }

  setColors(colors, weekdaysColors, cellColors) {
    this.colors = colors;
    this.weekdaysColors = weekdaysColors;
    this.cellColors = cellColors;
  }

  setupCanvas() {
    const { canvasWidth, canvasHeight } = this.mesh.config;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = canvasWidth * dpr;
    this.canvas.height = canvasHeight * dpr;
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  render(calendarDays, eventsByDate, hoveredCell, showGrid) {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.mesh.config;
    const c = this.colors;

    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    this.drawWeekdays();

    calendarDays.forEach((day, i) => {
      const events = eventsByDate[day.date?.toDateString()] || [];
      const mass = calculateMass(events);
      if (mass > 0 && day.isCurrentMonth) {
        this.drawCellGlow(i, events, mass);
      }
    });

    calendarDays.forEach((day, i) => {
      const events = eventsByDate[day.date?.toDateString()] || [];
      const mass = calculateMass(events);
      this.drawCell(i, day, events, mass, i === hoveredCell);
    });

    if (showGrid) this.drawCurvedGrid();

    calendarDays.forEach((day, i) => {
      const events = eventsByDate[day.date?.toDateString()] || [];
      this.drawCellContent(i, day, events);
    });
  }

  drawWeekdays() {
    const ctx = this.ctx;
    const mesh = this.mesh;
    const { padding, headerHeight, canvasWidth } = mesh.config;
    const wc = this.weekdaysColors;

    ctx.fillStyle = wc.background;
    ctx.fillRect(0, padding, canvasWidth, headerHeight);

    ctx.font = "600 12px 'Orbitron', sans-serif";
    ctx.fillStyle = wc.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const y = padding + headerHeight / 2;

    for (let col = 0; col < 7; col++) {
      ctx.fillText(WEEKDAYS[col], mesh.getColumnCenter(col), y);
    }
  }

  drawCurvedGrid() {
    const ctx = this.ctx;
    const mesh = this.mesh;
    const c = this.colors;

    ctx.strokeStyle = c.outlineVariant + '60';
    ctx.lineWidth = 0.5;

    for (let row = 1; row < mesh.gridRows; row++) {
      ctx.beginPath();
      const firstV = mesh.getVertex(row, 0);
      ctx.moveTo(firstV.x, firstV.y);

      for (let col = 1; col <= mesh.gridCols; col++) {
        const v = mesh.getVertex(row, col);
        const prevV = mesh.getVertex(row, col - 1);

        const cpX = (prevV.x + v.x) / 2;
        const cpY = (prevV.y + v.y) / 2;

        ctx.quadraticCurveTo(prevV.x + (v.x - prevV.x) * 0.5, prevV.y, cpX, cpY);
        if (col === mesh.gridCols) {
          ctx.lineTo(v.x, v.y);
        }
      }
      ctx.stroke();
    }

    for (let col = 1; col < mesh.gridCols; col++) {
      ctx.beginPath();
      const firstV = mesh.getVertex(0, col);
      ctx.moveTo(firstV.x, firstV.y);

      for (let row = 1; row <= mesh.gridRows; row++) {
        const v = mesh.getVertex(row, col);
        const prevV = mesh.getVertex(row - 1, col);

        const cpX = (prevV.x + v.x) / 2;
        const cpY = (prevV.y + v.y) / 2;

        ctx.quadraticCurveTo(prevV.x, prevV.y + (v.y - prevV.y) * 0.5, cpX, cpY);
        if (row === mesh.gridRows) {
          ctx.lineTo(v.x, v.y);
        }
      }
      ctx.stroke();
    }

    ctx.strokeStyle = c.outline + '40';
    ctx.lineWidth = 1;

    for (let row = 0; row <= mesh.rows; row++) {
      const gridRow = row * mesh.subdivisions;
      ctx.beginPath();
      const firstV = mesh.getVertex(gridRow, 0);
      ctx.moveTo(firstV.x, firstV.y);

      for (let col = 0; col < mesh.gridCols; col++) {
        const v = mesh.getVertex(gridRow, col + 1);
        ctx.lineTo(v.x, v.y);
      }
      ctx.stroke();
    }

    for (let col = 0; col <= mesh.cols; col++) {
      const gridCol = col * mesh.subdivisions;
      ctx.beginPath();
      const firstV = mesh.getVertex(0, gridCol);
      ctx.moveTo(firstV.x, firstV.y);

      for (let row = 0; row < mesh.gridRows; row++) {
        const v = mesh.getVertex(row + 1, gridCol);
        ctx.lineTo(v.x, v.y);
      }
      ctx.stroke();
    }
  }

  drawCellGlow(index, events, mass) {
    const ctx = this.ctx;
    const center = this.mesh.getCellCenter(index);
    const color = events[0] ? PAYMENT_TYPES[events[0].type]?.color : this.colors.primary;
    const normalizedMass = Math.min(mass / 500, 1);
    const radius = 50 + normalizedMass * 40;

    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    gradient.addColorStop(0, color + '30');
    gradient.addColorStop(0.4, color + '15');
    gradient.addColorStop(0.7, color + '08');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCell(index, day, events, mass, isHovered) {
    const ctx = this.ctx;
    const mesh = this.mesh;
    const bounds = mesh.getCellBounds(index);
    const hasEvents = events.length > 0 && day.isCurrentMonth;
    const color = hasEvents ? PAYMENT_TYPES[events[0].type]?.color : null;
    const c = this.colors;
    const cc = this.cellColors;

    const row = Math.floor(index / 7);
    const col = index % 7;
    const isEven = (row + col) % 2 === 0;

    ctx.beginPath();

    const topEdge = [];
    const bottomEdge = [];
    const leftEdge = [];
    const rightEdge = [];

    for (let c = bounds.startCol; c <= bounds.endCol; c++) {
      topEdge.push(mesh.getVertex(bounds.startRow, c));
      bottomEdge.push(mesh.getVertex(bounds.endRow, c));
    }
    for (let r = bounds.startRow; r <= bounds.endRow; r++) {
      leftEdge.push(mesh.getVertex(r, bounds.startCol));
      rightEdge.push(mesh.getVertex(r, bounds.endCol));
    }

    ctx.moveTo(topEdge[0].x, topEdge[0].y);

    for (let i = 1; i < topEdge.length; i++) {
      ctx.lineTo(topEdge[i].x, topEdge[i].y);
    }

    for (let i = 1; i < rightEdge.length; i++) {
      ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
    }

    for (let i = bottomEdge.length - 2; i >= 0; i--) {
      ctx.lineTo(bottomEdge[i].x, bottomEdge[i].y);
    }

    for (let i = leftEdge.length - 2; i > 0; i--) {
      ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    }

    ctx.closePath();

    if (!day.isCurrentMonth) {
      ctx.fillStyle = cc.notCurrentMonth;
    } else if (isHovered) {
      ctx.fillStyle = cc.hover;
    } else if (hasEvents) {
      ctx.fillStyle = color + '12';
    } else {
      ctx.fillStyle = isEven ? cc.checker1 : cc.checker2;
    }
    ctx.fill();

    if (hasEvents) {
      ctx.strokeStyle = color + (isHovered ? 'cc' : '66');
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (isHovered && day.isCurrentMonth) {
      ctx.strokeStyle = c.outline;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawCellContent(index, day, events) {
    const ctx = this.ctx;
    const center = this.mesh.getCellCenter(index);
    const bounds = this.mesh.getCellBounds(index);
    const hasEvents = events.length > 0 && day.isCurrentMonth;
    const c = this.colors;

    const cellWidth = Math.abs(bounds.tr.x - bounds.tl.x);
    const cellHeight = Math.abs(bounds.bl.y - bounds.tl.y);
    const scale = Math.min(Math.max(Math.sqrt(cellWidth * cellHeight) / Math.sqrt(this.mesh.baseCellWidth * this.mesh.baseCellHeight), 0.6), 1.5);

    if (!day.isCurrentMonth) ctx.globalAlpha = 0.3;

    ctx.font = `${day.isToday ? 'bold ' : ''}${Math.round(14 * scale)}px 'Orbitron', sans-serif`;
    ctx.fillStyle = hasEvents ? c.onSurface : c.onSurfaceVariant;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const dayY = hasEvents ? center.y - cellHeight * 0.22 : center.y;
    ctx.fillText(day.day.toString(), center.x, dayY);

    if (hasEvents) {
      const maxEvents = Math.min(events.length, 2);
      const spacing = 15 * scale;
      const startY = center.y + 6 * scale;

      events.slice(0, maxEvents).forEach((event, i) => {
        const evColor = PAYMENT_TYPES[event.type]?.color || c.primary;
        const icon = PAYMENT_TYPES[event.type]?.icon || '•';
        const amount = event.amount >= 1000
          ? `${(event.amount/1000).toFixed(0)}k`
          : `${event.amount}`;

        ctx.font = `${Math.round(11 * scale)}px 'Orbitron', sans-serif`;
        ctx.fillStyle = evColor;
        ctx.fillText(`${icon} ${amount}`, center.x, startY + i * spacing);
      });

      if (events.length > 2) {
        ctx.font = `${Math.round(10 * scale)}px 'Orbitron', sans-serif`;
        ctx.fillStyle = c.onSurfaceVariant;
        ctx.fillText(`+${events.length - 2}`, center.x, startY + 2 * spacing);
      }
    }

    ctx.globalAlpha = 1;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Calendario2DGravitational() {
  const { mode, contrast } = useTheme();

  const colors = useMemo(() => MD3_COLORS[mode][contrast], [mode, contrast]);
  const headerColors = useMemo(() => CALENDAR_HEADER_COLORS[mode][contrast], [mode, contrast]);
  const weekdaysColors = useMemo(() => WEEKDAYS_COLORS[mode][contrast], [mode, contrast]);
  const cellColors = useMemo(() => CELL_COLORS[mode][contrast], [mode, contrast]);

  const canvasWrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const meshRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const dataRef = useRef({
    calendarDays: [],
    eventsByDate: {},
    hoveredCell: -1,
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(-1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalType, setModalType] = useState('altro');
  const [modalAmount, setModalAmount] = useState('');

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setColors(colors, weekdaysColors, cellColors);
    }
  }, [colors, weekdaysColors, cellColors]);

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

  const masses = useMemo(() => {
    return calendarDays.map(day => {
      if (!day.isCurrentMonth) return 0;
      const dayEvents = eventsByDate[day.date?.toDateString()] || [];
      return calculateMass(dayEvents);
    });
  }, [calendarDays, eventsByDate]);

  useEffect(() => {
    dataRef.current = { calendarDays, eventsByDate, hoveredCell };
  }, [calendarDays, eventsByDate, hoveredCell]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.setMasses(masses, eventsByDate, calendarDays);
    }
  }, [masses, eventsByDate, calendarDays]);

  useEffect(() => {
    if (!canvasWrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const gridHeight = width * (630 / 860);
          const canvasHeight = BASE_CONFIG.headerHeight + gridHeight;
          setCanvasSize({ width: Math.floor(width), height: Math.floor(canvasHeight) });
        }
      }
    });

    resizeObserver.observe(canvasWrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;

    const config = { ...BASE_CONFIG, canvasWidth: canvasSize.width, canvasHeight: canvasSize.height };

    if (!meshRef.current) {
      meshRef.current = new GravitationalMesh(config);
      rendererRef.current = new GravitationalRenderer(canvasRef.current, meshRef.current, colors, weekdaysColors, cellColors);
    } else {
      meshRef.current.resize(canvasSize.width, canvasSize.height);
      rendererRef.current.setupCanvas();
    }

    if (!rafRef.current) {
      const animate = () => {
        meshRef.current.update();
        const { calendarDays, eventsByDate, hoveredCell } = dataRef.current;
        rendererRef.current.render(calendarDays, eventsByDate, hoveredCell, true);
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
  }, [canvasSize, colors, weekdaysColors, cellColors]);

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

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div style={{ fontFamily: "'Exo 2', sans-serif", background: colors.background, color: colors.onSurface }}>
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
      <div ref={canvasWrapperRef} style={{ background: colors.background }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={() => setHoveredCell(-1)}
          style={{ display: 'block', cursor: 'pointer' }}
        />
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
              <label style={{ display: 'block', fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 5, fontFamily: "'Orbitron', sans-serif" }}>IMPORTO</label>
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
