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

    // Diametro = H, raggio = H/2
    const radius = H / 2;

    ctx.globalAlpha = 0.5;

    // Cerchio A giallo tutto a SINISTRA
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(radius, H / 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // Cerchio B verde tutto a DESTRA
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(W - radius, H / 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // Rettangolo rosso sul diametro del cerchio B (verde, a destra)
    ctx.fillStyle = 'red';
    const rectX = W - radius * 2;
    ctx.fillRect(rectX, H / 2, radius * 2, H / 2);

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
