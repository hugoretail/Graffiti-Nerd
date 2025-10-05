  
import { useCallback, useEffect, useRef } from 'react';
function CanvasSpray() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spraying = useRef(false)
  const mousePos = useRef<{ x: number; y: number } | null>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const sprayFrame = useRef<number | null>(null)

  const downloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Ensure any pending frame draws are flushed
    requestAnimationFrame(() => {
      try {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
        link.download = `graffiti-${timestamp}.png`;
        link.href = url;
        link.click();
      } catch (e) {
        console.error('Failed to export canvas', e);
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    //set canvas size and DPR scaling
    function resize() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    function getPos(e: MouseEvent) {
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    function onDown(e: MouseEvent) {
      spraying.current = true;
      mousePos.current = getPos(e);
      lastPos.current = getPos(e);
      sprayLoop();
    }
    function onUp() {
      spraying.current = false;
      mousePos.current = null;
      lastPos.current = null;
      if (sprayFrame.current) {
        cancelAnimationFrame(sprayFrame.current);
        sprayFrame.current = null;
      }
    }
    function onMove(e: MouseEvent) {
      if (!spraying.current) return;
      lastPos.current = mousePos.current;
      mousePos.current = getPos(e);
    }

    function sprayLoop() {
      if (!spraying.current || !mousePos.current || !ctx) return;
      const { x, y } = mousePos.current;
      let velocity = 0;
      if (lastPos.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        velocity = Math.sqrt(dx * dx + dy * dy);
      }
      //can control: mouse speed maps to spray sharpness, size, and paint amount
      const minAlpha = 0.38;
      const maxAlpha = 0.92;
      //speed mapping: high speed = close/sharp, low speed = far/soft
      //clamp velocity for reasonable effect
      const v = Math.min(Math.max(velocity, 0), 40);
      //radius shrinks with speed, sharpness increases
      const minRadius = 8;
      const maxRadius = 22;
      const radius = maxRadius - (v / 40) * (maxRadius - minRadius);
      //fade sharper with speed
      const fade = Math.max(minAlpha, maxAlpha - v * 0.018);
  const minDensity = 120;
      //emit dots based on distance moved, not FPS
      let distance = 0;
      if (lastPos.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        distance = Math.sqrt(dx * dx + dy * dy);
      }
      //dots per pixel moved (tune this value for realism)
      const dotsPerPixel = 40; // try 40 dots per pixel
      const totalDots = Math.max(minDensity, Math.round(distance * dotsPerPixel));
      //spray along the path between last and current position
      for (let d = 0; d < totalDots; d++) {
        const t = totalDots === 1 ? 1 : d / totalDots;
        const sprayX = lastPos.current ? lastPos.current.x + (x - lastPos.current.x) * t : x;
        const sprayY = lastPos.current ? lastPos.current.y + (y - lastPos.current.y) * t : y;
        const angle = Math.random() * 2 * Math.PI;
        const r = radius * Math.pow(Math.random(), 1.7);
        const dx = sprayX + r * Math.cos(angle);
        const dy = sprayY + r * Math.sin(angle);
        const localAlpha = fade * (1 - r / radius * 0.7);
        ctx.fillStyle = `rgba(255,255,255,${localAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.3, 0, 2 * Math.PI);
        ctx.fill();
      }
      lastPos.current = { x, y };
      sprayFrame.current = requestAnimationFrame(sprayLoop);
    }

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('mousemove', onMove);
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mousemove', onMove);
      if (sprayFrame.current) cancelAnimationFrame(sprayFrame.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  //canvas fills the whole screen
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: '100vw',
          height: '100vh',
          background: '#222',
          display: 'block',
        }}
      />
      <button
        onClick={downloadImage}
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          background: '#ffffff10',
          color: '#fff',
          backdropFilter: 'blur(4px)',
          border: '1px solid #555',
          padding: '8px 14px',
          fontSize: '14px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        Download PNG
      </button>
    </>
  );

}

export default function App() {
  return <CanvasSpray />;
}
