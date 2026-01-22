import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// Hopf Link - due anelli concatenati
function HopfLinkMesh({ showStudio }) {
  const groupRef = useRef();
  const targetRotationRef = useRef(0);

  React.useEffect(() => {
    targetRotationRef.current = showStudio ? 0 : Math.PI;
  }, [showStudio]);

  // Parametri degli anelli
  const R = 1.5;  // Raggio maggiore del toro
  const r = 0.15; // Raggio del tubo

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

  // Posizioni per Hopf link classico:
  // Anello 1 (verde): nel piano XY, centrato all'origine
  // Anello 2 (rosso): nel piano XZ, spostato in modo che passi attraverso l'anello 1

  return (
    <group ref={groupRef}>
      {/* Anello verde - piano XY */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[R, r, 24, 64]} />
        <meshStandardMaterial
          color="#00aa00"
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Anello rosso - piano XZ, passa attraverso l'anello verde */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[R, 0, 0]}>
        <torusGeometry args={[R, r, 24, 64]} />
        <meshStandardMaterial
          color="#cc0000"
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Testo "studio" - al centro dell'anello verde */}
      <Text
        position={[0, 0, 0.1]}
        fontSize={0.5}
        color="#004400"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        studio
      </Text>

      {/* Testo "cliente" - al centro dell'anello rosso */}
      <Text
        position={[R, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        fontSize={0.5}
        color="#440000"
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
  style = {},
  backgroundColor = '#87CEEB' // Sfondo azzurro cielo
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
        style={{ background: backgroundColor }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.4} />

        <HopfLinkMesh showStudio={showStudio} />
      </Canvas>
    </div>
  );
}
