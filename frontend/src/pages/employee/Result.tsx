import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { trainingApi } from '../../api/client'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function Result() {
  const { token } = useParams()
  const navigate  = useNavigate()
  const [result, setResult]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    trainingApi.getResult(token)
      .then(r => setResult(r.data))
      .catch(() => navigate('/employee/training'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <LoadingSpinner text="Loading your result..." />

  const passed    = result?.passed
  const score     = result?.score ?? 0
  const threshold = result?.pass_threshold ?? 80

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-3">CS</div>
        </div>

        {/* Steps all complete */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['Watch / Read', 'Take Quiz', 'Get Result'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < 2 ? 'bg-green-600 text-white' : passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}>{i < 2 ? '✓' : passed ? '✓' : '✕'}</div>
              <span className="text-sm text-white">{s}</span>
              {i < 2 && <span className="text-gray-700">→</span>}
            </div>
          ))}
        </div>

        <div className={`card border-2 text-center ${passed ? 'border-green-500/40' : 'border-red-500/40'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 ${
            passed ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
          }`}>{passed ? '✓' : '✕'}</div>

          <h2 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-400' : 'text-red-400'}`}>
            {passed ? 'Training Passed!' : 'Quiz Failed'}
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            {passed
              ? 'Congratulations! You have successfully completed this training module.'
              : `You need ${threshold}% to pass. Review the material and try again.`}
          </p>

          <div className={`rounded-xl p-6 mb-6 ${passed ? 'bg-green-600/10' : 'bg-red-600/10'}`}>
            <p className="text-sm text-gray-400 mb-1">Your Score</p>
            <p className={`text-5xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>
            <p className="text-sm text-gray-500 mt-2">Pass mark: {threshold}%</p>
          </div>

          {passed ? (
            <div className="bg-gray-800 rounded-lg p-4 text-left mb-4">
              <p className="text-xs text-gray-400 mb-1">Completion Record</p>
              <p className="text-white font-semibold">{result?.employee_name}</p>
              <p className="text-gray-300 text-sm mt-0.5">{result?.module_title}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          ) : (
            <button
              onClick={() => navigate(`/employee/training/${token}/watch`)}
              className="btn-primary w-full py-3 mb-4">
              Rewatch & Retry →
            </button>
          )}

          <button
            onClick={() => navigate('/employee/training')}
            className="btn-secondary w-full">
            ← Back to My Training
          </button>
        </div>
      </div>
    </div>
  )
}