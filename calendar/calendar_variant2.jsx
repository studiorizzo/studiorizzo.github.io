import React, { useRef, useEffect, useState } from 'react';

export default function CalendarVariant2() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [viewAngleX, setViewAngleX] = useState(20);
  const [viewAngleY, setViewAngleY] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const bgColor = '#87CEEB'; // Azzurro come l'immagine Wikipedia

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

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setViewAngleY(prev => prev + dx * 0.5);
    setViewAngleX(prev => prev + dy * 0.5);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
    const centerX = W / 2;
    const centerY = H / 2;
    const scale = Math.min(W, H) * 0.35;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // Rotazioni per la vista
    const rotX = (viewAngleX * Math.PI) / 180;
    const rotY = (viewAngleY * Math.PI) / 180;

    const rotatePoint = (x, y, z) => {
      // Rotazione attorno a Y
      let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
      let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
      // Rotazione attorno a X
      let y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
      let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
      return { x: x1, y: y1, z: z2 };
    };

    const project = (p) => ({
      x: centerX + p.x * scale,
      y: centerY - p.y * scale,
      z: p.z
    });

    // HOPF LINK CORRETTO: due cerchi linkati (uno passa attraverso l'altro)
    //
    // Cerchio verde: nel piano z=0, centrato in origine, raggio 1
    // Cerchio rosso: nel piano y=0, centrato in (1,0,0), raggio 1
    // In questo modo il cerchio rosso PASSA ATTRAVERSO il cerchio verde

    const R = 1.0;

    // Cerchio verde: piano XY (z=0), centro (0,0,0)
    const getGreenCircle = (t) => ({
      x: R * Math.cos(t),
      y: R * Math.sin(t),
      z: 0
    });

    // Cerchio rosso: piano XZ (y=0), centro (1,0,0) - passa attraverso il verde
    const getRedCircle = (t) => ({
      x: 1 + R * Math.cos(t),
      y: 0,
      z: R * Math.sin(t)
    });

    // Seifert surface: banda che connette i due cerchi con twist
    // u: angolo (0 -> 2π)
    // v: posizione sulla banda (0 = verde, 1 = rosso)
    const getSeifertPoint = (u, v) => {
      const green = getGreenCircle(u);
      const red = getRedCircle(u);

      // Interpolazione lineare - la banda connette punti allo stesso parametro u
      return {
        x: green.x * (1 - v) + red.x * v,
        y: green.y * (1 - v) + red.y * v,
        z: green.z * (1 - v) + red.z * v
      };
    };

    const stepsU = 60;
    const stepsV = 30;

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

        // Ruota e proietta
        const rp1 = rotatePoint(p1.x, p1.y, p1.z);
        const rp2 = rotatePoint(p2.x, p2.y, p2.z);
        const rp3 = rotatePoint(p3.x, p3.y, p3.z);
        const rp4 = rotatePoint(p4.x, p4.y, p4.z);

        const proj1 = project(rp1);
        const proj2 = project(rp2);
        const proj3 = project(rp3);
        const proj4 = project(rp4);

        const avgZ = (rp1.z + rp2.z + rp3.z + rp4.z) / 4;

        // Calcola normale per shading
        const edge1 = { x: rp2.x - rp1.x, y: rp2.y - rp1.y, z: rp2.z - rp1.z };
        const edge2 = { x: rp4.x - rp1.x, y: rp4.y - rp1.y, z: rp4.z - rp1.z };
        const normal = {
          x: edge1.y * edge2.z - edge1.z * edge2.y,
          y: edge1.z * edge2.x - edge1.x * edge2.z,
          z: edge1.x * edge2.y - edge1.y * edge2.x
        };
        const len = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
        const nz = len > 0 ? Math.abs(normal.z / len) : 0;

        const shade = Math.floor(200 + nz * 55);

        surfaceQuads.push({
          points: [proj1, proj2, proj3, proj4],
          z: avgZ,
          color: `rgb(${shade}, ${shade}, ${shade})`
        });
      }
    }

    // Depth sort
    surfaceQuads.sort((a, b) => a.z - b.z);

    // Disegna superficie
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

    // Disegna cerchio verde (bordo v=0)
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#00AA00';
    ctx.beginPath();
    for (let i = 0; i <= stepsU; i++) {
      const u = (i / stepsU) * Math.PI * 2;
      const p = getGreenCircle(u);
      const rp = rotatePoint(p.x, p.y, p.z);
      const proj = project(rp);
      if (i === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Disegna cerchio rosso (bordo v=1)
    ctx.strokeStyle = '#CC0000';
    ctx.beginPath();
    for (let i = 0; i <= stepsU; i++) {
      const u = (i / stepsU) * Math.PI * 2;
      const p = getRedCircle(u);
      const rp = rotatePoint(p.x, p.y, p.z);
      const proj = project(rp);
      if (i === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Info
    ctx.fillStyle = '#333';
    ctx.font = '14px monospace';
    ctx.fillText('Trascina per ruotare la vista', 10, 20);

  }, [size, bgColor, viewAngleX, viewAngleY]);

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
