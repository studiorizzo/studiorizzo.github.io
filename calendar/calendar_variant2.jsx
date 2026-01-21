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

    // Ellissi: altezza = H, larghezza = W - H/2
    const radiusY = H / 2;
    const radiusX = (W - H / 2) / 2;

    ctx.globalAlpha = 0.5;

    // Ellisse A gialla tutto a SINISTRA
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.ellipse(radiusX, H / 2, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ellisse B verde tutto a DESTRA
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.ellipse(W - radiusX, H / 2, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rettangolo rosso sul diametro dell'ellisse B (verde, a destra)
    ctx.fillStyle = 'red';
    const rectX = W - radiusX * 2;
    ctx.fillRect(rectX, H / 2, radiusX * 2, H / 2);

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
