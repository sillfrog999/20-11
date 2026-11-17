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
const UI_UPDATE_INTERVAL = 50
const PROGRESS_UPDATE_INTERVAL = 100

export function UniverseIntro({ onComplete }: UniverseIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<StarEngine | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const lastUiUpdateRef = useRef(0)
  const lastProgressUpdateRef = useRef(0)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isExitingRef = useRef(false)

  const [currentScene, setCurrentScene] = useState<UniverseScene>('THE_VOID')
  const [sceneElapsedMs, setSceneElapsedMs] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isWarpingOut, setIsWarpingOut] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)

  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const handleEnterMainSite = useCallback(() => {
    if (isExitingRef.current) return

    isExitingRef.current = true
    setIsWarpingOut(true)

    exitTimerRef.current = setTimeout(() => {
      universeAudio.stop()
      onComplete()
    }, reducedMotion.current ? 0 : 1200)
  }, [onComplete])

  const handleToggleSound = useCallback(() => {
    universeAudio.start().catch(() => {})
    const muted = universeAudio.toggleMute()
    setIsMuted(muted)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    engineRef.current?.setPointer(e.clientX, e.clientY, e.buttons > 0)
  }, [])

  const handlePointerLeave = useCallback(() => {
    engineRef.current?.clearPointer()
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    universeAudio.start().catch(() => {})
    engineRef.current?.setPointer(e.clientX, e.clientY, true)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new StarEngine(canvas)
    engineRef.current = engine

    let frameId = 0
    let isVisible = !document.hidden

    const getScene = (elapsed: number): UniverseScene => {
      if (elapsed < 10000) return 'THE_VOID'
      if (elapsed < 25000) return 'CONNECT_THE_STARS'
      if (elapsed < 40000) return 'OUR_CONSTELLATION'
      if (elapsed < 50000) return 'THE_BRIGHTEST_STAR'
      return 'A_LETTER_FOR_YOU'
    }

    const handleResize = () => engine.resize()

    const loop = (timestamp: number) => {
      if (!isVisible || isExitingRef.current) return

      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const scene = getScene(elapsed)

      if (timestamp - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL) {
        lastUiUpdateRef.current = timestamp
        setSceneElapsedMs(elapsed)

        setCurrentScene(prev => (
          prev === scene || prev === 'WARP_TRANSITION' ? prev : scene
        ))
      }

      if (timestamp - lastProgressUpdateRef.current >= PROGRESS_UPDATE_INTERVAL) {
        lastProgressUpdateRef.current = timestamp
        setProgressPercent(Math.min(100, (elapsed / TOTAL_TIMELINE_MS) * 100))
      }

      engine.render(timestamp, elapsed, scene)
      frameId = requestAnimationFrame(loop)
      animFrameRef.current = frameId
    }

    const startLoop = () => {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(loop)
      animFrameRef.current = frameId
    }

    const handleVisibilityChange = () => {
      isVisible = !document.hidden

      if (isVisible) {
        startLoop()
      } else if (frameId) {
        cancelAnimationFrame(frameId)
        frameId = 0
      }
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    startLoop()

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)

      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      engine.destroy()
      engineRef.current = null
      startTimeRef.current = null
      lastUiUpdateRef.current = 0
      lastProgressUpdateRef.current = 0
    }
  }, [])

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
      <canvas ref={canvasRef} className="star-canvas" aria-hidden="true" />
      <div className="universe-vignette" aria-hidden="true" />

      <header className="universe-top-bar">
        <div className="universe-badge">
          <span className="star-icon" aria-hidden="true">✦</span>
          <span>THE UNIVERSE OF 9H2</span>
        </div>

        <div className="universe-controls-group">
          <button
            type="button"
            className="btn-cosmic btn-sound-toggle"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Bật âm thanh vũ trụ' : 'Tắt âm thanh'}
          >
            <span aria-hidden="true">{isMuted ? '🔇' : '✨'}</span>
            <span>{isMuted ? 'Âm thanh: Tắt' : 'Âm thanh: Bật'}</span>
          </button>

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

      {quoteData && (
        <div className="universe-subtitle-layer" key={currentScene}>
          <span className="cosmic-quote-kicker">{quoteData.kicker}</span>
          <p className="cosmic-quote">"{quoteData.quote}"</p>
        </div>
      )}

      <GeometryConstellation
        sceneTimeMs={sceneElapsedMs}
        isActive={currentScene === 'CONNECT_THE_STARS'}
      />

      <MemoryPhotos
        sceneTimeMs={sceneElapsedMs}
        isActive={currentScene === 'OUR_CONSTELLATION' || currentScene === 'THE_BRIGHTEST_STAR'}
      />

      <CentralStar
        sceneTimeMs={sceneElapsedMs}
        isActive={currentScene === 'THE_BRIGHTEST_STAR' || currentScene === 'A_LETTER_FOR_YOU'}
      />

      <LetterReveal
        sceneTimeMs={sceneElapsedMs}
        isActive={currentScene === 'A_LETTER_FOR_YOU'}
        onEnterSite={handleEnterMainSite}
      />

      <div className="universe-progress-bar" aria-hidden="true">
        <div
          className="universe-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        <h2>Thông điệp tri ân ngày 20/11 từ lớp 9H2</h2>
        <p>Gửi cô giáo chủ nhiệm kính mến từ những vì sao nhỏ lớp 9H2. Chúng em cảm ơn cô vì đã đồng hành cùng chúng em.</p>
      </div>
    </div>
  )
}
