  
import { useRef, useState } from 'react';
import CanvasSpray from './CanvasSpray';
import { Menu } from './Menu';
import { caps } from './sprayCaps';

//root app wiring canvas + menu
export default function App() {
  const [capId, setCapId] = useState('skinny'); //default skinny
  const canvasRef = useRef<{ download: () => void } | null>(null);
  const activeCap = caps.find(c => c.id === capId) || caps[0];

  function handleDownload() {
    canvasRef.current?.download();
  }

  return (
    <>
      <CanvasSpray ref={canvasRef as any} cap={activeCap} />
      <Menu
        current={activeCap.id}
        onSelect={setCapId}
        onDownload={handleDownload}
      />
    </>
  );
}
