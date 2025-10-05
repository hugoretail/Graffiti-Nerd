  
import { useEffect, useRef, useState } from 'react';
import CanvasSpray from './CanvasSpray';
import { Menu } from './Menu';
import { caps } from './sprayCaps';

//root app wiring canvas + menu
export default function App() {
  const [capId, setCapId] = useState('skinny'); //default skinny
  const canvasRef = useRef<{
    download: () => void;
    clear: () => void;
  } | null>(null);
  const activeCap = caps.find(c => c.id === capId) || caps[0];

  function handleDownload() {
    canvasRef.current?.download();
  }

  function handleClear() {
    canvasRef.current?.clear();
  }

  //global keyboard shortcut: press 'c' to clear (when not typing in an input-ish element)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'c') {
        const target = e.target as HTMLElement | null;
        if (target) {
          const tag = target.tagName.toLowerCase();
          if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return;
        }
        handleClear();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <CanvasSpray ref={canvasRef as any} cap={activeCap} />
      <Menu
        current={activeCap.id}
        onSelect={setCapId}
        onDownload={handleDownload}
        onClear={handleClear}
      />
    </>
  );
}
