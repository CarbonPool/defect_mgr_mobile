import { useEffect, useRef } from 'react'

/**
 * 登录页底部双波浪动效（Canvas）。静止偏好下只绘制一帧。
 */
export default function LoginWaveLayer() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const phaseRef = useRef({ p1: 0, p2: 0 })

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const speed1 = 0.012
    const speed2 = 0.018

    const dpr = () => Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect()
      if (width < 1 || height < 1) return
      const r = dpr()
      canvas.width = Math.floor(width * r)
      canvas.height = Math.floor(height * r)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(r, 0, 0, r, 0, 0)
    }

    const draw = (advance) => {
      const { width: w, height: h } = wrap.getBoundingClientRect()
      if (w < 1 || h < 1) return
      if (advance) {
        const ph = phaseRef.current
        ph.p1 += speed1
        ph.p2 += speed2
      }
      const { p1, p2 } = phaseRef.current
      ctx.clearRect(0, 0, w, h)

      const amp1 = h * 0.14
      const lambda1 = w / 1.15
      const yWave1 = (x) => {
        const t = (2 * Math.PI * x) / lambda1
        return h * 0.5 + amp1 * Math.sin(t + p1) + amp1 * 0.35 * Math.sin(t * 1.7 + p1 * 1.2)
      }

      const amp2 = h * 0.11
      const lambda2 = w / 0.85
      const yWave2 = (x) => {
        const t = (2 * Math.PI * x) / lambda2
        return h * 0.58 + amp2 * Math.sin(t * 1.05 - p2) + amp2 * 0.4 * Math.sin(t * 1.4 - p2 * 0.9)
      }

      ctx.beginPath()
      ctx.moveTo(0, h)
      for (let x = 0; x <= w; x += 2) {
        ctx.lineTo(x, yWave1(x))
      }
      ctx.lineTo(w, h)
      ctx.closePath()
      ctx.fillStyle = 'rgba(22, 119, 255, 0.1)'
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(0, h)
      for (let x = 0; x <= w; x += 2) {
        ctx.lineTo(x, yWave2(x))
      }
      ctx.lineTo(w, h)
      ctx.closePath()
      ctx.fillStyle = 'rgba(77, 159, 255, 0.16)'
      ctx.fill()
    }

    const ro = new ResizeObserver(() => {
      resize()
      draw(false)
    })
    ro.observe(wrap)
    resize()
    if (reduced) {
      draw(false)
    } else {
      const loop = () => {
        draw(true)
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div ref={wrapRef} className="login-waves" aria-hidden>
      <canvas ref={canvasRef} className="login-waves-canvas" />
    </div>
  )
}
