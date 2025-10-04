
import './App.css'
import { useRef, useEffect } from 'react'

function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    //set canvas size and DPR scaling
    function resize() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  //mouse events for drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function getPos(e: MouseEvent) {
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    function onDown(e: MouseEvent) {
      drawing.current = true
      last.current = getPos(e)
    }
    function onUp() {
      drawing.current = false
      last.current = null
    }
    function onMove(e: MouseEvent) {
      if (!drawing.current) return
      const pos = getPos(e)
      if (last.current && ctx) {
        ctx.beginPath()
        ctx.moveTo(last.current.x, last.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.stroke()
      }
      last.current = pos
    }
    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('mousemove', onMove)
    return () => {
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block', background: '#fff' }} />
}

function App() {
  return <Canvas />
}

export default App
