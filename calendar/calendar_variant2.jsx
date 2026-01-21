import React, { useRef, useEffect, useState } from 'react';

export default function CalendarVariant2() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [rotationYellow, setRotationYellow] = useState(0);
  const [rotationGreen, setRotationGreen] = useState(90);
  const [isDragging, setIsDragging] = useState(false);
  const [activeEllipse, setActiveEllipse] = useState(null);
  const [lastMouseX, setLastMouseX] = useState(0);

  const bgColor = '#ffffff';

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const getActiveZone = (mouseX, W, radiusX) => {
    const yellowEnd = 2 * radiusX;
    const greenStart = W - 2 * radiusX;
    if (mouseX < greenStart && mouseX < yellowEnd) {
      return 'yellow';
    } else if (mouseX > yellowEnd && mouseX > greenStart) {
      return 'green';
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const W = size.width;
    const H = size.height;
    const radiusX = (W - H / 2) / 2;
    const zone = getActiveZone(mouseX, W, radiusX);
    if (zone) {
      setIsDragging(true);
      setActiveEllipse(zone);
      setLastMouseX(e.clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !activeEllipse) return;
    const deltaX = e.clientX - lastMouseX;
    const rotationSpeed = 0.5;
    if (activeEllipse === 'yellow') {
      setRotationYellow(prev => prev + deltaX * rotationSpeed);
    } else if (activeEllipse === 'green') {
      setRotationGreen(prev => prev + deltaX * rotationSpeed);
    }
    setLastMouseX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveEllipse(null);
  };

  useEffect(() => {
    if (!canvasRef.current || size.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = size.width + 'px';
    canvas.style.height = size.height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const W = size.width;
    const H = size.height;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    const radiusY = H / 2;
    const radiusX = (W - H / 2) / 2;

    const centerYellowScreen = { x: radiusX, y: H / 2 };
    const centerGreenScreen = { x: W - radiusX, y: H / 2 };
    const centerDist = centerGreenScreen.x - centerYellowScreen.x;

    // Rotazione intorno all'asse X
    const rotateAroundX = (x, y, z, angleDeg) => {
      const rad = (angleDeg * Math.PI) / 180;
      return {
        x: x,
        y: y * Math.cos(rad) - z * Math.sin(rad),
        z: y * Math.sin(rad) + z * Math.cos(rad)
      };
    };

    const stepsU = 100;
    const stepsV = 40;

    // Punto sull'ellisse gialla
    const getYellowPoint = (u) => {
      const x = radiusX * Math.cos(u);
      const y = radiusY * Math.sin(u);
      return rotateAroundX(x, y, 0, rotationYellow);
    };

    // Punto sull'ellisse verde
    const getGreenPoint = (u) => {
      const x = radiusX * Math.cos(u);
      const y = radiusY * Math.sin(u);
      return rotateAroundX(x, y, 0, rotationGreen);
    };

    // Seifert surface per Hopf link:
    // È un ANNULUS (banda orientabile) con TWO HALF-TWISTS
    // u: parametro lungo la banda (0 -> 2π)
    // v: parametro attraverso la banda (0 = bordo giallo, 1 = bordo verde)
    // Two half-twists = twist totale di π mentre u va da 0 a 2π
    const getSeifertPoint = (u, v) => {
      // Punto sul bordo giallo
      const yellow = getYellowPoint(u);

      // Per l'annulus con two half-twists:
      // Il punto sul bordo verde è sfasato progressivamente
      // Quando u=2π, lo sfasamento totale è π (two half-twists)
      const greenOffset = u; // Sfasamento progressivo: da 0 a 2π
      const green = getGreenPoint(u + greenOffset);

      // Interpolazione lineare tra giallo e verde
      const t = v;
      const x = yellow.x * (1 - t) + (green.x + centerDist) * t;
      const y = yellow.y * (1 - t) + green.y * t;
      const z = yellow.z * (1 - t) + green.z * t;

      return { x, y, z };
    };

    // Proiezione 3D -> 2D
    const project = (p3d) => ({
      x: centerYellowScreen.x + p3d.x,
      y: H / 2 - p3d.y,
      z: p3d.z
    });

    // Genera quadrilateri
    const surfaceQuads = [];

    for (let i = 0; i < stepsU; i++) {
      const u1 = (i / stepsU) * Math.PI * 2;
      const u2 = ((i + 1) / stepsU) * Math.PI * 2;

      for (let j = 0; j < stepsV; j++) {
        const v1 = j / stepsV;
        const v2 = (j + 1) / stepsV;

        const p1 = getSeifertPoint(u1, v1);
        const p2 = getSeifertPoint(u2, v1);
        const p3 = getSeifertPoint(u2, v2);
        const p4 = getSeifertPoint(u1, v2);

        const proj1 = project(p1);
        const proj2 = project(p2);
        const proj3 = project(p3);
        const proj4 = project(p4);

        const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;

        // Calcola normale per shading
        const edge1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
        const edge2 = { x: p4.x - p1.x, y: p4.y - p1.y, z: p4.z - p1.z };
        const normal = {
          x: edge1.y * edge2.z - edge1.z * edge2.y,
          y: edge1.z * edge2.x - edge1.x * edge2.z,
          z: edge1.x * edge2.y - edge1.y * edge2.x
        };
        const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
        if (len > 0) {
          normal.x /= len;
          normal.y /= len;
          normal.z /= len;
        }

        // Luce dalla camera (direzione Z)
        const lightIntensity = Math.abs(normal.z);
        const shade = Math.floor(150 + lightIntensity * 100);

        surfaceQuads.push({
          points: [proj1, proj2, proj3, proj4],
          z: avgZ,
          color: `rgba(${shade}, ${shade}, ${shade}, 0.85)`
        });
      }
    }

    // Depth sort
    surfaceQuads.sort((a, b) => a.z - b.z);

    // Disegna superficie
    for (const quad of surfaceQuads) {
      ctx.fillStyle = quad.color;
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(quad.points[0].x, quad.points[0].y);
      ctx.lineTo(quad.points[1].x, quad.points[1].y);
      ctx.lineTo(quad.points[2].x, quad.points[2].y);
      ctx.lineTo(quad.points[3].x, quad.points[3].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Disegna ellisse gialla
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    for (let i = 0; i <= stepsU; i++) {
      const u = (i / stepsU) * Math.PI * 2;
      const p3d = getYellowPoint(u);
      const proj = project(p3d);
      if (i === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Disegna ellisse verde
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    for (let i = 0; i <= stepsU; i++) {
      const u = (i / stepsU) * Math.PI * 2;
      const p3d = getGreenPoint(u);
      const proj = project({ x: p3d.x + centerDist, y: p3d.y, z: p3d.z });
      if (i === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Info
    ctx.fillStyle = '#333';
    ctx.font = '14px monospace';
    ctx.fillText(`Gialla: ${rotationYellow.toFixed(0)}°  Verde: ${rotationGreen.toFixed(0)}°`, 10, 20);

  }, [size, bgColor, rotationYellow, rotationGreen]);

  return (
    <div ref={wrapperRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
