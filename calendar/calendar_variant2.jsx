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

    // Ellissi (Hopf link): altezza = H, larghezza = W - H/2
    const radiusY = H / 2;
    const radiusX = (W - H / 2) / 2;

    const centerA = { x: radiusX, y: H / 2 };
    const centerB = { x: W - radiusX, y: H / 2 };

    // Seifert surface per Hopf link
    // La superficie connette le due ellissi con una banda "twisted"
    // In 2D la rappresentiamo come una superficie tra le curve

    ctx.globalAlpha = 0.3;

    // Disegna la superficie di Seifert come una banda che connette le ellissi
    // Usa strips verticali per simulare la torsione
    const strips = 50;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const nextT = (i + 1) / strips;

      // Parametro angolare sulle ellissi
      const angle1 = Math.PI + t * Math.PI; // metà inferiore ellisse A (da sinistra)
      const angle2 = -nextT * Math.PI;       // metà superiore ellisse B (da destra)

      const angle1Next = Math.PI + nextT * Math.PI;
      const angle2Next = -(i + 1 + 1) / strips * Math.PI;

      // Punti sulle ellissi
      const p1 = {
        x: centerA.x + radiusX * Math.cos(angle1),
        y: centerA.y + radiusY * Math.sin(angle1)
      };
      const p2 = {
        x: centerB.x + radiusX * Math.cos(angle2),
        y: centerB.y + radiusY * Math.sin(angle2)
      };
      const p1Next = {
        x: centerA.x + radiusX * Math.cos(angle1Next),
        y: centerA.y + radiusY * Math.sin(angle1Next)
      };
      const p2Next = {
        x: centerB.x + radiusX * Math.cos(angle2Next),
        y: centerB.y + radiusY * Math.sin(angle2Next)
      };

      // Gradiente per effetto profondità
      const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      gradient.addColorStop(0, 'rgba(255, 255, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0.5)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p2Next.x, p2Next.y);
      ctx.lineTo(p1Next.x, p1Next.y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;

    // Ellisse A gialla tutto a SINISTRA (solo bordo)
    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    ctx.ellipse(centerA.x, centerA.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Ellisse B verde tutto a DESTRA (solo bordo)
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.ellipse(centerB.x, centerB.y, radiusX, radiusY, 0, 0, Math.PI * 2);
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
