import { useEffect, useRef } from 'react'

interface GeometryConstellationProps {
  sceneTimeMs: number
  isActive: boolean
}

interface Point3D {
  x: number
  y: number
  z: number
}

export function GeometryConstellation({ sceneTimeMs, isActive }: GeometryConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneTimeRef = useRef(sceneTimeMs)
  sceneTimeRef.current = sceneTimeMs

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isActive) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let angleX = 0
    let angleY = 0

    // Resize handler
    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    // 3D rotation projection helper
    const project = (p: Point3D, w: number, h: number, scale: number): { x: number; y: number; z: number } => {
      // Rotate Y
      const cosY = Math.cos(angleY)
      const sinY = Math.sin(angleY)
      const x1 = p.x * cosY + p.z * sinY
      const z1 = -p.x * sinY + p.z * cosY

      // Rotate X
      const cosX = Math.cos(angleX)
      const sinX = Math.sin(angleX)
      const y2 = p.y * cosX - z1 * sinX
      const z2 = p.y * sinX + z1 * cosX

      const fov = 340
      const depth = fov / (fov + z2 * scale + 220)
      return {
        x: w * 0.5 + x1 * scale * depth,
        y: h * 0.5 + y2 * scale * depth,
        z: z2
      }
    }

    // Geometry generators
    const renderTriangle = (w: number, h: number, alpha: number) => {
      const r = Math.min(w, h) * 0.16
      const vertices: Point3D[] = [
        { x: 0, y: -r, z: 0 },
        { x: r * Math.cos(Math.PI / 6), y: r * Math.sin(Math.PI / 6), z: 0 },
        { x: -r * Math.cos(Math.PI / 6), y: r * Math.sin(Math.PI / 6), z: 0 }
      ]
      const pts = vertices.map(v => project(v, w, h, 1))

      ctx.save()
      ctx.strokeStyle = `rgba(185, 169, 232, ${alpha * 0.85})`
      ctx.lineWidth = 1.4
      ctx.shadowColor = 'rgba(216, 184, 121, 0.6)'
      ctx.shadowBlur = 10

      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[1].x, pts[1].y)
      ctx.lineTo(pts[2].x, pts[2].y)
      ctx.closePath()
      ctx.stroke()

      // Vertex stars
      pts.forEach(p => {
        ctx.fillStyle = `rgba(245, 240, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()
    }

    const renderTetrahedron = (w: number, h: number, alpha: number) => {
      const s = Math.min(w, h) * 0.18
      const vertices: Point3D[] = [
        { x: 0, y: -s * 0.9, z: 0 },
        { x: s * 0.85, y: s * 0.45, z: -s * 0.5 },
        { x: -s * 0.85, y: s * 0.45, z: -s * 0.5 },
        { x: 0, y: s * 0.45, z: s * 0.8 }
      ]
      const edges = [
        [0, 1], [0, 2], [0, 3],
        [1, 2], [2, 3], [3, 1]
      ]
      const pts = vertices.map(v => project(v, w, h, 1))

      ctx.save()
      ctx.strokeStyle = `rgba(216, 184, 121, ${alpha * 0.8})`
      ctx.lineWidth = 1.2
      ctx.shadowColor = 'rgba(185, 169, 232, 0.5)'
      ctx.shadowBlur = 12

      edges.forEach(([i, j]) => {
        ctx.beginPath()
        ctx.moveTo(pts[i].x, pts[i].y)
        ctx.lineTo(pts[j].x, pts[j].y)
        ctx.stroke()
      })

      // Vertices
      pts.forEach(p => {
        ctx.fillStyle = `rgba(245, 240, 255, ${alpha * 0.95})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.8, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()
    }

    const renderSphereWireframe = (w: number, h: number, alpha: number) => {
      const radius = Math.min(w, h) * 0.19
      const rings = 6
      const segments = 24

      ctx.save()
      ctx.strokeStyle = `rgba(185, 169, 232, ${alpha * 0.55})`
      ctx.lineWidth = 0.9
      ctx.shadowColor = 'rgba(216, 184, 121, 0.4)'
      ctx.shadowBlur = 8

      // Latitude rings
      for (let r = 1; r < rings; r++) {
        const phi = (r / rings) * Math.PI - Math.PI / 2
        const ringR = radius * Math.cos(phi)
        const ringY = radius * Math.sin(phi)

        ctx.beginPath()
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2
          const p: Point3D = {
            x: ringR * Math.cos(theta),
            y: ringY,
            z: ringR * Math.sin(theta)
          }
          const pt = project(p, w, h, 1)
          if (s === 0) ctx.moveTo(pt.x, pt.y)
          else ctx.lineTo(pt.x, pt.y)
        }
        ctx.stroke()
      }

      // Longitude rings (3 meridian planes)
      for (let m = 0; m < 3; m++) {
        const rotM = (m / 3) * Math.PI
        ctx.beginPath()
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2
          const p: Point3D = {
            x: radius * Math.sin(theta) * Math.cos(rotM),
            y: radius * Math.cos(theta),
            z: radius * Math.sin(theta) * Math.sin(rotM)
          }
          const pt = project(p, w, h, 1)
          if (s === 0) ctx.moveTo(pt.x, pt.y)
          else ctx.lineTo(pt.x, pt.y)
        }
        ctx.stroke()
      }
      ctx.restore()
    }

    const renderInfinity = (w: number, h: number, alpha: number) => {
      const a = Math.min(w, h) * 0.22
      const segments = 90

      ctx.save()
      ctx.strokeStyle = `rgba(216, 184, 121, ${alpha * 0.85})`
      ctx.lineWidth = 1.6
      ctx.shadowColor = 'rgba(216, 184, 121, 0.7)'
      ctx.shadowBlur = 14

      // Lemniscate of Bernoulli
      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2
        const denom = 1 + Math.sin(t) * Math.sin(t)
        const x = (a * Math.cos(t)) / denom
        const y = (a * Math.sin(t) * Math.cos(t)) / denom
        const z = Math.sin(t * 2) * 25 // 3D undulating wave

        const pt = project({ x, y, z }, w, h, 1)
        if (i === 0) ctx.moveTo(pt.x, pt.y)
        else ctx.lineTo(pt.x, pt.y)
      }
      ctx.stroke()

      // Traveling glowing nodes on the infinity ribbon
      const tNode = (Date.now() * 0.001) % (Math.PI * 2)
      const d1 = 1 + Math.sin(tNode) * Math.sin(tNode)
      const nodePt = project({
        x: (a * Math.cos(tNode)) / d1,
        y: (a * Math.sin(tNode) * Math.cos(tNode)) / d1,
        z: Math.sin(tNode * 2) * 25
      }, w, h, 1)

      ctx.fillStyle = `rgba(245, 240, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(nodePt.x, nodePt.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    // Main animation loop
    const renderLoop = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      angleX += 0.007
      angleY += 0.009

      // Scene 2 timeline: 10000ms to 25000ms (15 seconds total)
      // Segment 1: Triangle (10s – 13.5s)
      // Segment 2: Tetrahedron (13.5s – 17.5s)
      // Segment 3: Sphere (17.5s – 21.5s)
      // Segment 4: Infinity (21.5s – 25s)

      const t = sceneTimeRef.current

      // Shape 1: Triangle
      if (t >= 10000 && t < 14000) {
        const a = t < 11000 ? (t - 10000) / 1000 : t > 13200 ? (14000 - t) / 800 : 1
        renderTriangle(w, h, a)
      }

      // Shape 2: Tetrahedron
      if (t >= 13500 && t < 18000) {
        const a = t < 14500 ? (t - 13500) / 1000 : t > 17000 ? (18000 - t) / 1000 : 1
        renderTetrahedron(w, h, a)
      }

      // Shape 3: Sphere Wireframe
      if (t >= 17500 && t < 22000) {
        const a = t < 18500 ? (t - 17500) / 1000 : t > 21000 ? (22000 - t) / 1000 : 1
        renderSphereWireframe(w, h, a)
      }

      // Shape 4: Infinity Symbol
      if (t >= 21500 && t < 25500) {
        const a = t < 22500 ? (t - 21500) / 1000 : t > 24500 ? (25500 - t) / 1000 : 1
        renderInfinity(w, h, a)
      }

      animId = requestAnimationFrame(renderLoop)
    }

    animId = requestAnimationFrame(renderLoop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', updateSize)
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="geometry-canvas"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5
      }}
    />
  )
}
