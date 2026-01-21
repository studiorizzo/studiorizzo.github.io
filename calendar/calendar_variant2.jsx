import React, { useRef, useEffect, useState } from 'react';

export default function CalendarVariant2() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [rotationYellow, setRotationYellow] = useState(0); // Rotazione ellisse gialla (gradi)
  const [rotationGreen, setRotationGreen] = useState(90);   // Rotazione ellisse verde (90° = linea orizzontale)
  const [isDragging, setIsDragging] = useState(false);
  const [activeEllipse, setActiveEllipse] = useState(null); // 'yellow', 'green', o null
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

  // Determina quale ellisse è attiva in base alla posizione del mouse
  const getActiveZone = (mouseX, W, radiusX) => {
    const yellowEnd = 2 * radiusX;       // Fine zona gialla
    const greenStart = W - 2 * radiusX;  // Inizio zona verde

    if (mouseX < greenStart && mouseX < yellowEnd) {
      // Solo zona gialla (sinistra)
      return 'yellow';
    } else if (mouseX > yellowEnd && mouseX > greenStart) {
      // Solo zona verde (destra)
      return 'green';
    } else {
      // Zona di sovrapposizione (centro) - nessuna rotazione
      return null;
    }
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
    const rotationSpeed = 0.5; // gradi per pixel

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

  // Funzione per proiettare un punto 3D in 2D (rotazione intorno all'asse Y)
  const projectPoint = (x, y, z, rotationDeg, centerX, centerY) => {
    const rad = (rotationDeg * Math.PI) / 180;
    // Rotazione intorno all'asse Y
    const x3d = x * Math.cos(rad) - z * Math.sin(rad);
    const z3d = x * Math.sin(rad) + z * Math.cos(rad);
    // Proiezione ortografica (ignora z per semplicità)
    return {
      x: centerX + x3d,
      y: centerY + y,
      z: z3d // Per depth sorting
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

    // Centro ellisse gialla (a sinistra)
    const centerYellow = { x: radiusX, y: H / 2 };
    // Centro ellisse verde (a destra)
    const centerGreen = { x: W - radiusX, y: H / 2 };

    // Genera punti dell'ellisse gialla con rotazione
    const generateEllipsePoints = (centerX, centerY, rx, ry, rotation, steps = 100) => {
      const points = [];
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        // Punto sull'ellisse in coordinate locali (ellisse nel piano XY)
        const localX = rx * Math.cos(t);
        const localY = ry * Math.sin(t);
        const localZ = 0;
        // Proietta con rotazione
        const projected = projectPoint(localX, localY, localZ, rotation, centerX, centerY);
        points.push(projected);
      }
      return points;
    };

    // Genera punti dell'ellisse verde (inizialmente nel piano XZ, quindi vista di taglio)
    const generateGreenEllipsePoints = (centerX, centerY, rx, ry, rotation, steps = 100) => {
      const points = [];
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        // Ellisse nel piano XZ (perpendicolare allo schermo)
        const localX = rx * Math.cos(t);
        const localY = 0;
        const localZ = ry * Math.sin(t);
        // Proietta con rotazione (rotation=90 -> linea orizzontale, rotation=0 -> ellisse piena)
        const projected = projectPoint(localX, localY, localZ, rotation, centerX, centerY);
        points.push(projected);
      }
      return points;
    };

    const yellowPoints = generateEllipsePoints(centerYellow.x, centerYellow.y, radiusX, radiusY, rotationYellow);
    const greenPoints = generateGreenEllipsePoints(centerGreen.x, centerGreen.y, radiusX, radiusY, rotationGreen);

    // Disegna la superficie di Seifert
    ctx.globalAlpha = 0.4;
    const gradient = ctx.createLinearGradient(centerYellow.x, centerYellow.y, centerGreen.x, centerGreen.y);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0.6)');
    ctx.fillStyle = gradient;

    // Superficie come connessione tra le due ellissi
    ctx.beginPath();
    // Percorri l'ellisse gialla
    ctx.moveTo(yellowPoints[0].x, yellowPoints[0].y);
    for (let i = 1; i < yellowPoints.length; i++) {
      ctx.lineTo(yellowPoints[i].x, yellowPoints[i].y);
    }
    // Connetti all'ellisse verde (in ordine inverso per creare una superficie chiusa)
    for (let i = greenPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(greenPoints[i].x, greenPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;

    // Disegna ellisse gialla
    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(yellowPoints[0].x, yellowPoints[0].y);
    for (let i = 1; i < yellowPoints.length; i++) {
      ctx.lineTo(yellowPoints[i].x, yellowPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Disegna ellisse verde
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(greenPoints[0].x, greenPoints[0].y);
    for (let i = 1; i < greenPoints.length; i++) {
      ctx.lineTo(greenPoints[i].x, greenPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Mostra info rotazione
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
