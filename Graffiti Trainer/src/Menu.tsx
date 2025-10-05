//slide-in burger menu component
import { useState } from 'react';
import { caps } from './sprayCaps';

interface MenuProps {
  current: string;
  onSelect: (id: string) => void;
  onDownload: () => void;
}

export function Menu({ current, onSelect, onDownload }: MenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/*handle*/}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: open ? 220 : 0,
          transform: 'translateY(-50%)',
          width: '26px',
          height: '60px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          userSelect: 'none',
          transition: 'left 260ms ease'
        }}
        onClick={() => setOpen(o => !o)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        ☰
      </div>
      {/*panel*/}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: open ? 0 : -240,
            transition: 'left 260ms ease',
          width: '240px',
          height: '100vh',
          background: 'rgba(20,20,20,0.82)',
          backdropFilter: 'blur(8px)',
          borderRight: '1px solid rgba(255,255,255,0.12)',
          color: '#eee',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          padding: '64px 16px 24px 16px',
          boxSizing: 'border-box'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 style={{margin: '0 0 12px', fontSize: '15px', letterSpacing: '0.5px'}}>Spray Caps</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {caps.map(cap => (
            <button
              key={cap.id}
              onClick={() => onSelect(cap.id)}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                background: cap.id === current ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                borderRadius: '6px',
                transition: 'background 160ms',
              }}
            >{cap.label}</button>
          ))}
        </div>
        <hr style={{margin: '18px 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.12)'}} />
        <button
          onClick={onDownload}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'linear-gradient(90deg,#444,#666)',
            border: '1px solid #777',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            borderRadius: '6px',
            letterSpacing: '0.5px'
          }}
        >Download PNG</button>
        <div style={{marginTop: '24px', fontSize: '11px', lineHeight: 1.4, opacity: 0.7}}>
          {/*this is a normal comment*/}
          Hold mouse and move for different line widths. Slower movement = softer/wider fill.
        </div>
      </div>
    </>
  );
}
