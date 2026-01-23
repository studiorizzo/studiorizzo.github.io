import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../src/context/ThemeContext';

// GPUComputationRenderer from three/examples
class GPUComputationRenderer {
  constructor(sizeX, sizeY, renderer) {
    this.variables = [];
    this.currentTextureIndex = 0;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.camera.position.z = 1;

    this.passThruUniforms = { passThruTexture: { value: null } };
    this.passThruShader = this.createShaderMaterial(
      this.getPassThroughFragmentShader(),
      this.passThruUniforms
    );

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.passThruShader);
    this.scene.add(this.mesh);
  }

  createShaderMaterial(computeFragmentShader, uniforms = {}) {
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.getPassThroughVertexShader(),
      fragmentShader: computeFragmentShader,
    });
    return material;
  }

  getPassThroughVertexShader() {
    return `void main() { gl_Position = vec4(position, 1.0); }`;
  }

  getPassThroughFragmentShader() {
    return `
      uniform sampler2D passThruTexture;
      void main() {
        vec2 uv = gl_FragCoord.xy / vec2(${this.sizeX.toFixed(1)}, ${this.sizeY.toFixed(1)});
        gl_FragColor = texture2D(passThruTexture, uv);
      }
    `;
  }

  createTexture() {
    const data = new Float32Array(this.sizeX * this.sizeY * 4);
    const texture = new THREE.DataTexture(data, this.sizeX, this.sizeY, THREE.RGBAFormat, THREE.FloatType);
    texture.needsUpdate = true;
    return texture;
  }

  addVariable(variableName, computeFragmentShader, initialValueTexture) {
    const material = this.createShaderMaterial(computeFragmentShader);
    const variable = {
      name: variableName,
      initialValueTexture: initialValueTexture,
      material: material,
      dependencies: null,
      renderTargets: [],
      wrapS: null,
      wrapT: null,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    };
    this.variables.push(variable);
    return variable;
  }

  setVariableDependencies(variable, dependencies) {
    variable.dependencies = dependencies;
  }

  init() {
    if (this.renderer.capabilities.isWebGL2 === false && this.renderer.extensions.has('OES_texture_float') === false) {
      return 'No OES_texture_float support for float textures.';
    }
    if (this.renderer.capabilities.maxVertexTextures === 0) {
      return 'No support for vertex shader textures.';
    }

    for (let i = 0; i < this.variables.length; i++) {
      const variable = this.variables[i];
      variable.renderTargets[0] = this.createRenderTarget(
        this.sizeX, this.sizeY, variable.wrapS, variable.wrapT, variable.minFilter, variable.magFilter
      );
      variable.renderTargets[1] = this.createRenderTarget(
        this.sizeX, this.sizeY, variable.wrapS, variable.wrapT, variable.minFilter, variable.magFilter
      );
      this.renderTexture(variable.initialValueTexture, variable.renderTargets[0]);
      this.renderTexture(variable.initialValueTexture, variable.renderTargets[1]);

      const material = variable.material;
      const uniforms = material.uniforms;
      if (variable.dependencies !== null) {
        for (let d = 0; d < variable.dependencies.length; d++) {
          const depVar = variable.dependencies[d];
          if (depVar.name !== variable.name) {
            uniforms[depVar.name] = { value: null };
          }
        }
      }
      uniforms[variable.name] = { value: null };
    }

    this.currentTextureIndex = 0;
    return null;
  }

  createRenderTarget(sizeX, sizeY, wrapS, wrapT, minFilter, magFilter) {
    const renderTarget = new THREE.WebGLRenderTarget(sizeX, sizeY, {
      wrapS: wrapS || THREE.ClampToEdgeWrapping,
      wrapT: wrapT || THREE.ClampToEdgeWrapping,
      minFilter: minFilter || THREE.NearestFilter,
      magFilter: magFilter || THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
    });
    return renderTarget;
  }

  renderTexture(input, output) {
    this.passThruUniforms.passThruTexture.value = input;
    this.doRenderTarget(this.passThruShader, output);
    this.passThruUniforms.passThruTexture.value = null;
  }

  doRenderTarget(material, output) {
    const currentRenderTarget = this.renderer.getRenderTarget();
    const currentXrEnabled = this.renderer.xr.enabled;
    this.renderer.xr.enabled = false;
    this.mesh.material = material;
    this.renderer.setRenderTarget(output);
    this.renderer.render(this.scene, this.camera);
    this.mesh.material = this.passThruShader;
    this.renderer.setRenderTarget(currentRenderTarget);
    this.renderer.xr.enabled = currentXrEnabled;
  }

  compute() {
    const currentTextureIndex = this.currentTextureIndex;
    const nextTextureIndex = this.currentTextureIndex === 0 ? 1 : 0;

    for (let i = 0; i < this.variables.length; i++) {
      const variable = this.variables[i];
      if (variable.dependencies !== null) {
        const uniforms = variable.material.uniforms;
        for (let d = 0; d < variable.dependencies.length; d++) {
          const depVar = variable.dependencies[d];
          uniforms[depVar.name].value = depVar.renderTargets[currentTextureIndex].texture;
        }
      }
      this.doRenderTarget(variable.material, variable.renderTargets[nextTextureIndex]);
    }

    this.currentTextureIndex = nextTextureIndex;
  }

  getCurrentRenderTarget(variable) {
    return variable.renderTargets[this.currentTextureIndex];
  }
}

// Constants
const WIDTH = 128;
const BOUNDS = 14;
const BOUNDS_HALF = BOUNDS * 0.5;

// Payment types configuration
const PAYMENT_TYPES = {
  mutui: { label: 'Mutui', icon: '🏠', color: '#dc2626', multiplier: 1.20 },
  riscossione: { label: 'Riscossione', icon: '⚠️', color: '#ea580c', multiplier: 1.15 },
  stipendi: { label: 'Stipendi', icon: '💼', color: '#ca8a04', multiplier: 1.10 },
  imposte: { label: 'Imposte', icon: '🏛️', color: '#16a34a', multiplier: 1.05 },
  altro: { label: 'Altro', icon: '📌', color: '#2563eb', multiplier: 1.0 },
};

// Wave equation compute shader
const heightmapFragmentShader = `
  uniform vec2 mousePos;
  uniform float mouseSize;
  uniform float viscosity;
  uniform float deep;
  uniform vec2 eventPositions[42];
  uniform float eventIntensities[42];
  uniform float eventTimes[42];
  uniform int eventCount;
  uniform float time;

  #define PI 3.141592653589793

  void main() {
    vec2 cellSize = 1.0 / resolution.xy;
    vec2 uv = gl_FragCoord.xy * cellSize;

    // heightmapValue.x = current height
    // heightmapValue.y = previous height
    vec4 heightmapValue = texture2D(heightmap, uv);

    // Get neighbors
    vec4 north = texture2D(heightmap, uv + vec2(0.0, cellSize.y));
    vec4 south = texture2D(heightmap, uv + vec2(0.0, -cellSize.y));
    vec4 east = texture2D(heightmap, uv + vec2(cellSize.x, 0.0));
    vec4 west = texture2D(heightmap, uv + vec2(-cellSize.x, 0.0));

    // Wave equation
    float newHeight = ((north.x + south.x + east.x + west.x) * 0.5 - heightmapValue.y) * viscosity;

    // Mouse influence
    if (mousePos.x < 5000.0) {
      float mousePhase = clamp(length((uv - vec2(0.5)) * ${BOUNDS.toFixed(1)} - vec2(mousePos.x, -mousePos.y)) * PI / mouseSize, 0.0, PI);
      newHeight -= (cos(mousePhase) + 1.0) * deep;
    }

    // Event influences (create drops)
    for (int i = 0; i < 42; i++) {
      if (i >= eventCount) break;
      float timeSinceEvent = time - eventTimes[i];
      if (timeSinceEvent >= 0.0 && timeSinceEvent < 0.1) {
        vec2 eventUV = eventPositions[i];
        float dist = length((uv - eventUV) * ${BOUNDS.toFixed(1)});
        float eventPhase = clamp(dist * PI / 0.5, 0.0, PI);
        newHeight -= (cos(eventPhase) + 1.0) * eventIntensities[i] * (1.0 - timeSinceEvent * 10.0);
      }
    }

    heightmapValue.y = heightmapValue.x;
    heightmapValue.x = newHeight;

    gl_FragColor = heightmapValue;
  }
`;

// Water material with heightmap displacement
class WaterShaderMaterial extends THREE.ShaderMaterial {
  constructor(options = {}) {
    super({
      uniforms: {
        heightmap: { value: null },
        baseColor: { value: new THREE.Color(options.baseColor || '#1a365d') },
        waveColor: { value: new THREE.Color(options.waveColor || '#60a5fa') },
        ambientLight: { value: options.ambientLight || 0.3 },
        time: { value: 0 },
      },
      vertexShader: `
        uniform sampler2D heightmap;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec2 cellSize = vec2(1.0 / ${WIDTH.toFixed(1)});

          float heightValue = texture2D(heightmap, uv).x;
          vHeight = heightValue;

          // Calculate normal from heightmap gradient
          float hL = texture2D(heightmap, uv - vec2(cellSize.x, 0.0)).x;
          float hR = texture2D(heightmap, uv + vec2(cellSize.x, 0.0)).x;
          float hD = texture2D(heightmap, uv - vec2(0.0, cellSize.y)).x;
          float hU = texture2D(heightmap, uv + vec2(0.0, cellSize.y)).x;

          vec3 normal = normalize(vec3(hL - hR, 2.0 / ${WIDTH.toFixed(1)} * ${BOUNDS.toFixed(1)}, hD - hU));
          vNormal = normalMatrix * normal;

          vec3 displaced = position;
          displaced.z = heightValue;

          vPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 waveColor;
        uniform float ambientLight;
        uniform float time;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        varying vec2 vUv;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
          vec3 viewDir = normalize(cameraPosition - vPosition);

          // Diffuse
          float diffuse = max(dot(normal, lightDir), 0.0);

          // Specular
          vec3 reflectDir = reflect(-lightDir, normal);
          float specular = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);

          // Fresnel
          float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);

          // Mix colors based on height
          float heightMix = smoothstep(-0.1, 0.1, vHeight);
          vec3 color = mix(baseColor, waveColor, heightMix * 0.5 + 0.3);

          vec3 finalColor = color * (ambientLight + diffuse * 0.6);
          finalColor += vec3(1.0) * specular * 0.5;
          finalColor += waveColor * fresnel * 0.3;

          float alpha = 0.9 + vHeight * 0.1;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }
}

// GPGPU Water simulation component
function GPGPUWater({ onHeightmapUpdate, mousePos, events, currentMonth, currentYear, isDark }) {
  const { gl } = useThree();
  const gpuComputeRef = useRef(null);
  const heightmapVariableRef = useRef(null);
  const meshRef = useRef();
  const materialRef = useRef();
  const clockRef = useRef(0);

  // Initialize GPGPU
  useEffect(() => {
    const gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, gl);

    const heightmap0 = gpuCompute.createTexture();
    // Initialize with slight noise
    const pixels = heightmap0.image.data;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 1;
    }
    heightmap0.needsUpdate = true;

    const heightmapVariable = gpuCompute.addVariable('heightmap', heightmapFragmentShader, heightmap0);
    gpuCompute.setVariableDependencies(heightmapVariable, [heightmapVariable]);

    heightmapVariable.material.uniforms.mousePos = { value: new THREE.Vector2(10000, 10000) };
    heightmapVariable.material.uniforms.mouseSize = { value: 0.5 };
    heightmapVariable.material.uniforms.viscosity = { value: 0.985 };
    heightmapVariable.material.uniforms.deep = { value: 0.015 };
    heightmapVariable.material.uniforms.eventPositions = { value: new Array(42).fill(new THREE.Vector2(0, 0)) };
    heightmapVariable.material.uniforms.eventIntensities = { value: new Float32Array(42) };
    heightmapVariable.material.uniforms.eventTimes = { value: new Float32Array(42) };
    heightmapVariable.material.uniforms.eventCount = { value: 0 };
    heightmapVariable.material.uniforms.time = { value: 0 };

    // Add resolution define
    heightmapVariable.material.defines.resolution = `vec2(${WIDTH.toFixed(1)}, ${WIDTH.toFixed(1)})`;

    const error = gpuCompute.init();
    if (error !== null) {
      console.error('GPUComputationRenderer error:', error);
    }

    gpuComputeRef.current = gpuCompute;
    heightmapVariableRef.current = heightmapVariable;

    return () => {
      // Cleanup
      heightmapVariable.renderTargets.forEach(rt => rt.dispose());
    };
  }, [gl]);

  // Update events as wave sources
  useEffect(() => {
    if (!heightmapVariableRef.current) return;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const cellWidth = 2;
    const cellHeight = 2;
    const startX = -6;
    const startZ = -5;

    const eventPositions = [];
    const eventIntensities = [];

    events.forEach(event => {
      if (event.date.getMonth() === currentMonth && event.date.getFullYear() === currentYear) {
        const dayNumber = event.date.getDate();
        const dayIndex = dayNumber - 1 + startingDay;
        const row = Math.floor(dayIndex / 7);
        const col = dayIndex % 7;

        const x = startX + col * cellWidth;
        const z = startZ + row * cellHeight;

        // Convert to UV coordinates (0-1)
        const uvX = (x + BOUNDS_HALF) / BOUNDS;
        const uvY = (z + BOUNDS_HALF) / BOUNDS;

        const mult = PAYMENT_TYPES[event.type]?.multiplier || 1;
        const intensity = Math.log10(event.amount + 1) * mult * 0.003;

        eventPositions.push(new THREE.Vector2(uvX, uvY));
        eventIntensities.push(intensity);
      }
    });

    const uniforms = heightmapVariableRef.current.material.uniforms;
    const positions = new Array(42).fill(null).map((_, i) => eventPositions[i] || new THREE.Vector2(0, 0));
    const intensities = new Float32Array(42);
    const times = new Float32Array(42);

    eventPositions.forEach((_, i) => {
      intensities[i] = eventIntensities[i] || 0;
      times[i] = clockRef.current + i * 0.5; // Stagger event drops
    });

    uniforms.eventPositions.value = positions;
    uniforms.eventIntensities.value = intensities;
    uniforms.eventTimes.value = times;
    uniforms.eventCount.value = eventPositions.length;
  }, [events, currentMonth, currentYear]);

  // Create water material
  const waterMaterial = useMemo(() => {
    const baseColor = isDark ? '#0c1929' : '#1e40af';
    const waveColor = isDark ? '#3b82f6' : '#93c5fd';
    return new WaterShaderMaterial({
      baseColor,
      waveColor,
      ambientLight: isDark ? 0.2 : 0.4,
    });
  }, [isDark]);

  // Animation loop
  useFrame((state, delta) => {
    if (!gpuComputeRef.current || !heightmapVariableRef.current) return;

    clockRef.current += delta;
    const uniforms = heightmapVariableRef.current.material.uniforms;
    uniforms.time.value = clockRef.current;

    // Update mouse position
    if (mousePos) {
      uniforms.mousePos.value.copy(mousePos);
    } else {
      uniforms.mousePos.value.set(10000, 10000);
    }

    // Compute water simulation
    gpuComputeRef.current.compute();

    // Update water mesh material
    const heightmap = gpuComputeRef.current.getCurrentRenderTarget(heightmapVariableRef.current).texture;
    if (materialRef.current) {
      materialRef.current.uniforms.heightmap.value = heightmap;
      materialRef.current.uniforms.time.value = clockRef.current;
    }

    if (onHeightmapUpdate) {
      onHeightmapUpdate(heightmap);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[BOUNDS, BOUNDS, WIDTH - 1, WIDTH - 1]} />
      <primitive object={waterMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
}

// Calendar grid overlay
function CalendarGrid({ currentMonth, currentYear, eventsByDate, onCellHover, onCellClick, isDark }) {
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
    const z = startZ - 1.5;
    cells.push(
      <Text
        key={`header-${i}`}
        position={[x, 0.15, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.35}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
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
        const dayEvents = eventsByDate[dateKey] || [];
        const hasEvents = dayEvents.length > 0;
        const isToday = new Date().toDateString() === dateKey;

        cells.push(
          <group key={`cell-${dayNumber}`} position={[x, 0.1, z]}>
            {/* Invisible click target */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onCellClick(date);
              }}
              onPointerEnter={(e) => {
                e.stopPropagation();
                onCellHover(date, x, z);
              }}
              onPointerLeave={() => onCellHover(null)}
            >
              <planeGeometry args={[cellWidth - 0.1, cellHeight - 0.1]} />
              <meshBasicMaterial
                color={isToday ? (isDark ? '#1e3a5f' : '#dbeafe') : '#ffffff'}
                transparent
                opacity={isToday ? 0.3 : 0}
              />
            </mesh>

            {/* Day number */}
            <Text
              position={[0, 0.05, -0.5]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.4}
              color={isToday ? '#3b82f6' : textColor}
              anchorX="center"
              anchorY="middle"
              fontWeight={isToday ? 'bold' : 'normal'}
            >
              {dayNumber}
            </Text>

            {/* Event indicator */}
            {hasEvents && (
              <mesh position={[0, 0.1, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.18, 16]} />
                <meshBasicMaterial color={PAYMENT_TYPES[dayEvents[0].type]?.color || eventDotColor} />
              </mesh>
            )}
          </group>
        );
      }
    }
  }

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const positions = [];

    // Vertical lines
    for (let i = 0; i <= 7; i++) {
      const x = startX - cellWidth / 2 + i * cellWidth;
      positions.push(x, 0.05, startZ - cellHeight, x, 0.05, startZ + 5.5 * cellHeight);
    }

    // Horizontal lines
    for (let i = 0; i <= 6; i++) {
      const z = startZ - cellHeight / 2 + i * cellHeight;
      positions.push(startX - cellWidth / 2, 0.05, z, startX + 6.5 * cellWidth, 0.05, z);
    }

    return new Float32Array(positions);
  }, []);

  return (
    <group>
      {cells}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={gridLines.length / 3}
            array={gridLines}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={gridColor} transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
}

// Raycaster for mouse interaction
function WaterInteraction({ onMouseMove, onMouseDown, onMouseUp }) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const planeRef = useRef();
  const mouseDown = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);

      if (planeRef.current) {
        const intersects = raycaster.intersectObject(planeRef.current);
        if (intersects.length > 0 && mouseDown.current) {
          const point = intersects[0].point;
          onMouseMove(new THREE.Vector2(point.x, point.z));
        } else if (!mouseDown.current) {
          onMouseMove(null);
        }
      }
    };

    const handleMouseDown = () => {
      mouseDown.current = true;
      onMouseDown?.();
    };

    const handleMouseUp = () => {
      mouseDown.current = false;
      onMouseMove(null);
      onMouseUp?.();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [camera, gl, raycaster, onMouseMove, onMouseDown, onMouseUp]);

  return (
    <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <planeGeometry args={[BOUNDS, BOUNDS]} />
      <meshBasicMaterial />
    </mesh>
  );
}

// Main scene component
function Scene({ events, currentMonth, currentYear, onCellClick }) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [mousePos, setMousePos] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  const eventsByDate = useMemo(() => {
    const grouped = {};
    events.forEach(event => {
      const key = event.date.toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [events]);

  const handleCellHover = useCallback((date, x, z) => {
    if (date) {
      setHoveredDate({ date, x, z });
      // Create a ripple at the hovered cell
      const uvX = (x + BOUNDS_HALF) / BOUNDS;
      const uvY = (z + BOUNDS_HALF) / BOUNDS;
      // setMousePos(new THREE.Vector2(x, z));
    } else {
      setHoveredDate(null);
    }
  }, []);

  const handleCellClick = useCallback((date) => {
    onCellClick(date);

    // Create ripple at clicked cell position
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

    setMousePos(new THREE.Vector2(x, z));
    setTimeout(() => setMousePos(null), 100);
  }, [currentMonth, currentYear, onCellClick]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.3 : 0.5} />
      <directionalLight position={[5, 10, 5]} intensity={isDark ? 0.6 : 1.0} />
      <pointLight position={[-5, 5, -5]} intensity={0.4} color="#60a5fa" />

      {/* Water interaction plane */}
      <WaterInteraction onMouseMove={setMousePos} />

      {/* GPGPU Water surface */}
      <GPGPUWater
        mousePos={mousePos}
        events={events}
        currentMonth={currentMonth}
        currentYear={currentYear}
        isDark={isDark}
      />

      {/* Calendar grid */}
      <CalendarGrid
        currentMonth={currentMonth}
        currentYear={currentYear}
        eventsByDate={eventsByDate}
        onCellHover={handleCellHover}
        onCellClick={handleCellClick}
        isDark={isDark}
      />

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={8}
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
    boxSizing: 'border-box',
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
        Tipi di Scadenza
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
        Simulazione GPGPU
      </h4>
      <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.5' }}>
        Fisica delle onde calcolata sulla GPU. Trascina il mouse per creare onde.
        Gli eventi generano perturbazioni proporzionali all'importo.
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
        camera={{ position: [0, 15, 12], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene
          events={events}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onCellClick={handleCellClick}
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
