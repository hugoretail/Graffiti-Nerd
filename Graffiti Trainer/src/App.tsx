import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'

function PixiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    //create PixiJS app
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x222222,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    })
    containerRef.current.appendChild(app.view)
    appRef.current = app

    //resize handler
    function handleResize() {
      app.renderer.resize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    //cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      app.destroy(true, { children: true })
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}

export default function App() {
  return <PixiCanvas />
}
