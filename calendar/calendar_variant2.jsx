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

    // Centri delle ellissi sullo schermo
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

    // Seifert surface come nastro di Möbius:
    // - u va da 0 a 2π (giro completo)
    // - v va da -1 a 1 (larghezza della banda)
    // - Il twist di 180° è dato da: mentre u va da 0 a 2π,
    //   il "verso" locale della banda ruota di π
    const getSeifertPoint = (u, v) => {
      // v va da 0 a 1, lo mappiamo a "posizione sulla banda"
      // 0 = bordo giallo, 1 = bordo verde

      // Il twist: l'angolo locale ruota di π mentre u fa il giro completo
      const twist = u / 2; // Quando u=2π, twist=π (mezzo giro)

      // Punto sull'ellisse gialla
      const yellow = getYellowPoint(u);
      // Punto sull'ellisse verde (sfasato dal twist)
      const green = getGreenPoint(u + Math.PI);

      // Il vettore che va da giallo a verde
      const dx = green.x + centerDist - yellow.x;
      const dy = green.y - yellow.y;
      const dz = green.z - yellow.z;

      // Applica il twist: ruota il vettore (dx, dy, dz) attorno alla direzione tangente
      const cosT = Math.cos(twist);
      const sinT = Math.sin(twist);

      // Posizione sulla superficie
      const x = yellow.x + v * (dx * cosT);
      const y = yellow.y + v * (dy * cosT - dz * sinT);
      const z = yellow.z + v * (dy * sinT + dz * cosT);

      return { x, y, z };
    };

    // Proiezione 3D -> 2D
    const project = (p3d) => ({
      x: centerYellowScreen.x + p3d.x,
      y: H / 2 - p3d.y,
      z: p3d.z
    });

    // Genera quadrilateri della superficie
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
        const shade = 180 + avgZ * 0.3;

        surfaceQuads.push({
          points: [proj1, proj2, proj3, proj4],
          z: avgZ,
          color: `rgba(${shade}, ${shade}, ${shade}, 0.8)`
        });
      }
    }

    // Depth sort
    surfaceQuads.sort((a, b) => a.z - b.z);

    // Disegna superficie
    for (const quad of surfaceQuads) {
      ctx.fillStyle = quad.color;
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
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
