import React, { useRef, useEffect, useState } from 'react';

export default function CalendarVariant2() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [viewAngleX, setViewAngleX] = useState(25);
  const [viewAngleY, setViewAngleY] = useState(-40);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const bgColor = '#87CEEB';

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

    const rotX = (viewAngleX * Math.PI) / 180;
    const rotY = (viewAngleY * Math.PI) / 180;

    const rotatePoint = (x, y, z) => {
      let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
      let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
      let y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
      let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
      return { x: x1, y: y1, z: z2 };
    };

    const project = (p) => ({
      x: centerX + p.x * scale,
      y: centerY - p.y * scale,
      z: p.z
    });

    // ========================================
    // VERA HOPF BAND dalla Hopf Fibration
    // ========================================
    //
    // La Hopf band è l'insieme delle fibre della Hopf fibration
    // sopra un ARCO sulla sfera S².
    //
    // Parametri:
    // - v ∈ [0, 1]: posizione sull'arco su S² (v=0 e v=1 sono i bordi = Hopf link)
    // - θ ∈ [0, 2π): posizione sulla fibra (cerchio)
    //
    // Costruzione:
    // 1. Definiamo un arco su S² (semicerchio)
    // 2. Per ogni punto n sull'arco, calcoliamo la fibra (cerchio su S³)
    // 3. Proiettiamo stereograficamente da S³ a R³

    // Arco su S²: centrato attorno al polo nord (0,0,1)
    // bandWidth controlla la larghezza della fascia (in radianti)
    const bandWidth = Math.PI / 3; // 60° (era π = 180°)
    const getArcPoint = (v) => {
      const phi = Math.PI / 2 - bandWidth / 2 + v * bandWidth;
      return {
        nx: Math.cos(phi),
        ny: 0,
        nz: Math.sin(phi)
      };
    };

    // Data un punto n = (nx, ny, nz) su S², calcola lo spinore (z1, z2)
    // tale che la fibra sopra n è { (z1*e^{iθ}, z2*e^{iθ}) : θ ∈ [0,2π) }
    //
    // Formula: z1 = sqrt((1+nz)/2), z2 = (nx + i*ny) / (2*Re(z1))
    // (con gestione speciale per nz ≈ -1)
    const getSpinor = (nx, ny, nz) => {
      const eps = 1e-6;

      if (nz > -1 + eps) {
        const r = Math.sqrt((1 + nz) / 2);
        // z1 = r (reale)
        // z2 = (nx + i*ny) / (2*r)
        return {
          z1_re: r,
          z1_im: 0,
          z2_re: nx / (2 * r),
          z2_im: ny / (2 * r)
        };
      } else {
        // Caso speciale: nz ≈ -1 (polo sud di S²)
        // La fibra è il cerchio nel piano z1 (piano x1-x2)
        return {
          z1_re: 0,
          z1_im: 0,
          z2_re: 1,
          z2_im: 0
        };
      }
    };

    // Calcola punto su S³ dalla fibra sopra (nx, ny, nz) al parametro θ
    // Ritorna (x1, x2, x3, x4) ∈ S³
    const getFiberPointS3 = (nx, ny, nz, theta) => {
      const { z1_re, z1_im, z2_re, z2_im } = getSpinor(nx, ny, nz);

      const cos_t = Math.cos(theta);
      const sin_t = Math.sin(theta);

      // (z1 * e^{iθ}, z2 * e^{iθ})
      // z1 * e^{iθ} = (z1_re + i*z1_im) * (cos_t + i*sin_t)
      const x1 = z1_re * cos_t - z1_im * sin_t;
      const x2 = z1_re * sin_t + z1_im * cos_t;
      const x3 = z2_re * cos_t - z2_im * sin_t;
      const x4 = z2_re * sin_t + z2_im * cos_t;

      return { x1, x2, x3, x4 };
    };

    // Proiezione stereografica da S³ a R³
    // (x1, x2, x3, x4) → (x1/(1-x4), x2/(1-x4), x3/(1-x4))
    const stereographic = (x1, x2, x3, x4) => {
      const denom = 1 - x4;
      const maxVal = 20; // Limita i valori per evitare infiniti

      if (Math.abs(denom) < 0.01) {
        // Vicino al polo nord di S³, la proiezione va all'infinito
        const sign = denom >= 0 ? 1 : -1;
        return {
          x: x1 * maxVal * sign,
          y: x2 * maxVal * sign,
          z: x3 * maxVal * sign
        };
      }

      return {
        x: x1 / denom,
        y: x2 / denom,
        z: x3 / denom
      };
    };

    // Punto sulla Hopf band
    // v ∈ [0, 1]: posizione sull'arco (bordi v=0 e v=1 danno l'Hopf link)
    // theta ∈ [0, 2π): posizione sulla fibra
    const getHopfBandPoint = (v, theta) => {
      const { nx, ny, nz } = getArcPoint(v);
      const { x1, x2, x3, x4 } = getFiberPointS3(nx, ny, nz, theta);
      return stereographic(x1, x2, x3, x4);
    };

    // Genera mesh della superficie
    const stepsV = 40;  // Passi lungo l'arco
    const stepsTheta = 80;  // Passi attorno alla fibra

    const surfaceQuads = [];

    for (let i = 0; i < stepsV; i++) {
      const v1 = i / stepsV;
      const v2 = (i + 1) / stepsV;

      for (let j = 0; j < stepsTheta; j++) {
        const theta1 = (j / stepsTheta) * Math.PI * 2;
        const theta2 = ((j + 1) / stepsTheta) * Math.PI * 2;

        const p1 = getHopfBandPoint(v1, theta1);
        const p2 = getHopfBandPoint(v1, theta2);
        const p3 = getHopfBandPoint(v2, theta2);
        const p4 = getHopfBandPoint(v2, theta1);

        // Salta quadrilateri con punti troppo lontani (near infinity)
        const maxCoord = 15;
        if (Math.abs(p1.x) > maxCoord || Math.abs(p1.y) > maxCoord || Math.abs(p1.z) > maxCoord ||
            Math.abs(p2.x) > maxCoord || Math.abs(p2.y) > maxCoord || Math.abs(p2.z) > maxCoord ||
            Math.abs(p3.x) > maxCoord || Math.abs(p3.y) > maxCoord || Math.abs(p3.z) > maxCoord ||
            Math.abs(p4.x) > maxCoord || Math.abs(p4.y) > maxCoord || Math.abs(p4.z) > maxCoord) {
          continue;
        }

        const rp1 = rotatePoint(p1.x, p1.y, p1.z);
        const rp2 = rotatePoint(p2.x, p2.y, p2.z);
        const rp3 = rotatePoint(p3.x, p3.y, p3.z);
        const rp4 = rotatePoint(p4.x, p4.y, p4.z);

        const proj1 = project(rp1);
        const proj2 = project(rp2);
        const proj3 = project(rp3);
        const proj4 = project(rp4);

        const avgZ = (rp1.z + rp2.z + rp3.z + rp4.z) / 4;

        // Normale per determinare quale faccia è visibile
        const edge1 = { x: rp2.x - rp1.x, y: rp2.y - rp1.y, z: rp2.z - rp1.z };
        const edge2 = { x: rp4.x - rp1.x, y: rp4.y - rp1.y, z: rp4.z - rp1.z };
        const normal = {
          x: edge1.y * edge2.z - edge1.z * edge2.y,
          y: edge1.z * edge2.x - edge1.x * edge2.z,
          z: edge1.x * edge2.y - edge1.y * edge2.x
        };
        const len = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
        const nz_norm = len > 0 ? Math.abs(normal.z / len) : 0;

        // Determina quale faccia è rivolta verso la camera (z positivo = verso osservatore)
        const facingCamera = normal.z > 0;

        // Colori come gli anelli: verde (#00AA00) e rosso (#CC0000)
        // con shading basato sulla normale
        const brightness = 0.6 + nz_norm * 0.4;
        let color;
        if (facingCamera) {
          // Faccia verde (come anello v=0)
          const g = Math.floor(170 * brightness);
          color = `rgb(0, ${g}, 0)`;
        } else {
          // Faccia rossa (come anello v=1)
          const r = Math.floor(204 * brightness);
          color = `rgb(${r}, 0, 0)`;
        }

        surfaceQuads.push({
          points: [proj1, proj2, proj3, proj4],
          z: avgZ,
          color: color
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

    // Disegna i due cerchi di bordo (Hopf link)
    // Bordo 1: v = 0 (fibra sopra (1, 0, 0))
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#00AA00';
    ctx.beginPath();
    for (let j = 0; j <= stepsTheta; j++) {
      const theta = (j / stepsTheta) * Math.PI * 2;
      const p = getHopfBandPoint(0, theta);
      if (Math.abs(p.x) > 15 || Math.abs(p.y) > 15 || Math.abs(p.z) > 15) continue;
      const rp = rotatePoint(p.x, p.y, p.z);
      const proj = project(rp);
      if (j === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Bordo 2: v = 1 (fibra sopra (-1, 0, 0))
    ctx.strokeStyle = '#CC0000';
    ctx.beginPath();
    for (let j = 0; j <= stepsTheta; j++) {
      const theta = (j / stepsTheta) * Math.PI * 2;
      const p = getHopfBandPoint(1, theta);
      if (Math.abs(p.x) > 15 || Math.abs(p.y) > 15 || Math.abs(p.z) > 15) continue;
      const rp = rotatePoint(p.x, p.y, p.z);
      const proj = project(rp);
      if (j === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Info
    ctx.fillStyle = '#333';
    ctx.font = '14px monospace';
    ctx.fillText('Hopf Band (vera superficie di Seifert dalla Hopf fibration)', 10, 20);
    ctx.fillText('Fibre sopra un arco su S², proiezione stereografica S³→R³', 10, 38);
    ctx.fillText('Trascina per ruotare', 10, 56);

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
