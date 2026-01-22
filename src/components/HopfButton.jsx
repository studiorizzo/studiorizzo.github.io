import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Due tori intrecciati (vero Hopf link)
function HopfLink({ showStudio }) {
  const groupRef = useRef();
  const [targetRotation, setTargetRotation] = useState(0);

  useEffect(() => {
    setTargetRotation(showStudio ? 0 : Math.PI);
  }, [showStudio]);

  useFrame(() => {
    if (groupRef.current) {
      const diff = targetRotation - groupRef.current.rotation.y;
      if (Math.abs(diff) > 0.01) {
        groupRef.current.rotation.y += diff * 0.08;
      } else {
        groupRef.current.rotation.y = targetRotation;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Toro verde - orizzontale (piano XZ) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.4, 64, 128]} />
        <meshStandardMaterial
          color="#008800"
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Toro rosso - verticale (piano XY), passa attraverso il verde */}
      <mesh position={[2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2, 0.4, 64, 128]} />
        <meshStandardMaterial
          color="#aa0000"
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Testo centrale */}
      <Text
        position={[0, 0, 2.5]}
        fontSize={1.4}
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
        camera={{ position: [0, 0, 10], fov: 45 }}
        style={{ background: '#87ceeb' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, 5]} intensity={0.4} />

        <HopfLink showStudio={showStudio} />
      </Canvas>
    </div>
  );
}
