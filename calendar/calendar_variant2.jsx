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

    // Distanza tra i centri
    const centerDist = centerGreenScreen.x - centerYellowScreen.x;

    const stepsU = 80; // Punti lungo l'ellisse (circonferenza della banda)
    const stepsV = 30; // Punti attraverso la banda (da gialla a verde)

    // Punto sull'ellisse gialla (nel suo sistema di coordinate locale, centrato in 0,0,0)
    const getYellowPoint = (u) => {
      const x = radiusX * Math.cos(u);
      const y = radiusY * Math.sin(u);
      const z = 0;
      return rotateAroundX(x, y, z, rotationYellow);
    };

    // Punto sull'ellisse verde (nel suo sistema di coordinate locale, centrato in 0,0,0)
    const getGreenPoint = (u) => {
      const x = radiusX * Math.cos(u);
      const y = radiusY * Math.sin(u);
      const z = 0;
      return rotateAroundX(x, y, z, rotationGreen);
    };

    // Seifert surface: banda che connette ellisse gialla a ellisse verde
    // u: parametro lungo la banda (0 -> 2π)
    // v: parametro attraverso la banda (0 = bordo giallo, 1 = bordo verde)
    const getSeifertPoint = (u, v) => {
      // Punto sul bordo giallo
      const yellow = getYellowPoint(u);
      // Punto sul bordo verde
      const green = getGreenPoint(u);

      // Interpolazione lineare tra i due bordi
      // Il centro si sposta da centerYellow a centerGreen
      const x = yellow.x * (1 - v) + green.x * v + v * centerDist;
      const y = yellow.y * (1 - v) + green.y * v;
      const z = yellow.z * (1 - v) + green.z * v;

      return { x, y, z };
    };

    // Proiezione 3D -> 2D
    const project = (p3d) => {
      return {
        x: centerYellowScreen.x + p3d.x,
        y: H / 2 - p3d.y,
        z: p3d.z
      };
    };

    // Genera i quadrilateri della superficie
    const surfaceQuads = [];

    for (let i = 0; i < stepsU; i++) {
      const u1 = (i / stepsU) * Math.PI * 2;
      const u2 = ((i + 1) / stepsU) * Math.PI * 2;

      for (let j = 0; j < stepsV; j++) {
        const v1 = j / stepsV;
        const v2 = (j + 1) / stepsV;

        // 4 vertici del quadrilatero sulla superficie
        const p1 = getSeifertPoint(u1, v1);
        const p2 = getSeifertPoint(u2, v1);
        const p3 = getSeifertPoint(u2, v2);
        const p4 = getSeifertPoint(u1, v2);

        // Proietta in 2D
        const proj1 = project(p1);
        const proj2 = project(p2);
        const proj3 = project(p3);
        const proj4 = project(p4);

        // Z medio per depth sorting
        const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;

        // Colore della superficie (grigio chiaro con leggera variazione)
        const shade = 200 + Math.sin(u1 * 3) * 30;

        surfaceQuads.push({
          points: [proj1, proj2, proj3, proj4],
          z: avgZ,
          color: `rgba(${shade}, ${shade}, ${shade}, 0.7)`
        });
      }
    }

    // Depth sort - disegna prima quelli più lontani
    surfaceQuads.sort((a, b) => a.z - b.z);

    // Disegna i quadrilateri della superficie
    for (const quad of surfaceQuads) {
      ctx.fillStyle = quad.color;
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
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

    // Disegna le ellissi come bordi della superficie
    ctx.lineWidth = 4;

    // Ellisse gialla (bordo a v=0)
    const yellowPoints = [];
    for (let i = 0; i <= stepsU; i++) {
      const u = (i / stepsU) * Math.PI * 2;
      const p3d = getYellowPoint(u);
      const proj = project(p3d);
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

    // Ellisse verde (bordo a v=1)
    const greenPoints = [];
    for (let i = 0; i <= stepsU; i++) {
      const u = (i / stepsU) * Math.PI * 2;
      const p3d = getGreenPoint(u);
      // Aggiungi l'offset del centro
      const proj = project({ x: p3d.x + centerDist, y: p3d.y, z: p3d.z });
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
