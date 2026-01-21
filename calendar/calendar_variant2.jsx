import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../src/context/ThemeContext';

export default function CalendarVariant2({ onMenuClick }) {
  const { mode } = useTheme();
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const bgColor = mode === 'dark' ? '#0E1416' : '#F5FAFC';
  const borderColor = mode === 'dark' ? '#3d4665' : '#d0d7de';
  const btnBg = mode === 'dark' ? '#0E1416' : '#F5FAFC';
  const btnColor = mode === 'dark' ? '#DEE3E5' : '#171D1E';

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

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    const radius = H;

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(0, H / 2, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(W, H / 2, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = 'red';
    const rectX = W - radius;
    const rectY = H / 2;
    const rectW = radius * 2;
    const rectH = H - rectY;
    ctx.fillRect(rectX, rectY, rectW, rectH);

  }, [size, bgColor]);

  return (
    <div ref={wrapperRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      <button
        onClick={onMenuClick}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          padding: 0,
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          backgroundColor: btnBg,
          color: btnColor,
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"></path>
        </svg>
      </button>
    </div>
  );
}
