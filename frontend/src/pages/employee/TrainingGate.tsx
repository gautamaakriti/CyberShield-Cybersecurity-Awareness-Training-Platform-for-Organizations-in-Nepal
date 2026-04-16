import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { trainingApi } from '../../api/client'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function TrainingGate() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'completed'>('loading')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!token) return setStatus('invalid')
    trainingApi.validateToken(token)
      .then(r => {
        setData(r.data)
        if (r.data.progress?.status === 'passed') setStatus('completed')
        else setStatus('valid')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  if (status === 'loading') return <LoadingSpinner text="Validating your training link..." />

  if (status === 'invalid') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-5xl mb-4">✕</p>
        <h2 className="text-xl font-bold text-white">Invalid Training Link</h2>
        <p className="text-gray-400 mt-2">This link is invalid or has expired. Contact your administrator.</p>
      </div>
    </div>
  )

  if (status === 'completed') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-5xl mb-4">✓</p>
        <h2 className="text-xl font-bold text-white">Training Already Completed!</h2>
        <p className="text-gray-400 mt-2">You have already completed this training module.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">CS</div>
          <h1 className="text-2xl font-bold text-white">CyberShield Training</h1>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-sm mb-1">You are assigned to</p>
          <h2 className="text-xl font-bold text-white mb-2">{data?.module?.title}</h2>
          <p className="text-gray-400 text-sm mb-6">{data?.module?.description}</p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left space-y-2">
            <p className="text-sm text-gray-300">📹 Watch the training video</p>
            <p className="text-sm text-gray-300">📝 Complete the quiz ({data?.module?.pass_threshold ?? 80}% to pass)</p>
            <p className="text-sm text-gray-300">✓ Get your completion certificate</p>
          </div>
          <p className="text-sm text-gray-300 mb-1 font-medium">Hello, {data?.employee?.full_name}!</p>
          <button onClick={() => navigate(`/train/${token}/watch`)} className="btn-primary w-full py-3 text-base mt-4">
            Start Training →
          </button>
        </div>
      </div>
    </div>
  )
}
