import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTheme } from '../src/context/ThemeContext';

const BASE_CONFIG = {
  cols: 7,
  rows: 6,
  padding: 0,
  headerHeight: 30,
  animationSpeed: 0.08,
  // Parametri per deformazione (attualmente disabilitati)
  gravityStrength: 0,
  gravityRadius: 2.5,
  localFalloff: 0.6,
  borderElasticity: 0,
  curvature: 0,
};

const PAYMENT_TYPES = {
  mutui: { label: 'Mutui', icon: '🏠', color: '#dc2626', multiplier: 1.20 },
  riscossione: { label: 'Riscossione', icon: '⚠️', color: '#ea580c', multiplier: 1.15 },
  stipendi: { label: 'Stipendi', icon: '💼', color: '#ca8a04', multiplier: 1.10 },
  imposte: { label: 'Imposte', icon: '🏛️', color: '#16a34a', multiplier: 1.05 },
  altro: { label: 'Altro', icon: '📌', color: '#2563eb', multiplier: 1.0 },
};

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

// Colori MD3 per tema e contrasto
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

// Colori header calendario
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

// Colori giorni settimana
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

// Colori celle calendario
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
// MESH AVANZATA CON DEFORMAZIONE GRAVITAZIONALE
// ============================================
class AdvancedVertexMesh {
  constructor(config) {
    this.config = config;
    this.cols = config.cols;
    this.rows = config.rows;
    this.vertexCols = config.cols + 1;
    this.vertexRows = config.rows + 1;
    this.vertices = [];
    this.targetVertices = [];
    this.masses = new Array(config.cols * config.rows).fill(0);
    this.cellCenters = [];
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
  }

  resize(width, height) {
    this.updateDimensions(width, height);
    this.vertices = [];
    this.targetVertices = [];
    this.cellCenters = [];
    this.initVertices();
    if (this.masses.some(m => m > 0)) {
      this.calculateTargetPositions();
    }
  }

  initVertices() {
    // Inizializza vertici
    for (let row = 0; row <= this.rows; row++) {
      for (let col = 0; col <= this.cols; col++) {
        const x = this.gridLeft + col * this.baseCellWidth;
        const y = this.gridTop + row * this.baseCellHeight;
        this.vertices.push({
          x, y,
          baseX: x,
          baseY: y,
          // Flag per vertici sui bordi
          isTopEdge: row === 0,
          isBottomEdge: row === this.rows,
          isLeftEdge: col === 0,
          isRightEdge: col === this.cols,
        });
        this.targetVertices.push({ x, y });
      }
    }

    // Calcola centri celle base
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.cellCenters.push({
          x: this.gridLeft + (col + 0.5) * this.baseCellWidth,
          y: this.gridTop + (row + 0.5) * this.baseCellHeight,
          row,
          col,
        });
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

  setMasses(masses, emptyMass = 100) {
    // emptyMass: massa per celle vuote (configurabile dall'utente)
    this.emptyMass = emptyMass;
    this.masses = masses.map(m => {
      if (m < 0) return emptyMass; // Fuori mese
      if (m === 0) return emptyMass; // Mese corrente senza eventi
      return emptyMass + m; // Mese corrente con eventi
    });
    this.maxMass = Math.max(...this.masses, 1);
    this.minMassForGravity = emptyMass;
    this.calculateTargetPositions();
  }

  // Calcola distanza tra vertice e centro cella (in unità celle)
  getDistanceInCells(vRow, vCol, cellRow, cellCol) {
    const dx = vCol - (cellCol + 0.5);
    const dy = vRow - (cellRow + 0.5);
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Calcola influenza gravitazionale con falloff locale
  calculateGravityInfluence(vRow, vCol) {
    const { gravityStrength, gravityRadius, localFalloff } = this.config;
    let totalDx = 0;
    let totalDy = 0;
    let totalWeight = 0;

    for (let cellRow = 0; cellRow < this.rows; cellRow++) {
      for (let cellCol = 0; cellCol < this.cols; cellCol++) {
        const cellIdx = cellRow * this.cols + cellCol;
        const mass = this.masses[cellIdx];

        // Solo celle con eventi (massa > baseMass) generano attrazione
        if (mass <= this.minMassForGravity) continue;

        const distance = this.getDistanceInCells(vRow, vCol, cellRow, cellCol);

        // Falloff basato sulla distanza
        if (distance > gravityRadius) continue;

        // Normalizza solo la massa "extra" rispetto alla base
        const extraMass = mass - this.minMassForGravity;
        const maxExtraMass = this.maxMass - this.minMassForGravity;
        const normalizedMass = maxExtraMass > 0 ? extraMass / maxExtraMass : 0;
        const falloff = Math.pow(1 - distance / gravityRadius, localFalloff);
        const influence = normalizedMass * falloff * gravityStrength;

        // Direzione verso il centro della cella
        const cellCenterX = this.gridLeft + (cellCol + 0.5) * this.baseCellWidth;
        const cellCenterY = this.gridTop + (cellRow + 0.5) * this.baseCellHeight;

        const vBaseX = this.gridLeft + vCol * this.baseCellWidth;
        const vBaseY = this.gridTop + vRow * this.baseCellHeight;

        const dx = cellCenterX - vBaseX;
        const dy = cellCenterY - vBaseY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        totalDx += (dx / dist) * influence * this.baseCellWidth;
        totalDy += (dy / dist) * influence * this.baseCellHeight;
        totalWeight += influence;
      }
    }

    return { dx: totalDx, dy: totalDy, weight: totalWeight };
  }

  calculateTargetPositions() {
    const { borderElasticity } = this.config;

    // Prima: calcola redistribuzione proporzionale come base
    const rowWidths = [];
    for (let row = 0; row < this.rows; row++) {
      const rowMasses = [];
      for (let col = 0; col < this.cols; col++) {
        const idx = row * this.cols + col;
        rowMasses.push(this.masses[idx]);
      }
      const totalRowMass = rowMasses.reduce((a, b) => a + b, 0);
      // Se totalRowMass è 0, distribuisci equamente
      if (totalRowMass === 0) {
        rowWidths.push(rowMasses.map(() => this.totalWidth / this.cols));
      } else {
        rowWidths.push(rowMasses.map(m => (m / totalRowMass) * this.totalWidth));
      }
    }

    const colHeights = [];
    for (let col = 0; col < this.cols; col++) {
      const colMasses = [];
      for (let row = 0; row < this.rows; row++) {
        const idx = row * this.cols + col;
        colMasses.push(this.masses[idx]);
      }
      const totalColMass = colMasses.reduce((a, b) => a + b, 0);
      // Se totalColMass è 0, distribuisci equamente
      if (totalColMass === 0) {
        colHeights.push(colMasses.map(() => this.totalHeight / this.rows));
      } else {
        colHeights.push(colMasses.map(m => (m / totalColMass) * this.totalHeight));
      }
    }

    // Calcola posizioni target per ogni vertice
    for (let row = 0; row <= this.rows; row++) {
      for (let col = 0; col <= this.cols; col++) {
        const vIdx = this.getVertexIndex(row, col);
        const v = this.vertices[vIdx];

        // Posizione base da redistribuzione proporzionale
        let baseX = this.gridLeft;
        if (col > 0) {
          let sumX = 0;
          let count = 0;

          if (row > 0) {
            let rowX = this.gridLeft;
            for (let c = 0; c < col; c++) {
              rowX += rowWidths[row - 1][c];
            }
            sumX += rowX;
            count++;
          }

          if (row < this.rows) {
            let rowX = this.gridLeft;
            for (let c = 0; c < col; c++) {
              rowX += rowWidths[row][c];
            }
            sumX += rowX;
            count++;
          }

          baseX = sumX / count;
        }

        let baseY = this.gridTop;
        if (row > 0) {
          let sumY = 0;
          let count = 0;

          if (col > 0) {
            let colY = this.gridTop;
            for (let r = 0; r < row; r++) {
              colY += colHeights[col - 1][r];
            }
            sumY += colY;
            count++;
          }

          if (col < this.cols) {
            let colY = this.gridTop;
            for (let r = 0; r < row; r++) {
              colY += colHeights[col][r];
            }
            sumY += colY;
            count++;
          }

          baseY = sumY / count;
        }

        // Aggiungi influenza gravitazionale
        const gravity = this.calculateGravityInfluence(row, col);
        let targetX = baseX + gravity.dx;
        let targetY = baseY + gravity.dy;

        // Applica elasticità bordi
        if (v.isLeftEdge) {
          targetX = this.gridLeft + (targetX - this.gridLeft) * borderElasticity;
        }
        if (v.isRightEdge) {
          targetX = this.gridLeft + this.totalWidth + (targetX - (this.gridLeft + this.totalWidth)) * borderElasticity;
        }
        if (v.isTopEdge) {
          targetY = this.gridTop + (targetY - this.gridTop) * borderElasticity;
        }
        if (v.isBottomEdge) {
          targetY = this.gridTop + this.totalHeight + (targetY - (this.gridTop + this.totalHeight)) * borderElasticity;
        }

        // Clamp ai bordi del canvas
        targetX = Math.max(this.gridLeft, Math.min(this.gridLeft + this.totalWidth, targetX));
        targetY = Math.max(this.gridTop, Math.min(this.gridTop + this.totalHeight, targetY));

        this.targetVertices[vIdx] = { x: targetX, y: targetY };
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

  // Calcola punti di controllo per curve di Bezier
  getCellCurveData(cellIndex) {
    const v = this.getCellVertices(cellIndex);
    const { curvature } = this.config;
    const mass = this.masses[cellIndex];
    // Curvatura basata sulla massa extra (sopra la base)
    const extraMass = Math.max(0, mass - (this.minMassForGravity || 0));
    const maxExtraMass = this.maxMass - (this.minMassForGravity || 0);
    const massInfluence = maxExtraMass > 0 ? extraMass / maxExtraMass : 0;

    // Curvatura aumenta con la massa extra
    const curve = curvature * (0.5 + massInfluence * 0.5);

    // Centro della cella
    const cx = (v.topLeft.x + v.topRight.x + v.bottomLeft.x + v.bottomRight.x) / 4;
    const cy = (v.topLeft.y + v.topRight.y + v.bottomLeft.y + v.bottomRight.y) / 4;

    // Punti medi dei lati
    const topMid = {
      x: (v.topLeft.x + v.topRight.x) / 2,
      y: (v.topLeft.y + v.topRight.y) / 2
    };
    const bottomMid = {
      x: (v.bottomLeft.x + v.bottomRight.x) / 2,
      y: (v.bottomLeft.y + v.bottomRight.y) / 2
    };
    const leftMid = {
      x: (v.topLeft.x + v.bottomLeft.x) / 2,
      y: (v.topLeft.y + v.bottomLeft.y) / 2
    };
    const rightMid = {
      x: (v.topRight.x + v.bottomRight.x) / 2,
      y: (v.topRight.y + v.bottomRight.y) / 2
    };

    // Punti di controllo curvati verso il centro
    const topCtrl = {
      x: topMid.x,
      y: topMid.y + (cy - topMid.y) * curve
    };
    const bottomCtrl = {
      x: bottomMid.x,
      y: bottomMid.y + (cy - bottomMid.y) * curve
    };
    const leftCtrl = {
      x: leftMid.x + (cx - leftMid.x) * curve,
      y: leftMid.y
    };
    const rightCtrl = {
      x: rightMid.x + (cx - rightMid.x) * curve,
      y: rightMid.y
    };

    return {
      vertices: v,
      center: { x: cx, y: cy },
      controls: { top: topCtrl, bottom: bottomCtrl, left: leftCtrl, right: rightCtrl },
      midpoints: { top: topMid, bottom: bottomMid, left: leftMid, right: rightMid },
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
// RENDERER CON CURVE DI BEZIER
// ============================================
class AdvancedCalendarRenderer {
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

    // Sfondo
    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    this.drawWeekdays();

    // Ombre/glow per celle con eventi
    calendarDays.forEach((day, i) => {
      const events = eventsByDate[day.date?.toDateString()] || [];
      const mass = calculateMass(events);
      if (mass > 0 && day.isCurrentMonth) {
        this.drawCellShadow(i, events, mass);
      }
    });

    // Disegna celle con curve
    calendarDays.forEach((day, i) => {
      const events = eventsByDate[day.date?.toDateString()] || [];
      const mass = calculateMass(events);
      this.drawCurvedCell(i, day, events, mass, i === hoveredCell);
    });

    // Griglia curva
    if (showGrid) this.drawCurvedMeshLines();

    // Contenuto celle
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

  drawCurvedMeshLines() {
    const ctx = this.ctx;
    const mesh = this.mesh;
    const wc = this.weekdaysColors;

    ctx.strokeStyle = wc.text;
    ctx.lineWidth = 1;

    // Linee orizzontali curve
    for (let row = 1; row < mesh.rows; row++) {
      ctx.beginPath();
      for (let col = 0; col < mesh.cols; col++) {
        const cellIdx = (row - 1) * mesh.cols + col;
        const curveData = mesh.getCellCurveData(cellIdx);
        const v = curveData.vertices;
        const ctrl = curveData.controls;

        if (col === 0) {
          ctx.moveTo(v.bottomLeft.x, v.bottomLeft.y);
        }

        // Curva quadratica verso il punto di controllo bottom
        ctx.quadraticCurveTo(ctrl.bottom.x, ctrl.bottom.y, v.bottomRight.x, v.bottomRight.y);
      }
      ctx.stroke();
    }

    // Linee verticali curve
    for (let col = 1; col < mesh.cols; col++) {
      ctx.beginPath();
      for (let row = 0; row < mesh.rows; row++) {
        const cellIdx = row * mesh.cols + (col - 1);
        const curveData = mesh.getCellCurveData(cellIdx);
        const v = curveData.vertices;
        const ctrl = curveData.controls;

        if (row === 0) {
          ctx.moveTo(v.topRight.x, v.topRight.y);
        }

        ctx.quadraticCurveTo(ctrl.right.x, ctrl.right.y, v.bottomRight.x, v.bottomRight.y);
      }
      ctx.stroke();
    }
  }

  drawCellShadow(index, events, mass) {
    const ctx = this.ctx;
    const center = this.mesh.getCellCenter(index);
    const color = events[0] ? PAYMENT_TYPES[events[0].type]?.color : this.colors.primary;
    const radius = 40 + Math.min(mass / 500, 1) * 30;

    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    gradient.addColorStop(0, color + '25');
    gradient.addColorStop(0.5, color + '10');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCurvedCell(index, day, events, mass, isHovered) {
    const ctx = this.ctx;
    const curveData = this.mesh.getCellCurveData(index);
    const v = curveData.vertices;
    const ctrl = curveData.controls;
    const hasEvents = events.length > 0 && day.isCurrentMonth;
    const color = hasEvents ? PAYMENT_TYPES[events[0].type]?.color : null;
    const c = this.colors;
    const cc = this.cellColors;

    // Pattern scacchiera
    const row = Math.floor(index / 7);
    const col = index % 7;
    const isEven = (row + col) % 2 === 0;

    // Disegna cella con curve di Bezier
    ctx.beginPath();
    ctx.moveTo(v.topLeft.x, v.topLeft.y);

    // Lato superiore (curva verso il basso se c'è massa)
    ctx.quadraticCurveTo(ctrl.top.x, ctrl.top.y, v.topRight.x, v.topRight.y);

    // Lato destro
    ctx.quadraticCurveTo(ctrl.right.x, ctrl.right.y, v.bottomRight.x, v.bottomRight.y);

    // Lato inferiore
    ctx.quadraticCurveTo(ctrl.bottom.x, ctrl.bottom.y, v.bottomLeft.x, v.bottomLeft.y);

    // Lato sinistro
    ctx.quadraticCurveTo(ctrl.left.x, ctrl.left.y, v.topLeft.x, v.topLeft.y);

    ctx.closePath();

    // Colore riempimento
    if (!day.isCurrentMonth) {
      ctx.fillStyle = cc.notCurrentMonth;
    } else if (isHovered) {
      ctx.fillStyle = cc.hover;
    } else if (hasEvents) {
      ctx.fillStyle = color + '15';
    } else {
      ctx.fillStyle = isEven ? cc.checker1 : cc.checker2;
    }
    ctx.fill();

    // Bordo solo per celle con eventi (la griglia definisce i bordi normali)
    if (hasEvents) {
      ctx.strokeStyle = color + (isHovered ? 'cc' : '88');
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawCellContent(index, day, events) {
    const ctx = this.ctx;
    const center = this.mesh.getCellCenter(index);
    const v = this.mesh.getCellVertices(index);
    const hasEvents = events.length > 0 && day.isCurrentMonth;
    const c = this.colors;

    const cellWidth = Math.abs(v.topRight.x - v.topLeft.x);
    const cellHeight = Math.abs(v.bottomLeft.y - v.topLeft.y);
    const scale = Math.min(Math.max(Math.sqrt(cellWidth * cellHeight) / Math.sqrt(this.mesh.baseCellWidth * this.mesh.baseCellHeight), 0.5), 1.8);

    if (!day.isCurrentMonth) ctx.globalAlpha = 0.3;

    ctx.font = `${day.isToday ? 'bold ' : ''}${Math.round(14 * scale)}px 'Orbitron', sans-serif`;
    ctx.fillStyle = hasEvents ? c.onSurface : c.onSurfaceVariant;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const dayY = hasEvents ? center.y - cellHeight * 0.25 : center.y;
    ctx.fillText(day.day.toString(), center.x, dayY);

    if (hasEvents) {
      const maxEvents = Math.min(events.length, 2);
      const spacing = 16 * scale;
      const startY = center.y + 5 * scale;

      events.slice(0, maxEvents).forEach((event, i) => {
        const evColor = PAYMENT_TYPES[event.type]?.color || c.primary;
        const icon = PAYMENT_TYPES[event.type]?.icon || '•';
        const amount = event.amount >= 1000
          ? `€${(event.amount/1000).toFixed(0)}k`
          : `€${event.amount}`;

        ctx.font = `${Math.round(12 * scale)}px 'Orbitron', sans-serif`;
        ctx.fillStyle = evColor;
        ctx.fillText(`${icon} ${amount}`, center.x, startY + i * spacing);
      });

      if (events.length > 2) {
        ctx.font = `${Math.round(12 * scale)}px 'Orbitron', sans-serif`;
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
export default function CalendarVariant1() {
  const { mode, contrast } = useTheme();

  const colors = useMemo(() => {
    return MD3_COLORS[mode][contrast];
  }, [mode, contrast]);

  const headerColors = useMemo(() => {
    return CALENDAR_HEADER_COLORS[mode][contrast];
  }, [mode, contrast]);

  const weekdaysColors = useMemo(() => {
    return WEEKDAYS_COLORS[mode][contrast];
  }, [mode, contrast]);

  const cellColors = useMemo(() => {
    return CELL_COLORS[mode][contrast];
  }, [mode, contrast]);

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
  const [emptyMass, setEmptyMass] = useState(100);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalType, setModalType] = useState('altro');
  const [modalAmount, setModalAmount] = useState('');

  // Aggiorna colori nel renderer quando cambiano
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
      if (!day.isCurrentMonth) return -1;
      const dayEvents = eventsByDate[day.date?.toDateString()] || [];
      return calculateMass(dayEvents);
    });
  }, [calendarDays, eventsByDate]);

  useEffect(() => {
    dataRef.current = { calendarDays, eventsByDate, hoveredCell };
  }, [calendarDays, eventsByDate, hoveredCell]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.setMasses(masses, emptyMass);
    }
  }, [masses, emptyMass]);

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
      meshRef.current = new AdvancedVertexMesh(config);
      rendererRef.current = new AdvancedCalendarRenderer(canvasRef.current, meshRef.current, colors, weekdaysColors, cellColors);
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
  }, [canvasSize, colors, weekdaysColors]);

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
    <div
      style={{
        fontFamily: "'Exo 2', sans-serif",
        background: colors.background,
        color: colors.onSurface,
      }}
    >
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
          <input
            type="number"
            value={emptyMass}
            onChange={(e) => setEmptyMass(Number(e.target.value) || 0)}
            style={{
              width: 70,
              padding: '6px 8px',
              background: 'transparent',
              border: `1px solid ${headerColors.text}40`,
              borderRadius: 4,
              color: headerColors.text,
              fontSize: '14px',
              fontFamily: "'Orbitron', sans-serif",
            }}
          />
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
