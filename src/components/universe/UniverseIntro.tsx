import React, { useEffect, useRef, useState, useCallback } from 'react'
import { UniverseScene } from './types'
import { StarEngine } from './StarEngine'
import { GeometryConstellation } from './GeometryConstellation'
import { MemoryPhotos } from './MemoryPhotos'
import { CentralStar } from './CentralStar'
import { LetterReveal } from './LetterReveal'
import { universeAudio } from './universeAudio'
import './universe.css'

interface UniverseIntroProps {
  onComplete: () => void
}

const TOTAL_TIMELINE_MS = 60000
const UI_UPDATE_INTERVAL = 33

export function UniverseIntro({ onComplete }: UniverseIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<StarEngine | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const lastUiUpdateRef = useRef(0)

  const [currentScene, setCurrentScene] = useState<UniverseScene>('THE_VOID')
  const [sceneElapsedMs, setSceneElapsedMs] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isWarpingOut, setIsWarpingOut] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)

  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  // Transition to main site
  const handleEnterMainSite = useCallback(() => {
    setIsWarpingOut(true)
    setTimeout(() => {
      universeAudio.stop()
      onComplete()
    }, reducedMotion ? 0 : 1200)
  }, [onComplete, reducedMotion])

  // Audio Toggle
  const handleToggleSound = () => {
    universeAudio.start().catch(() => {})
    const muted = universeAudio.toggleMute()
    setIsMuted(muted)
  }

  // Pointer Interaction
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!engineRef.current) return
    engineRef.current.setPointer(e.clientX, e.clientY, e.buttons > 0)
  }

  const handlePointerLeave = () => {
    if (!engineRef.current) return
    engineRef.current.clearPointer()
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    universeAudio.start().catch(() => {})
    if (engineRef.current) {
      engineRef.current.setPointer(e.clientX, e.clientY, true)
    }
  }

  // Initialize Canvas & Master Timeline Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new StarEngine(canvas)
    engineRef.current = engine

    const handleResize = () => {
      engine.resize()
    }

    window.addEventListener('resize', handleResize)

    // Master RAF Loop
    const loop = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current

      // Determine current scene from timeline
      let scene: UniverseScene = 'THE_VOID'

      if (elapsed < 10000) {
        scene = 'THE_VOID'
      } else if (elapsed < 25000) {
        scene = 'CONNECT_THE_STARS'
      } else if (elapsed < 40000) {
        scene = 'OUR_CONSTELLATION'
      } else if (elapsed < 50000) {
        scene = 'THE_BRIGHTEST_STAR'
      } else {
        scene = 'A_LETTER_FOR_YOU'
      }

      // Limit React updates to approximately 30 FPS.
      // The canvas animation continues running at the display refresh rate.
      if (timestamp - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL) {
        lastUiUpdateRef.current = timestamp

        setSceneElapsedMs(elapsed)
        setProgressPercent(
          Math.min(100, (elapsed / TOTAL_TIMELINE_MS) * 100)
        )

        setCurrentScene(prev => (
          prev !== scene && prev !== 'WARP_TRANSITION' ? scene : prev
        ))
      }

      // Render star engine on every animation frame
      engine.render(timestamp, elapsed, scene)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }

      window.removeEventListener('resize', handleResize)
      engine.destroy()
      engineRef.current = null
      startTimeRef.current = null
      lastUiUpdateRef.current = 0
    }
  }, [])

  // Subtitle/quote text based on current scene
  const getSceneQuote = () => {
    switch (currentScene) {
      case 'THE_VOID':
        return {
          kicker: 'SCENE 01 • THE VOID',
          quote: 'Every universe begins with a single point.'
        }

      case 'CONNECT_THE_STARS':
        return {
          kicker: 'SCENE 02 • CONNECT THE STARS',
          quote: 'Every point has its place.'
        }

      case 'OUR_CONSTELLATION':
        return {
          kicker: 'SCENE 03 • OUR CONSTELLATION',
          quote: 'Together, we became something beautiful.'
        }

      case 'THE_BRIGHTEST_STAR':
        return {
          kicker: 'SCENE 04 • THE BRIGHTEST STAR',
          quote: 'And one star helped us find our way.'
        }

      default:
        return null
    }
  }

  const quoteData = getSceneQuote()

  return (
    <div
      className={`universe-intro-root scene-${currentScene.toLowerCase().replace(/_/g, '-')} ${isWarpingOut ? 'warp-out' : ''}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      role="region"
      aria-label="Cinematic Intro: The Universe of 9H2"
    >
      {/* 2D Star & Math Formula Canvas */}
      <canvas ref={canvasRef} className="star-canvas" aria-hidden="true" />

      {/* Atmospheric Vignette */}
      <div className="universe-vignette" aria-hidden="true" />

      {/* Top Bar Controls */}
      <header className="universe-top-bar">
        <div className="universe-badge">
          <span className="star-icon" aria-hidden="true">✦</span>
          <span>THE UNIVERSE OF 9H2</span>
        </div>

        <div className="universe-controls-group">
          {/* Sound Toggle Button */}
          <button
            type="button"
            className="btn-cosmic btn-sound-toggle"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Bật âm thanh vũ trụ' : 'Tắt âm thanh'}
          >
            <span>{isMuted ? '🔇' : '✨'}</span>
            <span>{isMuted ? 'Âm thanh: Tắt' : 'Âm thanh: Bật'}</span>
          </button>

          {/* Skip Intro Button */}
          <button
            type="button"
            className="btn-cosmic btn-skip-intro"
            onClick={handleEnterMainSite}
          >
            <span>SKIP INTRO</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      {/* Dynamic Scene Quotes & Subtitles */}
      {quoteData && (
        <div className="universe-subtitle-layer" key={currentScene}>
          <span className="cosmic-quote-kicker">{quoteData.kicker}</span>
          <p className="cosmic-quote">"{quoteData.quote}"</p>
        </div>
      )}

      {/* Scene 02: Sacred Geometric Constellations */}
      <GeometryConstellation
        sceneTimeMs={sceneElapsedMs}
        isActive={currentScene === 'CONNECT_THE_STARS'}
      />

      {/* Scene 03: Floating Class Polaroid Memories */}
      <MemoryPhotos
        sceneTimeMs={sceneElapsedMs}
        isActive={currentScene === 'OUR_CONSTELLATION' || currentScene === 'THE_BRIGHTEST_STAR'}
      />

      {/* Scene 04: The Brightest Guiding Star */}
      <CentralStar
        sceneTimeMs={sceneElapsedMs}
        isActive={currentScene === 'THE_BRIGHTEST_STAR' || currentScene === 'A_LETTER_FOR_YOU'}
      />

      {/* Scene 05: The Envelope & Letter Reveal */}
      <LetterReveal
        sceneTimeMs={sceneElapsedMs}
        isActive={currentScene === 'A_LETTER_FOR_YOU'}
        onEnterSite={handleEnterMainSite}
      />

      {/* Bottom Progress Bar */}
      <div className="universe-progress-bar" aria-hidden="true">
        <div
          className="universe-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Screen Reader Accessible Content */}
      <div className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        <h2>Thông điệp tri ân ngày 20/11 từ lớp 9H2</h2>
        <p>Gửi cô giáo chủ nhiệm kính mến từ những vì sao nhỏ lớp 9H2. Chúng em cảm ơn cô vì đã đồng hành cùng chúng em.</p>
      </div>
    </div>
  )
}
