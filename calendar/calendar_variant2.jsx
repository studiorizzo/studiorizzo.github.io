import React, { useRef, useEffect, useState } from 'react';

export default function CalendarVariant2() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const bgColor = '#ffffff'; // Sfondo bianco

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

    console.log('Canvas size:', W, 'x', H, '- Aspect ratio:', (W/H).toFixed(2));

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // Ellisse gialla: altezza = H, larghezza = W - H/2
    const radiusY = H / 2;
    const radiusX = (W - H / 2) / 2;

    // Centro ellisse gialla (a sinistra)
    const centerA = { x: radiusX, y: H / 2 };

    // Ellisse verde ruotata 90° orizzontalmente: appare come linea orizzontale
    // Posizione: y = H/2, da x = W - 2*radiusX a x = W
    const lineY = H / 2;
    const lineStartX = W - 2 * radiusX;
    const lineEndX = W;

    // Seifert surface: superficie continua che connette ellisse gialla a linea verde
    // La superficie si "attorciglia" collegando punti dell'ellisse alla linea

    ctx.globalAlpha = 0.4;

    // Creo un gradiente per la superficie
    const gradient = ctx.createLinearGradient(centerA.x, centerA.y, (lineStartX + lineEndX) / 2, lineY);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0.6)');

    ctx.fillStyle = gradient;
    ctx.beginPath();

    // Parto dal punto sinistro della linea verde
    ctx.moveTo(lineStartX, lineY);

    // Percorro la metà superiore dell'ellisse gialla (da destra a sinistra)
    // Questo crea la connessione dalla linea all'ellisse
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Angolo da 0 a -PI (metà superiore, da destra a sinistra)
      const angle = -t * Math.PI;
      const x = centerA.x + radiusX * Math.cos(angle);
      const y = centerA.y + radiusY * Math.sin(angle);
      ctx.lineTo(x, y);
    }

    // Percorro la metà inferiore dell'ellisse gialla (da sinistra a destra)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Angolo da -PI a -2*PI (metà inferiore, da sinistra a destra)
      const angle = -Math.PI - t * Math.PI;
      const x = centerA.x + radiusX * Math.cos(angle);
      const y = centerA.y + radiusY * Math.sin(angle);
      ctx.lineTo(x, y);
    }

    // Torno al punto destro della linea verde
    ctx.lineTo(lineEndX, lineY);

    // Chiudo lungo la linea verde
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;

    // Ellisse gialla (frontale)
    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    ctx.ellipse(centerA.x, centerA.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Linea verde (ellisse ruotata 90° vista di taglio)
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineY);
    ctx.lineTo(lineEndX, lineY);
    ctx.stroke();

  }, [size, bgColor]);

  return (
    <div ref={wrapperRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
