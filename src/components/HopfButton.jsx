import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Hopf Band Mesh Component
function HopfBand({ hovered, clicked }) {
  const meshRef = useRef();
  const [rotationY, setRotationY] = useState(0);

  // Parametri Hopf band
  const bandWidth = Math.PI / 3; // 60°
  const stepsV = 40;
  const stepsTheta = 80;

  // Genera geometria della Hopf band
  const geometry = useMemo(() => {
    const getArcPoint = (v) => {
      const phi = Math.PI / 2 - bandWidth / 2 + v * bandWidth;
      return {
        nx: Math.cos(phi),
        ny: 0,
        nz: Math.sin(phi)
      };
    };

    const getSpinor = (nx, ny, nz) => {
      const eps = 1e-6;
      if (nz > -1 + eps) {
        const r = Math.sqrt((1 + nz) / 2);
        return {
          z1_re: r,
          z1_im: 0,
          z2_re: nx / (2 * r),
          z2_im: ny / (2 * r)
        };
      } else {
        return {
          z1_re: 0,
          z1_im: 0,
          z2_re: 1,
          z2_im: 0
        };
      }
    };

    const getFiberPointS3 = (nx, ny, nz, theta) => {
      const { z1_re, z1_im, z2_re, z2_im } = getSpinor(nx, ny, nz);
      const cos_t = Math.cos(theta);
      const sin_t = Math.sin(theta);
      const x1 = z1_re * cos_t - z1_im * sin_t;
      const x2 = z1_re * sin_t + z1_im * cos_t;
      const x3 = z2_re * cos_t - z2_im * sin_t;
      const x4 = z2_re * sin_t + z2_im * cos_t;
      return { x1, x2, x3, x4 };
    };

    const stereographic = (x1, x2, x3, x4) => {
      const denom = 1 - x4;
      const maxVal = 20;
      if (Math.abs(denom) < 0.01) {
        const sign = denom >= 0 ? 1 : -1;
        return {
          x: x1 * maxVal * sign,
          y: x2 * maxVal * sign,
          z: x3 * maxVal * sign
        };
      }
      return {
        x: x1 / denom,
        y: x2 / denom,
        z: x3 / denom
      };
    };

    const getHopfBandPoint = (v, theta) => {
      const { nx, ny, nz } = getArcPoint(v);
      const { x1, x2, x3, x4 } = getFiberPointS3(nx, ny, nz, theta);
      return stereographic(x1, x2, x3, x4);
    };

    // Crea BufferGeometry
    const vertices = [];
    const indices = [];
    const colors = [];
    const normals = [];

    // Griglia di vertici
    const grid = [];
    for (let i = 0; i <= stepsV; i++) {
      const row = [];
      const v = i / stepsV;
      for (let j = 0; j <= stepsTheta; j++) {
        const theta = (j / stepsTheta) * Math.PI * 2;
        const p = getHopfBandPoint(v, theta);
        // Clamp valori estremi
        const maxCoord = 10;
        const x = Math.max(-maxCoord, Math.min(maxCoord, p.x));
        const y = Math.max(-maxCoord, Math.min(maxCoord, p.y));
        const z = Math.max(-maxCoord, Math.min(maxCoord, p.z));
        row.push(new THREE.Vector3(x, y, z));
      }
      grid.push(row);
    }

    // Aggiungi vertici e calcola normali
    for (let i = 0; i <= stepsV; i++) {
      for (let j = 0; j <= stepsTheta; j++) {
        const p = grid[i][j];
        vertices.push(p.x, p.y, p.z);

        // Calcola normale approssimativa
        const prev_i = Math.max(0, i - 1);
        const next_i = Math.min(stepsV, i + 1);
        const prev_j = (j - 1 + stepsTheta + 1) % (stepsTheta + 1);
        const next_j = (j + 1) % (stepsTheta + 1);

        const tangent_v = new THREE.Vector3().subVectors(grid[next_i][j], grid[prev_i][j]);
        const tangent_theta = new THREE.Vector3().subVectors(grid[i][next_j], grid[i][prev_j]);
        const normal = new THREE.Vector3().crossVectors(tangent_theta, tangent_v).normalize();

        normals.push(normal.x, normal.y, normal.z);

        // Colore basato sulla posizione v (verde->rosso)
        const t = i / stepsV;
        colors.push(t, 1 - t, 0); // R, G, B
      }
    }

    // Crea indici per triangoli
    for (let i = 0; i < stepsV; i++) {
      for (let j = 0; j < stepsTheta; j++) {
        const a = i * (stepsTheta + 1) + j;
        const b = a + 1;
        const c = a + (stepsTheta + 1);
        const d = c + 1;

        // Due triangoli per quad
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, [bandWidth, stepsV, stepsTheta]);

  // Animazione
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotazione continua
      meshRef.current.rotation.y += delta * 0.5;

      // Scala quando hover
      const targetScale = hovered ? 1.1 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} scale={0.5}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        metalness={0.3}
        roughness={0.7}
        emissive={clicked ? '#333' : '#000'}
      />
    </mesh>
  );
}

// Anelli di bordo (Hopf Link)
function HopfRings() {
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  const bandWidth = Math.PI / 3;
  const stepsTheta = 80;

  const { ring1Points, ring2Points } = useMemo(() => {
    const getArcPoint = (v) => {
      const phi = Math.PI / 2 - bandWidth / 2 + v * bandWidth;
      return { nx: Math.cos(phi), ny: 0, nz: Math.sin(phi) };
    };

    const getSpinor = (nx, ny, nz) => {
      if (nz > -1 + 1e-6) {
        const r = Math.sqrt((1 + nz) / 2);
        return { z1_re: r, z1_im: 0, z2_re: nx / (2 * r), z2_im: ny / (2 * r) };
      }
      return { z1_re: 0, z1_im: 0, z2_re: 1, z2_im: 0 };
    };

    const getFiberPointS3 = (nx, ny, nz, theta) => {
      const { z1_re, z1_im, z2_re, z2_im } = getSpinor(nx, ny, nz);
      const cos_t = Math.cos(theta);
      const sin_t = Math.sin(theta);
      return {
        x1: z1_re * cos_t - z1_im * sin_t,
        x2: z1_re * sin_t + z1_im * cos_t,
        x3: z2_re * cos_t - z2_im * sin_t,
        x4: z2_re * sin_t + z2_im * cos_t
      };
    };

    const stereographic = (x1, x2, x3, x4) => {
      const denom = 1 - x4;
      if (Math.abs(denom) < 0.01) {
        const sign = denom >= 0 ? 1 : -1;
        return { x: x1 * 20 * sign, y: x2 * 20 * sign, z: x3 * 20 * sign };
      }
      return { x: x1 / denom, y: x2 / denom, z: x3 / denom };
    };

    const getHopfBandPoint = (v, theta) => {
      const { nx, ny, nz } = getArcPoint(v);
      const { x1, x2, x3, x4 } = getFiberPointS3(nx, ny, nz, theta);
      return stereographic(x1, x2, x3, x4);
    };

    const r1Points = [];
    const r2Points = [];
    const maxCoord = 10;

    for (let j = 0; j <= stepsTheta; j++) {
      const theta = (j / stepsTheta) * Math.PI * 2;

      const p1 = getHopfBandPoint(0, theta);
      r1Points.push(new THREE.Vector3(
        Math.max(-maxCoord, Math.min(maxCoord, p1.x)),
        Math.max(-maxCoord, Math.min(maxCoord, p1.y)),
        Math.max(-maxCoord, Math.min(maxCoord, p1.z))
      ));

      const p2 = getHopfBandPoint(1, theta);
      r2Points.push(new THREE.Vector3(
        Math.max(-maxCoord, Math.min(maxCoord, p2.x)),
        Math.max(-maxCoord, Math.min(maxCoord, p2.y)),
        Math.max(-maxCoord, Math.min(maxCoord, p2.z))
      ));
    }

    return { ring1Points: r1Points, ring2Points: r2Points };
  }, [bandWidth, stepsTheta]);

  useFrame((state, delta) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y += delta * 0.5;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.5;
    }
  });

  const ring1Geom = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(ring1Points);
  }, [ring1Points]);

  const ring2Geom = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(ring2Points);
  }, [ring2Points]);

  return (
    <group scale={0.5}>
      <line ref={ring1Ref} geometry={ring1Geom}>
        <lineBasicMaterial color="#00AA00" linewidth={3} />
      </line>
      <line ref={ring2Ref} geometry={ring2Geom}>
        <lineBasicMaterial color="#CC0000" linewidth={3} />
      </line>
    </group>
  );
}

// Componente principale Button
export default function HopfButton({
  onClick,
  size = 200,
  label = "Enter",
  style = {}
}) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 150);
    if (onClick) onClick();
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 8px 32px rgba(0, 170, 0, 0.4)'
          : '0 4px 16px rgba(0, 0, 0, 0.3)',
        transition: 'box-shadow 0.3s ease',
        ...style
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ff00" />

        <HopfBand hovered={hovered} clicked={clicked} />
        <HopfRings />
      </Canvas>

      {/* Label overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontSize: size * 0.1,
          fontWeight: 'bold',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          letterSpacing: '2px'
        }}
      >
        {label}
      </div>
    </div>
  );
}
