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
  const [progressPercent, setProgressPercent] = useState(0)

  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleEnterMainSite = useCallback(() => {
    setIsWarpingOut(true)
    setTimeout(() => {
      universeAudio.stop()
      onComplete()
    }, reducedMotion ? 0 : 1200)
  }, [onComplete, reducedMotion])

  const handleToggleSound = () => {
    universeAudio.start().catch(() => {})
    const muted = universeAudio.toggleMute()
    setIsMuted(muted)
  }

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new StarEngine(canvas)
    engineRef.current = engine

    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    const loop = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      setSceneElapsedMs(elapsed)
      setProgressPercent(Math.min(100, (elapsed / TOTAL_TIMELINE_MS) * 100))

      let scene: UniverseScene = 'THE_VOID'
      if (elapsed < 10000) scene = 'THE_VOID'
      else if (elapsed < 25000) scene = 'CONNECT_THE_STARS'
      else if (elapsed < 40000) scene = 'OUR_CONSTELLATION'
      else if (elapsed < 50000) scene = 'THE_BRIGHTEST_STAR'
      else scene = 'A_LETTER_FOR_YOU'

      setCurrentScene(prev => (prev !== scene && prev !== 'WARP_TRANSITION' ? scene : prev))
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
    >
      <canvas ref={canvasRef} className="star-canvas" aria-hidden="true" />
      <div className="universe-vignette" aria-hidden="true" />

      <header className="universe-top-bar">
        <div className="universe-badge">
          <span className="star-icon" aria-hidden="true">✦</span>
          <span>VŨ TRỤ KỶ NIỆM 9H2</span>
        </div>

        <div className="universe-controls-group">
          <button
            type="button"
            className="btn-cosmic btn-sound-toggle"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Bật âm thanh không gian' : 'Tắt âm thanh không gian'}
          >
            <span>{isMuted ? '🔇' : '✨'}</span>
            <span>{isMuted ? 'Âm thanh: Tắt' : 'Âm thanh: Bật'}</span>
          </button>

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
    </div>
  )
}
