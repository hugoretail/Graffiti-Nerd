//spray hook encapsulating canvas spray logic
import { useEffect, useRef } from 'react';
import type { SprayCap } from './sprayCaps';

export interface UseSprayOptions {
  cap: SprayCap; //current spray cap
  color?: string; //color hex or rgba
  onReady?: (canvas: HTMLCanvasElement) => void; //callback when canvas ready
}

export function useSpray(canvasRef: React.RefObject<HTMLCanvasElement>, options: UseSprayOptions) {
  const { cap, color = '#ffffff', onReady } = options;
  const spraying = useRef(false);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const sprayFrame = useRef<number | null>(null);
  const holdStart = useRef<number | null>(null); //timestamp for drips logic

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    //resize logic with DPR scaling
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
    onReady && onReady(canvas);

    function getPos(e: MouseEvent) {
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onDown(e: MouseEvent) {
      spraying.current = true;
      mousePos.current = getPos(e);
      lastPos.current = getPos(e);
      holdStart.current = performance.now();
      sprayLoop();
    }
    function onUp() {
      spraying.current = false;
      mousePos.current = null;
      lastPos.current = null;
      holdStart.current = null;
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

    //emit drips for fat/medium caps when stationary
    function maybeDrips(x: number, y: number, velocity: number) {
      if (!ctx) return;
      if (velocity > 2) return; //only when nearly stationary
      if (cap.dripChance <= 0) return;
      const chance = cap.dripChance * (1 - velocity / 2);
      let drips = 0;
      while (drips < cap.maxDrips && Math.random() < chance) {
        const len = (cap.maxRadius || cap.maxRadius) * (0.6 + Math.random() * 0.9);
        const thickness = 1 + Math.random() * 2.2;
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(x + (Math.random() - 0.5) * cap.minRadius * 0.6, y);
        ctx.lineTo(x + (Math.random() - 0.5) * cap.minRadius * 0.4, y + len);
        ctx.stroke();
        drips++;
      }
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

      //dynamic radius interpolation vs velocity (higher velocity -> smaller radius for control lines)
      const vClamp = Math.min(Math.max(velocity, 0), 40);
      const radius = cap.maxRadius - (vClamp / 40) * (cap.maxRadius - cap.minRadius);

      //fade based on velocity (faster = sharper/lighter)
      const baseMinAlpha = 0.35;
      const baseMaxAlpha = 0.95 * cap.alphaFactor;
      const fade = Math.max(baseMinAlpha, baseMaxAlpha - vClamp * 0.02);

      //distance traveled this frame for density scaling
      let distance = 0;
      if (lastPos.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        distance = Math.sqrt(dx * dx + dy * dy);
      }

      //base dots per pixel moved
      const dotsPerPixel = cap.density / 10; //scaling constant
      const minDensity = cap.density * 3; //baseline when almost stationary
      const totalDots = Math.max(minDensity, Math.round(distance * dotsPerPixel));

      for (let d = 0; d < totalDots; d++) {
        const t = totalDots === 1 ? 1 : d / totalDots;
        const baseX = lastPos.current ? lastPos.current.x + (x - lastPos.current.x) * t : x;
        const baseY = lastPos.current ? lastPos.current.y + (y - lastPos.current.y) * t : y;
        const angle = Math.random() * Math.PI * 2;
        const r = radius * Math.pow(Math.random(), cap.falloffPow);
        const dx = baseX + r * Math.cos(angle);
        const dy = baseY + r * Math.sin(angle);
        const localAlpha = fade * (1 - r / radius * 0.7);
        ctx.fillStyle = `rgba(255,255,255,${localAlpha.toFixed(2)})`; //color fixed white per user request
        ctx.beginPath();
        ctx.arc(dx, dy, 1.2 + r * 0.02, 0, Math.PI * 2);
        ctx.fill();

        //halo overspray (light faint outer dots)
        if (cap.halo > 0 && Math.random() < 0.05) {
          const hr = radius * (0.9 + Math.random() * 0.5) * cap.halo;
          const hx = baseX + hr * Math.cos(Math.random() * Math.PI * 2);
          const hy = baseY + hr * Math.sin(Math.random() * Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${(localAlpha * 0.15).toFixed(2)})`;
          ctx.fillRect(hx, hy, 1, 1);
        }
      }

      maybeDrips(x, y, velocity);

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
  }, [cap, color, onReady]);
}
