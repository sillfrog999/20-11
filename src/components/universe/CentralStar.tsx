import { useEffect } from 'react'
import { universeAudio } from './universeAudio'

interface CentralStarProps {
  sceneTimeMs: number
  isActive: boolean
}

export function CentralStar({ sceneTimeMs, isActive }: CentralStarProps) {
  const t = sceneTimeMs - 40000
  const progress = Math.max(0, Math.min(1, t / 10000))

  useEffect(() => {
    if (isActive && t >= 500 && t < 1500) {
      universeAudio.playGoldenStarBloom()
    }
  }, [isActive, t])

  if (!isActive) return null

  const starScale = Math.min(1.8, 0.4 + progress * 1.4)
  const coronaAlpha = Math.min(0.95, progress * 1.3)
  const flareSpread = Math.min(1, progress * 1.2)

  return (
    <div className="central-star-wrapper" aria-hidden="true">
      <div
        className="central-star-ambient-glow"
        style={{
          opacity: coronaAlpha * 0.85,
          transform: `scale(${1 + flareSpread * 1.8})`
        }}
      />

      <div
        className="central-star-spikes"
        style={{
          opacity: coronaAlpha,
          transform: `scale(${starScale})`
        }}
      >
        <div className="spike spike-h" />
        <div className="spike spike-v" />
        <div className="spike spike-d1" />
        <div className="spike spike-d2" />
      </div>

      <div
        className="central-star-ring"
        style={{
          opacity: coronaAlpha * 0.7,
          scale: String(starScale * 1.35)
        }}
      />

      <div
        className="central-star-core"
        style={{
          scale: String(starScale)
        }}
      >
        <div className="core-inner" />
      </div>
    </div>
  )
}
