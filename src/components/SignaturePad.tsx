import { useEffect, useRef, useState } from 'react'

type Props = {
  onChange: (dataUrl: string | null) => void
}

export function SignaturePad({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      // preserve drawing on resize by re-painting the old bitmap
      const prev = document.createElement('canvas')
      prev.width = canvas.width
      prev.height = canvas.height
      prev.getContext('2d')!.drawImage(canvas, 0, 0)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#1c2b28'
      if (prev.width > 0) ctx.drawImage(prev, 0, 0, rect.width, rect.height)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const point = (e: PointerEvent | React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent) => {
    e.preventDefault()
    canvasRef.current!.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = point(e)
  }

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return
    const p = point(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (!hasInk) setHasInk(true)
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    onChange(canvasRef.current!.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    setHasInk(false)
    onChange(null)
  }

  return (
    <div className="sig">
      <canvas
        ref={canvasRef}
        className="sig__canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      {!hasInk && <span className="sig__placeholder">חתמו כאן באצבע או בעכבר</span>}
      <button type="button" className="btn btn--ghost sig__clear" onClick={clear} disabled={!hasInk}>
        נקה חתימה
      </button>
    </div>
  )
}
