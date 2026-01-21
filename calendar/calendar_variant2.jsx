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

  // Rotazione intorno all'asse X (orizzontale)
  const rotateAroundX = (x, y, z, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: x,
      y: y * cos - z * sin,
      z: y * sin + z * cos
    };
  };

  // Proiezione 3D -> 2D (ortografica)
  const project = (point3d, centerX, centerY) => {
    return {
      x: centerX + point3d.x,
      y: centerY - point3d.y, // Y invertito per coordinate schermo
      z: point3d.z
    };
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

    // Centri delle ellissi sullo schermo
    const centerYellow = { x: radiusX, y: H / 2 };
    const centerGreen = { x: W - radiusX, y: H / 2 };

    const stepsU = 80; // Punti lungo l'ellisse
    const stepsV = 20; // Punti lungo la superficie (da gialla a verde)

    // Genera punto sull'ellisse nel piano XY, poi ruota intorno a X
    const getEllipsePoint3D = (u, rx, ry, rotationDeg) => {
      // Ellisse nel piano XY (z=0)
      const x = rx * Math.cos(u);
      const y = ry * Math.sin(u);
      const z = 0;
      // Ruota intorno all'asse X
      return rotateAroundX(x, y, z, rotationDeg);
    };

    // Genera tutti i punti della superficie di Seifert
    // La superficie interpola tra ellisse gialla e ellisse verde
    const surfaceQuads = [];

    for (let i = 0; i < stepsU; i++) {
      const u1 = (i / stepsU) * Math.PI * 2;
      const u2 = ((i + 1) / stepsU) * Math.PI * 2;

      for (let j = 0; j < stepsV; j++) {
        const v1 = j / stepsV;
        const v2 = (j + 1) / stepsV;

        // 4 punti 3D dell'ellisse gialla e verde per questo quadrilatero
        const yellow1 = getEllipsePoint3D(u1, radiusX, radiusY, rotationYellow);
        const yellow2 = getEllipsePoint3D(u2, radiusX, radiusY, rotationYellow);
        const green1 = getEllipsePoint3D(u1, radiusX, radiusY, rotationGreen);
        const green2 = getEllipsePoint3D(u2, radiusX, radiusY, rotationGreen);

        // Interpolazione lineare per i 4 vertici del quad
        const lerp3D = (a, b, t) => ({
          x: a.x * (1 - t) + b.x * t,
          y: a.y * (1 - t) + b.y * t,
          z: a.z * (1 - t) + b.z * t
        });

        // I centri 3D delle ellissi (per l'interpolazione della posizione)
        const centerYellow3D = { x: 0, y: 0, z: 0 };
        const centerGreen3D = { x: centerGreen.x - centerYellow.x, y: 0, z: 0 };

        // Punti sulla superficie
        const p1_local = lerp3D(yellow1, green1, v1);
        const p2_local = lerp3D(yellow2, green2, v1);
        const p3_local = lerp3D(yellow2, green2, v2);
        const p4_local = lerp3D(yellow1, green1, v2);

        // Aggiungi offset del centro interpolato
        const centerOffset = lerp3D(centerYellow3D, centerGreen3D, (v1 + v2) / 2);

        const p1 = { x: p1_local.x + centerYellow.x + v1 * (centerGreen.x - centerYellow.x), y: p1_local.y, z: p1_local.z };
        const p2 = { x: p2_local.x + centerYellow.x + v1 * (centerGreen.x - centerYellow.x), y: p2_local.y, z: p2_local.z };
        const p3 = { x: p3_local.x + centerYellow.x + v2 * (centerGreen.x - centerYellow.x), y: p3_local.y, z: p3_local.z };
        const p4 = { x: p4_local.x + centerYellow.x + v2 * (centerGreen.x - centerYellow.x), y: p4_local.y, z: p4_local.z };

        // Proietta in 2D
        const proj1 = project(p1, 0, H / 2);
        const proj2 = project(p2, 0, H / 2);
        const proj3 = project(p3, 0, H / 2);
        const proj4 = project(p4, 0, H / 2);

        // Z medio per depth sorting
        const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;

        // Colore interpolato giallo -> verde
        const t = (v1 + v2) / 2;
        const r = Math.round(255 * (1 - t) + 0 * t);
        const g = Math.round(255 * (1 - t) + 255 * t);
        const b = 0;

        surfaceQuads.push({
          points: [proj1, proj2, proj3, proj4],
          z: avgZ,
          color: `rgba(${r}, ${g}, ${b}, 0.6)`
        });
      }
    }

    // Depth sort (painter's algorithm) - disegna prima quelli più lontani
    surfaceQuads.sort((a, b) => a.z - b.z);

    // Disegna i quadrilateri della superficie
    for (const quad of surfaceQuads) {
      ctx.fillStyle = quad.color;
      ctx.beginPath();
      ctx.moveTo(quad.points[0].x, quad.points[0].y);
      ctx.lineTo(quad.points[1].x, quad.points[1].y);
      ctx.lineTo(quad.points[2].x, quad.points[2].y);
      ctx.lineTo(quad.points[3].x, quad.points[3].y);
      ctx.closePath();
      ctx.fill();
    }

    // Disegna le ellissi come contorni
    ctx.lineWidth = 3;

    // Ellisse gialla
    const yellowPoints = [];
    for (let i = 0; i <= stepsU; i++) {
      const u = (i / stepsU) * Math.PI * 2;
      const p3d = getEllipsePoint3D(u, radiusX, radiusY, rotationYellow);
      const proj = project({ x: p3d.x + centerYellow.x, y: p3d.y, z: p3d.z }, 0, H / 2);
      yellowPoints.push(proj);
    }

    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(yellowPoints[0].x, yellowPoints[0].y);
    for (let i = 1; i < yellowPoints.length; i++) {
      ctx.lineTo(yellowPoints[i].x, yellowPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Ellisse verde
    const greenPoints = [];
    for (let i = 0; i <= stepsU; i++) {
      const u = (i / stepsU) * Math.PI * 2;
      const p3d = getEllipsePoint3D(u, radiusX, radiusY, rotationGreen);
      const proj = project({ x: p3d.x + centerGreen.x, y: p3d.y, z: p3d.z }, 0, H / 2);
      greenPoints.push(proj);
    }

    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(greenPoints[0].x, greenPoints[0].y);
    for (let i = 1; i < greenPoints.length; i++) {
      ctx.lineTo(greenPoints[i].x, greenPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Info rotazione
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
