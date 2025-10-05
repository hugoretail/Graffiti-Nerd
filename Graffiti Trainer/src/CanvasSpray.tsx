//canvas component using spray hook
import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { SprayCap } from './sprayCaps';
import { useSpray } from './useSpray';

export interface CanvasSprayHandle {
  download: () => void; //download PNG helper
  clear: () => void; //clear canvas helper
  getCanvas: () => HTMLCanvasElement | null;
}

interface CanvasSprayProps {
  cap: SprayCap;
}

const CanvasSpray = forwardRef<CanvasSprayHandle, CanvasSprayProps>(function CanvasSprayInner({ cap }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  //hook usage
  //use spray effect with selected cap
  useSpray(canvasRef as any, { cap }); //type cast due to generic RefObject narrowing

  useImperativeHandle(ref, () => ({
    download: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      requestAnimationFrame(() => {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const ts = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
        link.download = `graffiti-${ts}.png`;
        link.href = url;
        link.click();
      });
    },
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      //this is a normal comment: subtle flash feedback
      const flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.15);pointer-events:none;opacity:1;transition:opacity 260ms ease';
      document.body.appendChild(flash);
      requestAnimationFrame(()=> flash.style.opacity = '0');
      setTimeout(()=> flash.remove(), 300);
    },
    getCanvas: () => canvasRef.current,
  }), []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#222',
        display: 'block',
        cursor: 'crosshair',
      }}
    />
  );
});

export default CanvasSpray;
