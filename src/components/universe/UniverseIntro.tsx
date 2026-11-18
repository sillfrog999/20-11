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

export function UniverseIntro({ onComplete }: UniverseIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<StarEngine | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const [currentScene, setCurrentScene] = useState<UniverseScene>('THE_VOID')
  const [sceneElapsedMs, setSceneElapsedMs] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isWarpingOut, setIsWarpingOut] = useState(false)

  const progressFillRef = useRef<HTMLDivElement>(null)
  const lastStateUpdateRef = useRef<number>(0)

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
    // Ensure audio starts on first click if not already
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

      // Direct DOM update for progress bar (smooth 60fps with 0 React overhead)
      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${Math.min(100, (elapsed / TOTAL_TIMELINE_MS) * 100)}%`
      }

      // Smooth throttled React state updates (35fps) to prevent main thread blocking
      if (timestamp - lastStateUpdateRef.current >= 28) {
        lastStateUpdateRef.current = timestamp
        setSceneElapsedMs(elapsed)
      }

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

      setCurrentScene(prev => (prev !== scene && prev !== 'WARP_TRANSITION' ? scene : prev))

      // Render star engine
      engine.render(timestamp, elapsed, scene)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
      engine.destroy()
    }
  }, [])

  // Subtitle/quote text based on current scene (Vietnamese, warm & touching)
  const getSceneQuote = () => {
    switch (currentScene) {
      case 'THE_VOID':
        return {
          kicker: 'KHỞI NGUYÊN • KHOẢNG LẶNG ĐẦU TIÊN',
          quote: 'Mọi vũ trụ bao la đều bắt đầu từ một điểm sáng nhỏ bé...'
        }
      case 'CONNECT_THE_STARS':
        return {
          kicker: 'KẾT NỐI • NHỮNG VÌ SAO NHỎ',
          quote: 'Mỗi chúng em là một vì sao, và nơi này là nơi chúng mình tìm thấy nhau.'
        }
      case 'OUR_CONSTELLATION':
        return {
          kicker: 'CHÒM SAO KÝ ỨC • THANH XUÂN 9H2',
          quote: 'Bên nhau, chúng ta đã cùng dệt nên những năm tháng đẹp nhất của tuổi học trò.'
        }
      case 'THE_BRIGHTEST_STAR':
        return {
          kicker: 'NGÔI SAO DẪN ĐƯỜNG • ÁNH SÁNG YÊU THƯƠNG',
          quote: 'Và giữa muôn ngàn tinh tú, luôn có một vì sao ấm áp soi đường cho chúng em lớn khôn.'
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#080817',
        background: 'radial-gradient(circle at 50% 50%, #15112F 0%, #080817 100%)',
        overflow: 'hidden',
      }}
    >
      {/* 2D Star & Math Formula Canvas */}
      <canvas ref={canvasRef} className="star-canvas" aria-hidden="true" />

      {/* Atmospheric Vignette */}
      <div className="universe-vignette" aria-hidden="true" />

      {/* Top Bar Controls */}
      <header className="universe-top-bar">
        <div className="universe-badge">
          <span className="star-icon" aria-hidden="true">✦</span>
          <span>VŨ TRỤ KỶ NIỆM 9H2</span>
        </div>

        <div className="universe-controls-group">
          {/* Sound Toggle Button */}
          <button
            type="button"
            className="btn-cosmic btn-sound-toggle"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Bật âm thanh không gian' : 'Tắt âm thanh không gian'}
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
            <span>Bỏ qua giới thiệu</span>
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
          ref={progressFillRef}
          className="universe-progress-fill"
          style={{ width: '0%' }}
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
