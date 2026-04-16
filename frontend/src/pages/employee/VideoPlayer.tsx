import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { trainingApi } from '../../api/client'
import ProgressBar from '../../components/ui/ProgressBar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function getYouTubeId(url: string): string {
  if (!url) return ''
  const patterns = [
    /(?:v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:embed\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return ''
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function VideoPlayer() {
  const { token }   = useParams()
  const navigate    = useNavigate()
  const playerRef   = useRef<any>(null)
  const intervalRef = useRef<any>(null)

  const [moduleData, setModuleData]   = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [watched, setWatched]         = useState(false)
  const [progress, setProgress]       = useState(0)
  const [completing, setCompleting]   = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [confirmed, setConfirmed]     = useState(false)

  useEffect(() => {
    if (!token) return
    trainingApi.validateToken(token)
      .then(r => setModuleData(r.data.module))
      .catch(() => navigate('/employee/training'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!moduleData || moduleData.content_type !== 'video') return
    const videoId = getYouTubeId(moduleData.video_url)
    if (!videoId) return

    const initPlayer = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
      }

      playerRef.current = new window.YT.Player('yt-player-container', {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            console.log('YouTube player ready')
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              clearInterval(intervalRef.current)
              intervalRef.current = setInterval(() => {
                try {
                  const current  = playerRef.current.getCurrentTime()
                  const duration = playerRef.current.getDuration()
                  if (duration > 0) {
                    const pct = Math.round((current / duration) * 100)
                    setProgress(pct)
                    if (pct >= 90) {
                      setWatched(true)
                      clearInterval(intervalRef.current)
                    }
                  }
                } catch {}
              }, 1500)
            } else {
              clearInterval(intervalRef.current)
            }
          }
        }
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
      return
    }

    window.onYouTubeIframeAPIReady = initPlayer

    if (!document.getElementById('yt-api-script')) {
      const script = document.createElement('script')
      script.id  = 'yt-api-script'
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
    }

    return () => {
      clearInterval(intervalRef.current)
    }
  }, [moduleData])

  const proceedToQuiz = async () => {
    setCompleting(true)
    clearInterval(intervalRef.current)
    try { await trainingApi.completeVideo(token!) } catch {}
    navigate(`/employee/training/${token}/quiz`)
  }

  const handleNext = () => {
    if (!watched) return
    if (moduleData?.content_type === 'pdf' && moduleData?.summary && !showSummary) {
      setShowSummary(true)
      return
    }
    proceedToQuiz()
  }

  const Steps = ({ current }: { current: number }) => (
    <div className="flex items-center justify-center gap-4 mb-6">
      {['Watch / Read', 'Take Quiz', 'Get Result'].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            i < current   ? 'bg-green-600 text-white' :
            i === current ? 'bg-blue-600 text-white'  :
                            'bg-gray-800 text-gray-500'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-sm ${i === current ? 'text-white' : 'text-gray-500'}`}>{s}</span>
          {i < 2 && <span className="text-gray-700">→</span>}
        </div>
      ))}
    </div>
  )

  if (loading) return <LoadingSpinner text="Loading training content..." />

  const isPDF = moduleData?.content_type === 'pdf'

  if (showSummary && moduleData?.summary) {
    return (
      <div className="min-h-screen bg-gray-950 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-3">
              CS
            </div>
            <h1 className="text-xl font-bold text-white">Key Summary</h1>
            <p className="text-gray-400 text-sm mt-1">Review these points before your quiz</p>
          </div>

          <Steps current={0} />

          <div className="card mb-4 space-y-2 max-h-[55vh] overflow-y-auto pr-2">
            {moduleData.summary.split('\n').map((line: string, i: number) => {
              if (!line.trim()) return <div key={i} className="h-1" />
              if (line.match(/^#{1,2}\s/))
                return <h2 key={i} className="text-base font-bold text-blue-400 mt-4">{line.replace(/^#+\s/, '')}</h2>
              if (line.match(/^###\s/))
                return <h3 key={i} className="text-sm font-semibold text-white mt-3">{line.replace('### ', '')}</h3>
              if (line.match(/^[-•]\s/))
                return (
                  <div key={i} className="flex gap-2 items-start ml-2">
                    <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                    <p className="text-gray-300 text-sm">{line.replace(/^[-•]\s/, '')}</p>
                  </div>
                )
              if (line.match(/^\d+\.\s/))
                return (
                  <div key={i} className="flex gap-2 items-start ml-2">
                    <span className="text-green-400 text-sm font-bold shrink-0">{line.match(/^\d+/)?.[0]}.</span>
                    <p className="text-gray-300 text-sm">{line.replace(/^\d+\.\s/, '')}</p>
                  </div>
                )
              return <p key={i} className="text-gray-300 text-sm">{line}</p>
            })}
          </div>

          <div className="card border-blue-600/30 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="w-5 h-5 accent-blue-600"
              />
              <span className="text-gray-200 font-medium">
                I have read and understood this summary
              </span>
            </label>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setShowSummary(false)} className="btn-secondary">
              ← Back to Document
            </button>
            <button
              onClick={proceedToQuiz}
              disabled={!confirmed || completing}
              className="btn-primary disabled:opacity-40">
              {completing ? 'Loading...' : 'Proceed to Quiz →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-3">
            CS
          </div>
          <h1 className="text-xl font-bold text-white">
            {isPDF ? 'Document Review' : 'Training Video'}
          </h1>
          {moduleData?.title && (
            <p className="text-gray-400 text-sm mt-1">{moduleData.title}</p>
          )}
        </div>

        <Steps current={0} />

        {isPDF ? (
          <div className="card mb-4">
            <div className="flex items-center gap-3 mb-4 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
              <span className="text-2xl">📄</span>
              <div className="flex-1">
                <p className="text-yellow-400 font-medium text-sm">Legal Document</p>
                <p className="text-gray-400 text-xs">
                  Click the button to open the full document, then return here to confirm you have read it.
                </p>
              </div>
            </div>

            <div className="w-full rounded-lg border border-gray-700 bg-gray-900 p-8 mb-4 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-white font-semibold text-lg mb-2">{moduleData?.title}</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                This training module uses an official government or regulatory document.
                Click below to open and read it in a new tab.
              </p>

              
                <button
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
                onClick={() => { window.open(moduleData?.video_url, '_blank'); setTimeout(() => setProgress(50), 1000); }}>
                📖 Open Document in New Tab ↗
              </button>

              <p className="text-gray-500 text-xs mt-4">
                Document source: {moduleData?.video_url?.split('/').slice(0, 3).join('/')}
              </p>
            </div>

            {progress > 0 && (
              <div className="mb-4 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                <p className="text-blue-400 text-sm">
                  ✓ Document opened — please read it fully, then confirm below.
                </p>
              </div>
            )}

            {!watched ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Open the document above, read it, then click confirm.
                </p>
                <button
                  onClick={() => { setWatched(true); setProgress(100) }}
                  className="btn-primary">
                  ✓ I have read this document
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-400">✓ Document confirmed.</p>
                <button
                  onClick={handleNext}
                  disabled={completing}
                  className="btn-primary disabled:opacity-40">
                  {completing ? 'Loading...' :
                   moduleData?.summary ? 'View Key Summary →' : 'Proceed to Quiz →'}
                </button>
              </div>
            )}
          </div>

        ) : (
          <>
            <div className="card mb-4">
              {moduleData?.video_url ? (
                <>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', marginBottom: '16px', background: '#000' }}>
                    <div
                      id="yt-player-container"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    />
                  </div>

                  <ProgressBar
                    value={progress}
                    label={watched ? 'Video complete ✓' : `${progress}% watched — need 90% to proceed`}
                    color={watched ? 'green' : 'blue'}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500">
                  <div className="text-center">
                    <p className="text-3xl mb-2">🎥</p>
                    <p className="text-sm">No video available for this module</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {watched
                  ? '✓ Video complete — you can now take the quiz.'
                  : 'Watch at least 90% of the video to proceed.'}
              </p>
              <button
                onClick={handleNext}
                disabled={!watched || completing}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                {completing ? 'Loading...' : 'Proceed to Quiz →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}