
import { useEffect, useRef } from 'react'
function CanvasSpray() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spraying = useRef(false)
  const mousePos = useRef<{ x: number; y: number } | null>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const sprayFrame = useRef<number | null>(null)

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
      //calculate velocity
      let velocity = 0;
      if (lastPos.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        velocity = Math.sqrt(dx * dx + dy * dy);
      }
      //spray gets lighter when moving fast
  const baseDensity = 420;
      const minAlpha = 0.38;
      const maxAlpha = 0.92;
      const radius = 16;
      //fade: sharper center, softer edge
      const fade = Math.max(minAlpha, maxAlpha - velocity * 0.012);
      const density = Math.max(120, baseDensity - velocity * 0.7);
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const r = radius * Math.pow(Math.random(), 1.7);
        const dx = x + r * Math.cos(angle);
        const dy = y + r * Math.sin(angle);
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
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#222',
        display: 'block',
      }}
    />
  );

}

export default function App() {
  return <CanvasSpray />;
}
