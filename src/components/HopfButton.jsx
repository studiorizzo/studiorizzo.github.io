import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Hopf Band - vera superficie di Seifert dalla Hopf fibration
function HopfBandMesh({ showStudio }) {
  const groupRef = useRef();
  const targetRotationRef = useRef(0);

  // Aggiorna target rotation quando cambia showStudio
  React.useEffect(() => {
    targetRotationRef.current = showStudio ? 0 : Math.PI;
  }, [showStudio]);

  // Parametri Hopf band
  const bandWidth = Math.PI / 3; // 60°
  const stepsV = 60;
  const stepsTheta = 120;

  // Genera geometria della Hopf band e degli anelli
  const { greenGeometry, redGeometry, greenRingGeometry, redRingGeometry, greenRingCenter, redRingCenter } = useMemo(() => {
    // Arco su S²
    const getArcPoint = (v) => {
      const phi = Math.PI / 2 - bandWidth / 2 + v * bandWidth;
      return {
        nx: Math.cos(phi),
        ny: 0,
        nz: Math.sin(phi)
      };
    };

    // Spinore per la fibra
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
        return { z1_re: 0, z1_im: 0, z2_re: 1, z2_im: 0 };
      }
    };

    // Punto su S³
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

    // Proiezione stereografica S³→R³
    const stereographic = (x1, x2, x3, x4) => {
      const denom = 1 - x4;
      const maxVal = 20;
      if (Math.abs(denom) < 0.01) {
        const sign = denom >= 0 ? 1 : -1;
        return { x: x1 * maxVal * sign, y: x2 * maxVal * sign, z: x3 * maxVal * sign };
      }
      return { x: x1 / denom, y: x2 / denom, z: x3 / denom };
    };

    // Punto sulla Hopf band
    const getHopfBandPoint = (v, theta) => {
      const { nx, ny, nz } = getArcPoint(v);
      const { x1, x2, x3, x4 } = getFiberPointS3(nx, ny, nz, theta);
      return stereographic(x1, x2, x3, x4);
    };

    // Griglia di punti
    const grid = [];
    const maxCoord = 10;
    for (let i = 0; i <= stepsV; i++) {
      const row = [];
      const v = i / stepsV;
      for (let j = 0; j <= stepsTheta; j++) {
        const theta = (j / stepsTheta) * Math.PI * 2;
        const p = getHopfBandPoint(v, theta);
        const x = Math.max(-maxCoord, Math.min(maxCoord, p.x));
        const y = Math.max(-maxCoord, Math.min(maxCoord, p.y));
        const z = Math.max(-maxCoord, Math.min(maxCoord, p.z));
        row.push(new THREE.Vector3(x, y, z));
      }
      grid.push(row);
    }

    // Crea geometrie separate per le due facce
    const frontVertices = [];
    const frontIndices = [];
    const backVertices = [];
    const backIndices = [];

    // Genera vertici per entrambe le facce
    for (let i = 0; i <= stepsV; i++) {
      for (let j = 0; j <= stepsTheta; j++) {
        const p = grid[i][j];
        frontVertices.push(p.x, p.y, p.z);
        backVertices.push(p.x, p.y, p.z);
      }
    }

    // Genera indici (triangoli) - ordine diverso per le due facce
    for (let i = 0; i < stepsV; i++) {
      for (let j = 0; j < stepsTheta; j++) {
        const a = i * (stepsTheta + 1) + j;
        const b = a + 1;
        const c = a + (stepsTheta + 1);
        const d = c + 1;

        // Front face (counter-clockwise)
        frontIndices.push(a, c, b);
        frontIndices.push(b, c, d);

        // Back face (clockwise = reversed)
        backIndices.push(a, b, c);
        backIndices.push(b, d, c);
      }
    }

    // Crea BufferGeometry per faccia verde (front)
    const greenGeom = new THREE.BufferGeometry();
    greenGeom.setAttribute('position', new THREE.Float32BufferAttribute(frontVertices, 3));
    greenGeom.setIndex(frontIndices);
    greenGeom.computeVertexNormals();

    // Crea BufferGeometry per faccia rossa (back)
    const redGeom = new THREE.BufferGeometry();
    redGeom.setAttribute('position', new THREE.Float32BufferAttribute(backVertices, 3));
    redGeom.setIndex(backIndices);
    redGeom.computeVertexNormals();

    // Crea gli anelli di bordo (Hopf link)
    const createRingCurve = (v) => {
      const points = [];
      for (let j = 0; j <= stepsTheta; j++) {
        const theta = (j / stepsTheta) * Math.PI * 2;
        const p = getHopfBandPoint(v, theta);
        const x = Math.max(-maxCoord, Math.min(maxCoord, p.x));
        const y = Math.max(-maxCoord, Math.min(maxCoord, p.y));
        const z = Math.max(-maxCoord, Math.min(maxCoord, p.z));
        points.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(points, true);
    };

    // Calcola il centro di un anello
    const computeRingCenter = (v) => {
      let cx = 0, cy = 0, cz = 0;
      const samples = 64;
      for (let j = 0; j < samples; j++) {
        const theta = (j / samples) * Math.PI * 2;
        const p = getHopfBandPoint(v, theta);
        cx += Math.max(-maxCoord, Math.min(maxCoord, p.x));
        cy += Math.max(-maxCoord, Math.min(maxCoord, p.y));
        cz += Math.max(-maxCoord, Math.min(maxCoord, p.z));
      }
      return new THREE.Vector3(cx / samples, cy / samples, cz / samples);
    };

    const greenCurve = createRingCurve(0);
    const redCurve = createRingCurve(1);

    const tubeRadius = 0.15;
    const tubeSegments = 64;
    const radialSegments = 16;

    const greenRingGeom = new THREE.TubeGeometry(greenCurve, tubeSegments, tubeRadius, radialSegments, true);
    const redRingGeom = new THREE.TubeGeometry(redCurve, tubeSegments, tubeRadius, radialSegments, true);

    const greenCenter = computeRingCenter(0);
    const redCenter = computeRingCenter(1);

    return {
      greenGeometry: greenGeom,
      redGeometry: redGeom,
      greenRingGeometry: greenRingGeom,
      redRingGeometry: redRingGeom,
      greenRingCenter: greenCenter,
      redRingCenter: redCenter
    };
  }, [bandWidth, stepsV, stepsTheta]);

  // Animazione rotazione
  useFrame(() => {
    if (groupRef.current) {
      const diff = targetRotationRef.current - groupRef.current.rotation.y;
      if (Math.abs(diff) > 0.005) {
        groupRef.current.rotation.y += diff * 0.06;
      } else {
        groupRef.current.rotation.y = targetRotationRef.current;
      }
    }
  });

  return (
    <group ref={groupRef} scale={0.35}>
      {/* Faccia verde (front) - "studio" */}
      <mesh geometry={greenGeometry}>
        <meshStandardMaterial
          color="#00aa00"
          side={THREE.FrontSide}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Faccia rossa (back) - "cliente" */}
      <mesh geometry={redGeometry}>
        <meshStandardMaterial
          color="#cc0000"
          side={THREE.FrontSide}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Testo "studio" sulla faccia verde */}
      <Text
        position={[0, 0, 3]}
        fontSize={2}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        studio
      </Text>

      {/* Testo "cliente" sulla faccia rossa (retro) */}
      <Text
        position={[0, 0, -3]}
        rotation={[0, Math.PI, 0]}
        fontSize={2}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        cliente
      </Text>
    </group>
  );
}

// Componente principale Button
export default function HopfButton({
  onClick,
  size = 400,
  style = {}
}) {
  const [showStudio, setShowStudio] = useState(true);
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (animating) return;

    setAnimating(true);
    const newState = !showStudio;
    setShowStudio(newState);

    setTimeout(() => {
      setAnimating(false);
      if (onClick) onClick(newState ? 'studio' : 'cliente');
    }, 800);
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        cursor: 'pointer',
        position: 'relative',
        ...style
      }}
      onClick={handleClick}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ background: '#87ceeb' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.4} />

        <HopfBandMesh showStudio={showStudio} />
      </Canvas>
    </div>
  );
}
