import React, { useRef, useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../src/context/ThemeContext';

const PAYMENT_TYPES = {
  mutui: { label: 'Mutui', icon: 'M', color: '#dc2626', multiplier: 1.20 },
  riscossione: { label: 'Riscossione', icon: 'R', color: '#ea580c', multiplier: 1.15 },
  stipendi: { label: 'Stipendi', icon: 'S', color: '#ca8a04', multiplier: 1.10 },
  imposte: { label: 'Imposte', icon: 'I', color: '#16a34a', multiplier: 1.05 },
  altro: { label: 'Altro', icon: 'A', color: '#2563eb', multiplier: 1.0 },
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
      gridColor: '#BFC8CB',
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
      gridColor: '#7B8486',
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
      gridColor: '#252E30',
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
      gridColor: '#3F484A',
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
      gridColor: '#5B6467',
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
      gridColor: '#BBC4C7',
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

const calculateMass = (events) => {
  if (!events?.length) return 0;
  return events.reduce((total, e) => {
    const mult = PAYMENT_TYPES[e.type]?.multiplier || 1;
    return total + Math.log10(e.amount + 1) * mult * 100;
  }, 0);
};

// ============================================
// 3D ELASTIC SURFACE
// ============================================
function ElasticSurface({ calendarDays, eventsByDate, colors, onCellClick, hoveredCell, setHoveredCell }) {
  const meshRef = useRef();
  const gridRef = useRef();
  const { camera, raycaster, pointer } = useThree();

  const gridWidth = 7;
  const gridHeight = 6;
  const cellSize = 1;
  const segments = 28;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      gridWidth * cellSize,
      gridHeight * cellSize,
      segments,
      segments
    );
    geo.userData.originalPositions = geo.attributes.position.array.slice();
    return geo;
  }, []);

  const massPoints = useMemo(() => {
    const points = [];
    calendarDays.forEach((day, idx) => {
      if (!day.isCurrentMonth) return;
      const events = eventsByDate[day.date?.toDateString()] || [];
      const mass = calculateMass(events);
      if (mass > 0) {
        const col = idx % 7;
        const row = Math.floor(idx / 7);
        // Centro della cella: col va da 0-6, riga da 0-5
        // La griglia va da -3.5 a +3.5 in X e da -3 a +3 in Y
        const x = (col - 3) * cellSize;   // centro colonna
        const y = (2.5 - row) * cellSize; // centro riga
        points.push({ x, y, mass, events, cellIdx: idx });
      }
    });
    return points;
  }, [calendarDays, eventsByDate]);

  useFrame(() => {
    if (!meshRef.current?.geometry?.attributes?.position) return;
    const geo = meshRef.current.geometry;
    if (!geo.userData.originalPositions) return;

    const positions = geo.attributes.position.array;
    const original = geo.userData.originalPositions;

    for (let i = 0; i < positions.length; i += 3) {
      const ox = original[i];
      const oy = original[i + 1];

      let totalZ = 0;

      for (const mp of massPoints) {
        const dx = ox - mp.x;
        const dy = oy - mp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Raggio di influenza proporzionale alla massa
        const baseRadius = 1.2;
        const massRadius = baseRadius + Math.min(mp.mass / 600, 0.8);
        if (dist < massRadius) {
          // Non normalizzare a 1, ma mantenere la variazione
          // mass va da ~100 (500€) a ~500 (100k€)
          const normalizedMass = mp.mass / 400;
          const falloff = 1 - (dist / massRadius);
          const depth = normalizedMass * 0.8 * falloff * falloff;
          totalZ -= depth;
        }
      }

      const targetZ = totalZ;
      const currentZ = positions[i + 2];
      positions[i + 2] = currentZ + (targetZ - currentZ) * 0.1;
    }

    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  });

  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    const x = e.point.x;
    const y = e.point.y;

    const col = Math.floor((x + gridWidth * cellSize / 2) / cellSize);
    const row = Math.floor((gridHeight * cellSize / 2 - y) / cellSize);

    if (col >= 0 && col < 7 && row >= 0 && row < 6) {
      const idx = row * 7 + col;
      setHoveredCell(idx);
    } else {
      setHoveredCell(-1);
    }
  }, [setHoveredCell]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const x = e.point.x;
    const y = e.point.y;

    const col = Math.floor((x + gridWidth * cellSize / 2) / cellSize);
    const row = Math.floor((gridHeight * cellSize / 2 - y) / cellSize);

    if (col >= 0 && col < 7 && row >= 0 && row < 6) {
      const idx = row * 7 + col;
      if (calendarDays[idx]?.isCurrentMonth) {
        onCellClick(calendarDays[idx].date);
      }
    }
  }, [calendarDays, onCellClick]);

  return (
    <group>
      {/* Main surface */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI * 0.15, 0, 0]}
        position={[0, 0.3, 0]}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoveredCell(-1)}
        onClick={handleClick}
      >
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          color={colors.surfaceContainerHigh}
          side={THREE.DoubleSide}
          flatShading={false}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Grid lines */}
      <group rotation={[-Math.PI * 0.15, 0, 0]} position={[0, 0.31, 0]}>
        {/* Vertical lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Line
            key={`v-${i}`}
            points={[
              [(i - 3.5) * cellSize, -gridHeight * cellSize / 2, 0.01],
              [(i - 3.5) * cellSize, gridHeight * cellSize / 2, 0.01]
            ]}
            color={colors.gridColor}
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        ))}
        {/* Horizontal lines */}
        {Array.from({ length: 7 }).map((_, i) => (
          <Line
            key={`h-${i}`}
            points={[
              [-gridWidth * cellSize / 2, (i - 3) * cellSize, 0.01],
              [gridWidth * cellSize / 2, (i - 3) * cellSize, 0.01]
            ]}
            color={colors.gridColor}
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        ))}
      </group>

      {/* Weekday labels - same rotation as calendar surface */}
      <group rotation={[-Math.PI * 0.15, 0, 0]} position={[0, 0.32, 0]}>
        {WEEKDAYS.map((day, i) => (
          <Text
            key={day}
            position={[(i - 3) * cellSize, gridHeight * cellSize / 2 + 0.3, 0.02]}
            fontSize={0.22}
            color={colors.primary}
            anchorX="center"
            anchorY="middle"
          >
            {day}
          </Text>
        ))}
      </group>

      {/* Day numbers */}
      <group rotation={[-Math.PI * 0.15, 0, 0]} position={[0, 0.32, 0]}>
        {calendarDays.map((day, idx) => {
          const col = idx % 7;
          const row = Math.floor(idx / 7);
          // Centro della cella (stessa formula dei massPoints)
          const x = (col - 3) * cellSize;
          const y = (2.5 - row) * cellSize;
          const isHovered = hoveredCell === idx;

          return (
            <group key={idx} position={[x, y, 0.05]}>
              {/* Hover highlight */}
              {isHovered && day.isCurrentMonth && (
                <mesh position={[0, 0, -0.02]}>
                  <planeGeometry args={[cellSize * 0.9, cellSize * 0.9]} />
                  <meshBasicMaterial color={colors.primary} opacity={0.2} transparent />
                </mesh>
              )}
              {/* Day number */}
              <Text
                position={[0, 0, 0.02]}
                fontSize={0.2}
                color={day.isCurrentMonth ? colors.onSurfaceVariant : colors.outline}
                anchorX="center"
                anchorY="middle"
              >
                {day.day}
              </Text>
            </group>
          );
        })}
      </group>

    </group>
  );
}

// ============================================
// SCENE
// ============================================
function Scene({ calendarDays, eventsByDate, colors, onCellClick, hoveredCell, setHoveredCell }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 10]} intensity={1.2} />
      <directionalLight position={[-3, 5, -5]} intensity={0.5} color="#a0d8ef" />
      <pointLight position={[0, -3, 2]} intensity={0.6} color="#ffaa77" />

      {colors && (
        <ElasticSurface
          calendarDays={calendarDays}
          eventsByDate={eventsByDate}
          colors={colors}
          onCellClick={onCellClick}
          hoveredCell={hoveredCell}
          setHoveredCell={setHoveredCell}
        />
      )}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={12}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.45}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Calendario3DElastic() {
  const { mode, contrast } = useTheme();

  const colors = useMemo(() => MD3_COLORS[mode][contrast], [mode, contrast]);
  const headerColors = useMemo(() => CALENDAR_HEADER_COLORS[mode][contrast], [mode, contrast]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(-1);

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

  const handleCellClick = useCallback((date) => {
    if (date) {
      setModalDate(date);
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

      {/* 3D Canvas */}
      <div style={{ flex: 1, minHeight: 400, position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 2, 8], fov: 50 }}
          style={{ background: colors.background }}
          onCreated={({ gl }) => {
            gl.setClearColor(colors.background);
          }}
          fallback={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.onSurface }}>WebGL non supportato</div>}
        >
          <color attach="background" args={[colors.background]} />
          <Suspense fallback={null}>
            <Scene
              calendarDays={calendarDays}
              eventsByDate={eventsByDate}
              colors={colors}
              onCellClick={handleCellClick}
              hoveredCell={hoveredCell}
              setHoveredCell={setHoveredCell}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Instructions */}
      <div style={{
        padding: '8px 16px',
        background: colors.surfaceContainer,
        fontSize: 12,
        color: colors.onSurfaceVariant,
        textAlign: 'center',
        fontFamily: "'Orbitron', sans-serif"
      }}>
        Trascina per ruotare | Scroll per zoom | Click su una cella per aggiungere
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
                    <div style={{ fontSize: 16, fontWeight: 'bold' }}>{v.icon}</div>
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
