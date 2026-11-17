import { useEffect } from 'react'
import { universeAudio } from './universeAudio'

interface CentralStarProps {
  sceneTimeMs: number
  isActive: boolean
}

export function CentralStar({ sceneTimeMs, isActive }: CentralStarProps) {
  // Scene 4 spans 40000ms to 50000ms
  const t = sceneTimeMs - 40000
  const progress = Math.max(0, Math.min(1, t / 10000))

  useEffect(() => {
    if (isActive && t >= 500 && t < 1500) {
      universeAudio.playGoldenStarBloom()
    }
  }, [isActive, t])

  if (!isActive) return null

  // Growth & flare scale
  const starScale = Math.min(1.8, 0.4 + progress * 1.4)
  const coronaAlpha = Math.min(0.95, progress * 1.3)
  const flareSpread = Math.min(1, progress * 1.2)

  return (
    <div className="central-star-wrapper" aria-hidden="true">
      {/* Radiant ambient warmth expanding across space */}
      <div
        className="central-star-ambient-glow"
        style={{
          opacity: coronaAlpha * 0.85,
          transform: `scale(${1 + flareSpread * 1.8})`
        }}
      />

      {/* Diffraction Spikes & Lens Flare */}
      <div
        className="central-star-spikes"
        style={{
          opacity: coronaAlpha,
          transform: `scale(${starScale}) rotate(${t * 0.015}deg)`
        }}
      >
        <div className="spike spike-h" />
        <div className="spike spike-v" />
        <div className="spike spike-d1" />
        <div className="spike spike-d2" />
      </div>

      {/* Golden Accretion Ring */}
      <div
        className="central-star-ring"
        style={{
          opacity: coronaAlpha * 0.7,
          transform: `scale(${starScale * 1.35}) rotate(${t * -0.02}deg)`
        }}
      />

      {/* Core Brilliant Star */}
      <div
        className="central-star-core"
        style={{
          transform: `scale(${starScale})`
        }}
      >
        <div className="core-inner" />
      </div>
    </div>
  )
}
