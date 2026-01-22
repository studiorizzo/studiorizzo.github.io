import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Disco/Banda circolare piatta (come nell'immagine)
function FlatRing({ color, position, rotation }) {
  return (
    <mesh position={position} rotation={rotation}>
      <ringGeometry args={[1.2, 2.5, 128]} />
      <meshStandardMaterial
        color={color}
        side={THREE.DoubleSide}
        metalness={0.1}
        roughness={0.5}
      />
    </mesh>
  );
}

// Gruppo di anelli intrecciati che ruotano (Hopf link style)
function LinkedRings({ showStudio, animating }) {
  const groupRef = useRef();
  const [targetRotation, setTargetRotation] = useState(0);

  useEffect(() => {
    setTargetRotation(showStudio ? 0 : Math.PI);
  }, [showStudio]);

  useFrame(() => {
    if (groupRef.current) {
      // Interpolazione fluida verso la rotazione target
      const diff = targetRotation - groupRef.current.rotation.x;
      if (Math.abs(diff) > 0.01) {
        groupRef.current.rotation.x += diff * 0.08;
      } else {
        groupRef.current.rotation.x = targetRotation;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Anello verde (studio) - orizzontale, leggermente inclinato */}
      <FlatRing
        color="#00cc00"
        position={[0, 0.5, 0]}
        rotation={[Math.PI / 2.5, 0, 0]}
      />

      {/* Anello rosso (cliente) - intrecciato con il verde */}
      <FlatRing
        color="#cc0000"
        position={[0, -0.5, 0]}
        rotation={[Math.PI / 1.8, 0, Math.PI / 3]}
      />

      {/* Testo "studio" - visibile quando showStudio è true */}
      <Text
        position={[0, 0, 1]}
        fontSize={1.2}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {showStudio ? 'studio' : 'cliente'}
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
    setShowStudio(!showStudio);

    setTimeout(() => {
      setAnimating(false);
      if (onClick) onClick(!showStudio ? 'studio' : 'cliente');
    }, 600);
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
        camera={{ position: [0, 0, 8], fov: 45 }}
        style={{ background: '#87ceeb' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, 5]} intensity={0.4} />

        <LinkedRings showStudio={showStudio} animating={animating} />
      </Canvas>
    </div>
  );
}
