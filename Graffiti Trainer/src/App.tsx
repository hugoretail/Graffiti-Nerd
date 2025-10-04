import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import './App.css'

function PixiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    let destroyed = false
    if (!containerRef.current) return
    //create PixiJS app with v8 API
    const app = new PIXI.Application()
    appRef.current = app

    //async init and append canvas
    app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      background: '#222222',
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    }).then(() => {
      if (destroyed) return
      containerRef.current?.appendChild(app.canvas)

      //mouse event tracking
      let mouseDown = false
      let mousePos = { x: 0, y: 0 }
      app.canvas.addEventListener('pointerdown', (e) => {
        mouseDown = true
        const evt = e as PointerEvent
        mousePos = { x: evt.offsetX, y: evt.offsetY }
        //console.log('pointerdown', mousePos)
      })
      app.canvas.addEventListener('pointerup', () => {
        mouseDown = false
      })
      app.canvas.addEventListener('pointermove', (e) => {
        if (mouseDown) {
          const evt = e as PointerEvent
          mousePos = { x: evt.offsetX, y: evt.offsetY }
          //console.log('pointermove', mousePos)
        }
      })

      //resize handler
      function handleResize() {
        if (app.renderer) app.resize()
      }
      window.addEventListener('resize', handleResize)

      //handle WebGL context loss
      app.canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault()
        //console.log('WebGL context lost, attempting to recover...')
        // Optionally, re-initialize PixiJS here
      })

      //cleanup
      appRef.current = app
    })

    return () => {
      destroyed = true
      window.removeEventListener('resize', () => { if (app.renderer) app.resize() })
      if (app.renderer) app.destroy(true, { children: true })
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
}

export default function App() {
  return <PixiCanvas />
}
