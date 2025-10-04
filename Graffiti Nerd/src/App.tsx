
import './App.css'
import { useRef, useEffect } from 'react'


function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spraying = useRef(false)
  const mousePos = useRef<{ x: number; y: number } | null>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
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
      lastPos.current = getPos(e)
      sprayLoop() //start spray loop
    }
    //stop spraying on mouse up
    function onUp() {
      spraying.current = false //spraying stops
      mousePos.current = null
      lastPos.current = null
      if (sprayFrame.current) {
        cancelAnimationFrame(sprayFrame.current)
        sprayFrame.current = null
      }
    }
    //update mouse position while spraying
    function onMove(e: MouseEvent) {
      if (!spraying.current) return
      lastPos.current = mousePos.current
      mousePos.current = getPos(e)
    }

    //spray effect loop
    function sprayLoop() {
      if (!spraying.current || !mousePos.current || !ctx) return
      const { x, y } = mousePos.current
      //calculate velocity
      let velocity = 0
      if (lastPos.current) {
        const dx = x - lastPos.current.x
        const dy = y - lastPos.current.y
        velocity = Math.sqrt(dx * dx + dy * dy)
      }
      //spray gets lighter when moving fast
  const baseDensity = 120 //base dots per frame
  const minAlpha = 0.25 //minimum opacity (darker)
  const maxAlpha = 0.7 //maximum opacity
  const radius = 20 //spray radius
  //fade based on velocity (moving fast = lighter, but less extreme)
  const fade = Math.max(minAlpha, maxAlpha - velocity * 0.02) //less fade per speed
  //density also fades a bit with velocity, but stays higher
  const density = Math.max(70, baseDensity - velocity * 1.2) //higher minimum density
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * 2 * Math.PI
        const r = radius * Math.sqrt(Math.random())
        const dx = x + r * Math.cos(angle)
        const dy = y + r * Math.sin(angle)
        ctx.fillStyle = `rgba(34,34,34,${fade.toFixed(2)})` //spray color
        ctx.beginPath()
        ctx.arc(dx, dy, 1.5, 0, 2 * Math.PI)
        ctx.fill()
      }
      lastPos.current = { x, y }
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

  //export canvas as PNG
  function handleExport() {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = 'graffiti.png'
    link.click()
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'block', background: '#fff' }} />
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button
          onClick={handleExport}
          style={{
            padding: '8px 16px',
            background: '#222',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          //Export as PNG
        </button>
      </div>
    </>
  )
}

function App() {
  return <Canvas />
}

export default App
