import { useState, useEffect } from 'react'
import { musicEngine } from '../lib/audio'

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(musicEngine.getCurrentTrack())
  const [isMuted, setIsMuted] = useState(musicEngine.getIsMuted())
  const [volume, setVolume] = useState(musicEngine.getVolume())
  const [showVolume, setShowVolume] = useState(false)

  useEffect(() => {
    const unsubscribe = musicEngine.subscribe((playing, trackIndex) => {
      setIsPlaying(playing)
      setCurrentTrack(trackIndex)
    })
    return () => unsubscribe()
  }, [])

  const handleTogglePlay = async () => {
    if (isPlaying) {
      musicEngine.pause()
    } else {
      await musicEngine.play()
    }
  }

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    musicEngine.setMuted(nextMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    musicEngine.setVolume(val)
    if (isMuted && val > 0) {
      setIsMuted(false)
      musicEngine.setMuted(false)
    }
  }

  return (
    <div
      className="audio-player"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
      role="region"
      aria-label="Nhạc nền tri ân"
    >
      {showVolume && (
        <div className="audio-volume-popover">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Âm lượng"
            className="volume-slider"
          />
          <button
            type="button"
            className="mute-btn"
            onClick={handleToggleMute}
            title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          >
            {isMuted || volume === 0 ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            className="mute-btn next-track-btn"
            onClick={(e) => {
              e.stopPropagation()
              musicEngine.nextTrack()
            }}
            title="Chuyển bài tiếp theo (1 ⇄ 2)"
            aria-label="Chuyển bài tiếp theo"
          >
            ⏭
          </button>
        </div>
      )}

      <button
        type="button"
        className={`audio-btn ${isPlaying ? 'playing' : ''}`}
        onClick={handleTogglePlay}
        title={isPlaying ? 'Tạm dừng nhạc nền' : 'Phát nhạc nền tri ân'}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? 'Tạm dừng nhạc nền' : 'Phát nhạc nền tri ân'}
      >
        <span className="vinyl-icon" aria-hidden="true">
          <span className="vinyl-center" />
        </span>
        <span className="audio-label">
          {isPlaying ? `Nhạc nền (${currentTrack + 1}/2) ♫` : 'Bật nhạc nền ♫'}
        </span>
      </button>
    </div>
  )
}
