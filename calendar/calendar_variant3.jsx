import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../src/context/ThemeContext';

// Payment types configuration (same as other variants)
const PAYMENT_TYPES = {
  mutui: { label: 'Mutui', icon: '🏠', color: '#dc2626', multiplier: 1.20 },
  riscossione: { label: 'Riscossione', icon: '⚠️', color: '#ea580c', multiplier: 1.15 },
  stipendi: { label: 'Stipendi', icon: '💼', color: '#ca8a04', multiplier: 1.10 },
  imposte: { label: 'Imposte', icon: '🏛️', color: '#16a34a', multiplier: 1.05 },
  altro: { label: 'Altro', icon: '📌', color: '#2563eb', multiplier: 1.0 },
};

// Calculate ripple intensity based on event amount and type
const calculateRippleIntensity = (events) => {
  if (!events?.length) return 0;
  return events.reduce((total, e) => {
    const mult = PAYMENT_TYPES[e.type]?.multiplier || 1;
    return total + Math.log10(e.amount + 1) * mult * 0.15;
  }, 0);
};

// Custom shader material for water ripples
const WaterMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uRipples: { value: [] }, // Array of {x, z, intensity, startTime}
    uRippleCount: { value: 0 },
    uBaseColor: { value: new THREE.Color('#1a365d') },
    uRippleColor: { value: new THREE.Color('#60a5fa') },
    uAmbientLight: { value: 0.3 },
  },
  vertexShader: `
    uniform float uTime;
    uniform vec4 uRipples[42]; // Max 42 ripples (7x6 grid)
    uniform int uRippleCount;

    varying vec3 vPosition;
    varying vec3 vNormal;
    varying float vElevation;

    void main() {
      vPosition = position;
      float elevation = 0.0;

      // Calculate wave height from all ripples
      for (int i = 0; i < 42; i++) {
        if (i >= uRippleCount) break;

        vec4 ripple = uRipples[i];
        float rippleX = ripple.x;
        float rippleZ = ripple.y;
        float intensity = ripple.z;
        float startTime = ripple.w;

        if (intensity > 0.0) {
          float dist = distance(position.xz, vec2(rippleX, rippleZ));
          float timeSinceStart = uTime - startTime;

          // Wave propagation speed and decay
          float waveSpeed = 2.0;
          float waveLength = 0.8;
          float decay = 0.3;

          // Expanding ring wave
          float waveFront = timeSinceStart * waveSpeed;
          float wavePhase = (dist - waveFront) * 6.28318 / waveLength;

          // Wave amplitude decreases with distance and time
          float distanceDecay = 1.0 / (1.0 + dist * decay);
          float timeDecay = exp(-timeSinceStart * 0.5);

          // Only show waves that have reached this point
          if (dist < waveFront + waveLength && dist > waveFront - waveLength * 3.0) {
            float wave = sin(wavePhase) * intensity * distanceDecay * timeDecay;
            elevation += wave;
          }
        }
      }

      vElevation = elevation;

      // Displace vertex
      vec3 newPosition = position;
      newPosition.y += elevation;

      // Calculate normal for lighting
      vNormal = normalize(vec3(-dFdx(elevation), 1.0, -dFdy(elevation)));

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform vec3 uRippleColor;
    uniform float uAmbientLight;
    uniform float uTime;

    varying vec3 vPosition;
    varying vec3 vNormal;
    varying float vElevation;

    void main() {
      // Mix colors based on elevation
      float mixFactor = smoothstep(-0.3, 0.3, vElevation);
      vec3 color = mix(uBaseColor, uRippleColor, mixFactor * 0.5 + 0.2);

      // Simple lighting
      vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
      float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);

      // Fresnel effect for water-like appearance
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 2.0);

      // Specular highlight
      vec3 reflectDir = reflect(-lightDir, vNormal);
      float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

      vec3 finalColor = color * (uAmbientLight + diffuse * 0.6) + vec3(1.0) * specular * 0.3;
      finalColor += fresnel * uRippleColor * 0.2;

      // Add subtle transparency variation
      float alpha = 0.85 + vElevation * 0.1;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// Water surface component
function WaterSurface({ ripples, isDark }) {
  const meshRef = useRef();
  const materialRef = useRef();

  const baseColor = isDark ? new THREE.Color('#0c1929') : new THREE.Color('#1e40af');
  const rippleColor = isDark ? new THREE.Color('#3b82f6') : new THREE.Color('#93c5fd');

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRipples: { value: new Array(42).fill(new THREE.Vector4(0, 0, 0, 0)) },
        uRippleCount: { value: 0 },
        uBaseColor: { value: baseColor },
        uRippleColor: { value: rippleColor },
        uAmbientLight: { value: isDark ? 0.2 : 0.4 },
      },
      vertexShader: WaterMaterial.vertexShader,
      fragmentShader: WaterMaterial.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [isDark]);

  // Update uniforms
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      // Update ripple data
      const rippleData = ripples.map(r => new THREE.Vector4(r.x, r.z, r.intensity, r.startTime));
      while (rippleData.length < 42) {
        rippleData.push(new THREE.Vector4(0, 0, 0, 0));
      }
      materialRef.current.uniforms.uRipples.value = rippleData;
      materialRef.current.uniforms.uRippleCount.value = Math.min(ripples.length, 42);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[14, 12, 200, 200]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

// Calendar grid overlay
function CalendarGrid({ currentMonth, currentYear, eventsByDate, onCellClick, isDark }) {
  const cellWidth = 2;
  const cellHeight = 2;
  const startX = -6;
  const startZ = -5;

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const gridColor = isDark ? '#334155' : '#94a3b8';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const eventDotColor = isDark ? '#f59e0b' : '#d97706';

  const cells = [];

  // Weekday headers
  weekDays.forEach((day, i) => {
    const x = startX + i * cellWidth;
    const z = startZ - 1;
    cells.push(
      <Text
        key={`header-${i}`}
        position={[x, 0.1, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        color={textColor}
        anchorX="center"
        anchorY="middle"
      >
        {day}
      </Text>
    );
  });

  // Day cells
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const dayIndex = row * 7 + col - startingDay;
      const dayNumber = dayIndex + 1;

      if (dayNumber >= 1 && dayNumber <= daysInMonth) {
        const x = startX + col * cellWidth;
        const z = startZ + row * cellHeight;

        const date = new Date(currentYear, currentMonth, dayNumber);
        const dateKey = date.toDateString();
        const hasEvents = eventsByDate[dateKey]?.length > 0;
        const isToday = new Date().toDateString() === dateKey;

        cells.push(
          <group key={`cell-${dayNumber}`} position={[x, 0.05, z]}>
            {/* Cell border */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={() => onCellClick(date)}>
              <planeGeometry args={[cellWidth - 0.1, cellHeight - 0.1]} />
              <meshBasicMaterial
                color={isToday ? (isDark ? '#1e3a5f' : '#dbeafe') : 'transparent'}
                transparent
                opacity={isToday ? 0.5 : 0}
              />
            </mesh>

            {/* Day number */}
            <Text
              position={[0, 0.1, -0.5]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.35}
              color={isToday ? '#3b82f6' : textColor}
              anchorX="center"
              anchorY="middle"
              fontWeight={isToday ? 'bold' : 'normal'}
            >
              {dayNumber}
            </Text>

            {/* Event indicator dot */}
            {hasEvents && (
              <mesh position={[0, 0.15, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.15, 16]} />
                <meshBasicMaterial color={eventDotColor} />
              </mesh>
            )}
          </group>
        );
      }
    }
  }

  // Grid lines
  const gridLines = [];
  for (let i = 0; i <= 7; i++) {
    const x = startX - cellWidth / 2 + i * cellWidth;
    gridLines.push(
      <line key={`vline-${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([x, 0.02, startZ - cellHeight / 2, x, 0.02, startZ + 5.5 * cellHeight])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={gridColor} transparent opacity={0.3} />
      </line>
    );
  }

  for (let i = 0; i <= 6; i++) {
    const z = startZ - cellHeight / 2 + i * cellHeight;
    gridLines.push(
      <line key={`hline-${i}`}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([startX - cellWidth / 2, 0.02, z, startX + 6.5 * cellWidth, 0.02, z])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={gridColor} transparent opacity={0.3} />
      </line>
    );
  }

  return (
    <group>
      {cells}
      {gridLines}
    </group>
  );
}

// Impact marker at ripple origin
function ImpactMarker({ position, intensity, color }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.1 + intensity * 0.05, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

// Main scene component
function Scene({ events, currentMonth, currentYear, onCellClick, onAddRipple }) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [ripples, setRipples] = useState([]);
  const { clock } = useThree();

  // Convert events to ripples based on calendar position
  const eventsByDate = useMemo(() => {
    const grouped = {};
    events.forEach(event => {
      const key = event.date.toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [events]);

  // Calculate ripple positions from events
  useEffect(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const cellWidth = 2;
    const cellHeight = 2;
    const startX = -6;
    const startZ = -5;

    const newRipples = [];

    events.forEach(event => {
      if (event.date.getMonth() === currentMonth && event.date.getFullYear() === currentYear) {
        const dayNumber = event.date.getDate();
        const dayIndex = dayNumber - 1 + startingDay;
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;

        const x = startX + col * cellWidth;
        const z = startZ + row * cellHeight;

        const intensity = calculateRippleIntensity([event]);

        newRipples.push({
          x,
          z,
          intensity,
          startTime: clock.elapsedTime + Math.random() * 2, // Stagger start times
          color: PAYMENT_TYPES[event.type]?.color || '#3b82f6',
          type: event.type,
        });
      }
    });

    setRipples(newRipples);
  }, [events, currentMonth, currentYear, clock.elapsedTime]);

  const handleCellClick = useCallback((date) => {
    onCellClick(date);

    // Add a temporary ripple on click
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const dayNumber = date.getDate();
    const dayIndex = dayNumber - 1 + startingDay;
    const row = Math.floor(dayIndex / 7);
    const col = dayIndex % 7;

    const cellWidth = 2;
    const cellHeight = 2;
    const startX = -6;
    const startZ = -5;

    const x = startX + col * cellWidth;
    const z = startZ + row * cellHeight;

    setRipples(prev => [...prev, {
      x,
      z,
      intensity: 0.5,
      startTime: clock.elapsedTime,
      color: '#60a5fa',
      type: 'click',
    }]);
  }, [currentMonth, currentYear, clock.elapsedTime, onCellClick]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.3 : 0.5} />
      <directionalLight position={[5, 10, 5]} intensity={isDark ? 0.5 : 0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#60a5fa" />

      {/* Water surface */}
      <WaterSurface ripples={ripples} isDark={isDark} />

      {/* Calendar grid */}
      <CalendarGrid
        currentMonth={currentMonth}
        currentYear={currentYear}
        eventsByDate={eventsByDate}
        onCellClick={handleCellClick}
        isDark={isDark}
      />

      {/* Impact markers */}
      {ripples.map((ripple, i) => (
        ripple.type !== 'click' && (
          <ImpactMarker
            key={i}
            position={[ripple.x, 0.3, ripple.z]}
            intensity={ripple.intensity}
            color={ripple.color}
          />
        )
      ))}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
        target={[0, 0, 0]}
      />
    </>
  );
}

// Modal for adding events
function AddEventModal({ isOpen, onClose, selectedDate, onAddEvent }) {
  const [eventType, setEventType] = useState('altro');
  const [amount, setAmount] = useState('');
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  if (!isOpen || !selectedDate) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      onAddEvent({
        type: eventType,
        amount: parseFloat(amount),
        date: selectedDate,
      });
      setAmount('');
      setEventType('altro');
      onClose();
    }
  };

  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: isDark ? '#1e293b' : '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    zIndex: 1000,
    minWidth: '320px',
    color: isDark ? '#e2e8f0' : '#1e293b',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
    background: isDark ? '#334155' : '#f8fafc',
    color: isDark ? '#e2e8f0' : '#1e293b',
    fontSize: '14px',
    marginTop: '6px',
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={modalStyle}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
          Aggiungi Evento - {selectedDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Tipo</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              style={inputStyle}
            >
              {Object.entries(PAYMENT_TYPES).map(([key, { label, icon }]) => (
                <option key={key} value={key}>{icon} {label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Importo (€)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Es. 1000"
              style={inputStyle}
              min="0"
              step="0.01"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...buttonStyle,
                background: isDark ? '#475569' : '#e2e8f0',
                color: isDark ? '#e2e8f0' : '#475569',
              }}
            >
              Annulla
            </button>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                background: '#3b82f6',
                color: '#ffffff',
              }}
            >
              Aggiungi
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// Header component
function Header({ currentMonth, currentYear, onPrevMonth, onNextMonth, isDark }) {
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const headerStyle = {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    zIndex: 100,
    background: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    padding: '12px 24px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  const buttonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '24px',
    color: isDark ? '#e2e8f0' : '#1e293b',
    padding: '4px 8px',
  };

  return (
    <div style={headerStyle}>
      <button style={buttonStyle} onClick={onPrevMonth}>←</button>
      <span style={{
        fontSize: '20px',
        fontWeight: '600',
        color: isDark ? '#e2e8f0' : '#1e293b',
        minWidth: '180px',
        textAlign: 'center',
      }}>
        {monthNames[currentMonth]} {currentYear}
      </span>
      <button style={buttonStyle} onClick={onNextMonth}>→</button>
    </div>
  );
}

// Legend component
function Legend({ isDark }) {
  const legendStyle = {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    background: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    padding: '16px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
  };

  return (
    <div style={legendStyle}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: isDark ? '#e2e8f0' : '#1e293b' }}>
        Tipi di Evento
      </h4>
      {Object.entries(PAYMENT_TYPES).map(([key, { label, icon, color }]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: color,
          }} />
          <span style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#475569' }}>
            {icon} {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Info panel
function InfoPanel({ isDark }) {
  const panelStyle = {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    background: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    padding: '16px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    maxWidth: '280px',
  };

  return (
    <div style={panelStyle}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: isDark ? '#e2e8f0' : '#1e293b' }}>
        Calendario Acquatico
      </h4>
      <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.5' }}>
        Gli eventi sono come sassi lanciati in uno specchio d'acqua.
        Ogni evento genera increspature concentriche proporzionali alla sua importanza.
        Clicca su una cella per aggiungere un evento.
      </p>
    </div>
  );
}

// Main component
export default function CalendarVariant3() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState([
    // Sample events
    { type: 'mutui', amount: 1500, date: new Date(new Date().getFullYear(), new Date().getMonth(), 5) },
    { type: 'stipendi', amount: 3000, date: new Date(new Date().getFullYear(), new Date().getMonth(), 10) },
    { type: 'imposte', amount: 800, date: new Date(new Date().getFullYear(), new Date().getMonth(), 15) },
    { type: 'riscossione', amount: 2000, date: new Date(new Date().getFullYear(), new Date().getMonth(), 20) },
    { type: 'altro', amount: 500, date: new Date(new Date().getFullYear(), new Date().getMonth(), 25) },
  ]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleCellClick = useCallback((date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  }, []);

  const handleAddEvent = useCallback((event) => {
    setEvents(prev => [...prev, event]);
  }, []);

  const containerStyle = {
    width: '100%',
    height: '100vh',
    position: 'relative',
    background: isDark
      ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
      : 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)',
  };

  return (
    <div style={containerStyle}>
      <Header
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isDark={isDark}
      />

      <Canvas
        camera={{ position: [0, 12, 12], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Scene
          events={events}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onCellClick={handleCellClick}
          onAddRipple={() => {}}
        />
      </Canvas>

      <Legend isDark={isDark} />
      <InfoPanel isDark={isDark} />

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
}
