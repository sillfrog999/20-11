import React, { useState, useEffect } from 'react'
import { StarPhoto, UniverseManifest } from './types'

interface MemoryPhotosProps {
  sceneTimeMs: number
  isActive: boolean
}

// Fallback items if manifest.json is unreachable
const DEFAULT_FALLBACK_PHOTOS: StarPhoto[] = [
  {
    id: 'photo-1',
    src: '/universe/photos/photo-01.jpg',
    caption: 'Kỷ niệm 9H2 #1',
    subtext: 'Khoảnh khắc thanh xuân',
    placeholderText: 'Ảnh lớp 9H2 (01)\nThêm vào /universe/photos/photo-01.jpg',
    orbitSpeed: 0.08,
    baseAngle: 15
  },
  {
    id: 'photo-2',
    src: '/universe/photos/photo-02.jpg',
    caption: 'Kỷ niệm 9H2 #2',
    subtext: 'Nụ cười học trò',
    placeholderText: 'Ảnh lớp 9H2 (02)\nThêm vào /universe/photos/photo-02.jpg',
    orbitSpeed: 0.07,
    baseAngle: 85
  },
  {
    id: 'photo-3',
    src: '/universe/photos/photo-03.jpg',
    caption: 'Kỷ niệm 9H2 #3',
    subtext: 'Giờ học Toán',
    placeholderText: 'Ảnh lớp 9H2 (03)\nThêm vào /universe/photos/photo-03.jpg',
    orbitSpeed: 0.09,
    baseAngle: 155
  },
  {
    id: 'photo-4',
    src: '/universe/photos/photo-04.jpg',
    caption: 'Kỷ niệm 9H2 #4',
    subtext: 'Những ngày rực rỡ',
    placeholderText: 'Ảnh lớp 9H2 (04)\nThêm vào /universe/photos/photo-04.jpg',
    orbitSpeed: 0.065,
    baseAngle: 220
  },
  {
    id: 'photo-5',
    src: '/universe/photos/photo-05.jpg',
    caption: 'Kỷ niệm 9H2 #5',
    subtext: 'Bên thầy cô',
    placeholderText: 'Ảnh lớp 9H2 (05)\nThêm vào /universe/photos/photo-05.jpg',
    orbitSpeed: 0.08,
    baseAngle: 295
  },
  {
    id: 'photo-6',
    src: '/universe/photos/photo-06.jpg',
    caption: 'Kỷ niệm 9H2 #6',
    subtext: 'Hành trình 9H2',
    placeholderText: 'Ảnh lớp 9H2 (06)\nThêm vào /universe/photos/photo-06.jpg',
    orbitSpeed: 0.075,
    baseAngle: 340
  }
]

export function MemoryPhotos({ sceneTimeMs, isActive }: MemoryPhotosProps) {
  const [photos, setPhotos] = useState<StarPhoto[]>(DEFAULT_FALLBACK_PHOTOS)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  // Load manifest.json
  useEffect(() => {
    fetch('/universe/photos/manifest.json')
      .then(res => {
        if (!res.ok) throw new Error('Manifest not found')
        return res.json()
      })
      .then((data: UniverseManifest) => {
        if (data && data.photos && data.photos.length > 0) {
          setPhotos(data.photos)
        }
      })
      .catch(() => {
        // Use default fallback cleanly
      })
  }, [])

  const handleImageError = (id: string) => {
    setFailedImages(prev => ({ ...prev, [id]: true }))
  }

  if (!isActive) return null

  // Calculate Scene 3 relative time (25000ms to 40000ms)
  const sceneProgress = Math.max(0, Math.min(1, (sceneTimeMs - 25000) / 15000))
  // Fade in at start of scene 3 (25s - 27s), gentle fade down at end (38s - 41s)
  let sceneAlpha = 1
  if (sceneTimeMs < 28000) {
    sceneAlpha = Math.max(0, (sceneTimeMs - 25000) / 3000)
  } else if (sceneTimeMs > 38000) {
    sceneAlpha = Math.max(0.2, (41000 - sceneTimeMs) / 3000)
  }

  // Pick 6-8 photos to display in cosmic constellation orbits
  const displayPhotos = photos.slice(0, 8)

  return (
    <div
      className="memory-photos-container"
      style={{
        opacity: sceneAlpha,
        transition: 'opacity 0.8s ease'
      }}
    >
      {/* Constellation connector lines between photos */}
      <svg className="photo-constellation-lines" aria-hidden="true">
        <defs>
          <linearGradient id="photoLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B9A9E8" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#D8B879" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#B9A9E8" stopOpacity="0.45" />
          </linearGradient>
        </defs>
      </svg>

      {displayPhotos.map((photo, index) => {
        const total = displayPhotos.length
        // Elliptical orbit calculation with gentle rotation
        const baseAngle = (photo.baseAngle ?? (index * (360 / total))) * (Math.PI / 180)
        const timeFactor = (sceneTimeMs - 25000) * 0.00035 * (photo.orbitSpeed || 0.07)
        const angle = baseAngle + timeFactor

        // Radius for responsive elliptical drift - centered comfortably below top subtitle
        const rx = 32 + (index % 3) * 5 // percent of viewport
        const ry = 18 + (index % 2) * 6 // percent of viewport

        const x = 50 + Math.cos(angle) * rx
        const y = 58 + Math.sin(angle) * ry
        const rot = -6 + ((index * 29) % 13) // subtle natural tilt: -6deg to +7deg

        // Depth & Scale
        const zDepth = 0.85 + 0.25 * Math.sin(angle)
        const hasFailed = failedImages[photo.id]

        return (
          <div
            key={photo.id}
            className="polaroid-star-card"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${zDepth})`,
              zIndex: Math.round(zDepth * 10)
            }}
          >
            <div className="polaroid-inner">
              <div className="polaroid-media-box">
                {!hasFailed ? (
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    className="polaroid-img"
                    loading="lazy"
                    onError={() => handleImageError(photo.id)}
                  />
                ) : (
                  <div className="polaroid-placeholder">
                    <div className="placeholder-icon">✦</div>
                    <p className="placeholder-title">{photo.caption}</p>
                    <p className="placeholder-hint">
                      {photo.placeholderText || 'Ảnh lớp 9H2\nĐặt ảnh vào thư mục public/universe/photos/'}
                    </p>
                  </div>
                )}
              </div>
              <div className="polaroid-caption">
                <span className="caption-text">{photo.caption}</span>
                {photo.subtext && <span className="caption-sub">{photo.subtext}</span>}
              </div>
            </div>

            {/* Glowing cosmic anchor star pinning the polaroid */}
            <div className="card-anchor-star" />
          </div>
        )
      })}
    </div>
  )
}
