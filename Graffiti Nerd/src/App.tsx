
import './App.css'
import { useRef, useEffect } from 'react'


function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spraying = useRef(false)
  const mousePos = useRef<{ x: number; y: number } | null>(null)
  const sprayFrame = useRef<number | null>(null)

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    //get mouse position relative to canvas
    function getPos(e: MouseEvent) {
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    //start spraying on mouse down
    function onDown(e: MouseEvent) {
      spraying.current = true //spraying starts
      mousePos.current = getPos(e)
      sprayLoop() //start spray loop
    }
    //stop spraying on mouse up
    function onUp() {
      spraying.current = false //spraying stops
      mousePos.current = null
      if (sprayFrame.current) {
        cancelAnimationFrame(sprayFrame.current)
        sprayFrame.current = null
      }
    }
    //update mouse position while spraying
    function onMove(e: MouseEvent) {
      if (!spraying.current) return
      mousePos.current = getPos(e)
    }

    //spray effect loop
    function sprayLoop() {
      if (!spraying.current || !mousePos.current || !ctx) return
      const { x, y } = mousePos.current
      const radius = 20 //spray radius
      const density = 40 //dots per frame
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * 2 * Math.PI
        const r = radius * Math.sqrt(Math.random())
        const dx = x + r * Math.cos(angle)
        const dy = y + r * Math.sin(angle)
        ctx.fillStyle = 'rgba(34,34,34,0.2)' //spray color
        ctx.beginPath()
        ctx.arc(dx, dy, 1.2, 0, 2 * Math.PI)
        ctx.fill()
      }
      sprayFrame.current = requestAnimationFrame(sprayLoop)
    }

    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('mousemove', onMove)
    return () => {
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mousemove', onMove)
      if (sprayFrame.current) cancelAnimationFrame(sprayFrame.current)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block', background: '#fff' }} />
}

function App() {
  return <Canvas />
}

export default App
