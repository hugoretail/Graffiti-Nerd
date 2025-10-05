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
  //adaptive velocity tracking (EMA) for dynamic normalization
  const emaVelocity = useRef(0);
  const peakVelocity = useRef(60); //rolling reference (will grow)

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

      //this is a normal comment: adaptive velocity handling
      //We keep an EMA so typical speed defines the normalization curve and large spikes still register.
      const EMA_DECAY = 0.18; //higher = follow current speed faster
      emaVelocity.current = emaVelocity.current === 0 ? velocity : (emaVelocity.current * (1 - EMA_DECAY) + velocity * EMA_DECAY);
      if (velocity > peakVelocity.current * 0.92) {
        //grow peak slowly; never shrink to preserve room for spikes
        peakVelocity.current = peakVelocity.current * 0.96 + velocity * 0.04;
      }

      //Soft log normalization (no hard cap) referencing dynamic peak
      const refV = Math.max(40, peakVelocity.current * 0.9); //reference for near-1 norm
      const LOG_K = 0.09; //sensitivity constant
      const vNormRaw = Math.log(1 + LOG_K * velocity) / Math.log(1 + LOG_K * refV);
      const vNorm = Math.min(1, vNormRaw); //we still clamp display range but spikes above ref compress, not flatline

  //this is a normal comment: Velocity-as-distance heuristic.
  //We can't know real nozzle distance in 2D, so we infer an inverse relationship:
  // higher velocity => user is making controlled, closer strokes (tight, sharp, concentrated)
  // lower velocity (or hovering) => nozzle is effectively farther (wider, softer cloud, lower density)
  //We map velocity into [0,1] then shape curves for radius, density and alpha.
  //Extended radius thinning: allow going below minRadius at extreme speed (dynamic overshoot)
  const EXTREME_RADIUS_FACTOR = cap.extremeRadiusFactor ?? 0.6; //per-cap override
  const baseRadius = cap.minRadius + (1 - vNorm) * (cap.maxRadius - cap.minRadius);
  const extremeRadius = cap.minRadius * EXTREME_RADIUS_FACTOR;
  //ease toward extreme using vNorm^1.4 to emphasize only very high speeds
  const radius = extremeRadius + (baseRadius - extremeRadius) * Math.pow(1 - vNorm, 1.4);

  //Alpha core: we want sharper (stronger central opacity) when velocity is high (close)
  //alpha baseline boost: more paint even when slow
  const baseMinAlpha = 0.38; //raised from 0.25
  const baseMaxAlpha = 0.95 * cap.alphaFactor; //slightly reduced peak for smoother dynamic range
  //ease curve so early velocity already gives decent increase (use sqrt easing)
  const eased = Math.sqrt(vNorm); //quick early gain (we keep this for alpha growth)
  let fade = baseMinAlpha + eased * (baseMaxAlpha - baseMinAlpha);
  //apply cap specific alpha boost (stronger solid fill for medium/fat)
  fade = Math.min(1, fade + cap.coreAlphaBoost);

      //distance traveled this frame for density scaling
      let distance = 0;
      if (lastPos.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        distance = Math.sqrt(dx * dx + dy * dy);
      }

  //Density: previously more distance => more dots. Now also scale by velocity for closer/denser spray.
  //Slow movement still needs baseline fill but not overly dense.
  const baseDotsPerPixel = cap.density / 9; //slightly higher new baseline
  //Velocity bonus grows super-linearly for high speeds using vNorm^1.3
  const velocityBonus = 1 + Math.pow(vNorm, 1.3) * 4.2; //up to ~5.2x
  const densityCoreBoost = 1 + cap.coreDensityBoost; //existing cap-based boost
  const dotsPerPixel = baseDotsPerPixel * velocityBonus * densityCoreBoost;
  //Baseline when almost stationary still decent
  const minDensity = cap.density * (1.7 + Math.pow(vNorm, 0.9) * 1.5);
  const totalDots = Math.max(minDensity, Math.round(distance * dotsPerPixel));

      for (let d = 0; d < totalDots; d++) {
        const t = totalDots === 1 ? 1 : d / totalDots;
        const baseX = lastPos.current ? lastPos.current.x + (x - lastPos.current.x) * t : x;
        const baseY = lastPos.current ? lastPos.current.y + (y - lastPos.current.y) * t : y;
        const angle = Math.random() * Math.PI * 2;
  //r distribution: when fast (close) we want tighter cluster; when slow (far) more spread.
  const spreadPow = cap.falloffPow + (1 - vNorm) * 0.55; //slightly tighter overall to compensate for higher density
  const r = radius * Math.pow(Math.random(), spreadPow);
        const dx = baseX + r * Math.cos(angle);
        const dy = baseY + r * Math.sin(angle);
  //Edge falloff: stronger central alpha when fast (close)
  const edgeFactor = 0.65 - eased * 0.22; //allow a crisper edge at the highest vNorm
  const localAlpha = fade * (1 - (r / radius) * edgeFactor);
        ctx.fillStyle = `rgba(255,255,255,${localAlpha.toFixed(2)})`; //color fixed white per user request
        ctx.beginPath();
        ctx.arc(dx, dy, 1.2 + r * 0.02, 0, Math.PI * 2);
        ctx.fill();

        //halo overspray (light faint outer dots)
        const haloProb = (0.04 + (1 - vNorm) * 0.04) * cap.haloAttenuation;
        if (cap.halo > 0 && Math.random() < haloProb) { //attenuated halo probability
          const hr = radius * (0.9 + Math.random() * 0.5) * cap.halo * (1 + (1 - vNorm) * 0.35);
          const hx = baseX + hr * Math.cos(Math.random() * Math.PI * 2);
          const hy = baseY + hr * Math.sin(Math.random() * Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${(localAlpha * 0.15).toFixed(2)})`;
          ctx.fillRect(hx, hy, 1, 1);
        }
      }

      //Inner core reinforcement pass (all caps > 0 boost) with velocity filament emphasis
      if (cap.coreDensityBoost > 0.15) {
        const filamentFactor = Math.pow(vNorm, 2); //very fast strokes amplify filament
        const coreDots = Math.round(totalDots * (0.10 + filamentFactor * 0.10));
        for (let i = 0; i < coreDots; i++) {
          //filament dots cluster even tighter when fast
          const filamentR = radius * (0.22 - filamentFactor * 0.12) * Math.random();
          const theta = Math.random() * Math.PI * 2;
          const cx = x + filamentR * Math.cos(theta);
          const cy = y + filamentR * Math.sin(theta);
          const coreAlpha = Math.min(1, fade * (1 + filamentFactor * 0.15));
          ctx.fillStyle = `rgba(255,255,255,${coreAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 1.25 + filamentFactor * 0.4, 0, Math.PI * 2);
          ctx.fill();
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
