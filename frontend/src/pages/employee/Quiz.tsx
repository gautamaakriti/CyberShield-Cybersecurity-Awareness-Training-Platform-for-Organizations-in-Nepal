import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { trainingApi } from '../../api/client'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function Quiz() {
  const { token }   = useParams()
  const navigate    = useNavigate()
  const [questions, setQuestions]   = useState<any[]>([])
  const [answers, setAnswers]       = useState<Record<number, string>>({})
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [current, setCurrent]       = useState(0)

  useEffect(() => {
    if (!token) return
    trainingApi.validateToken(token)
      .then(r => setQuestions(r.data.module?.quiz?.questions ?? []))
      .catch(() => navigate('/employee/training'))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert(`Answer all ${questions.length} questions first.`)
      return
    }
    setSubmitting(true)
    try {
      await trainingApi.submitQuiz(token!, answers)
      navigate(`/employee/training/${token}/result`)
    } catch {
      setSubmitting(false)
      alert('Failed to submit. Please try again.')
    }
  }

  if (loading) return <LoadingSpinner text="Loading quiz..." />

  const q = questions[current]
  const totalAnswered = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-3">CS</div>
          <h1 className="text-xl font-bold text-white">Knowledge Check</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {['Watch / Read', 'Take Quiz', 'Get Result'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < 1 ? 'bg-green-600 text-white' : i === 1 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'
              }`}>{i < 1 ? '✓' : i + 1}</div>
              <span className={`text-sm ${i === 1 ? 'text-white' : 'text-gray-500'}`}>{s}</span>
              {i < 2 && <span className="text-gray-700">→</span>}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{totalAnswered} answered</span>
        </div>
        <div className="flex gap-1 mb-6">
          {questions.map((_: any, i: number) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-2 flex-1 rounded-full transition-colors ${
                answers[questions[i]?.id] ? 'bg-green-500' : i === current ? 'bg-blue-500' : 'bg-gray-800'
              }`} />
          ))}
        </div>

        {/* Question card */}
        {q && (
          <div className="card mb-4">
            <p className="text-white font-medium mb-6 text-base leading-relaxed">
              {current + 1}. {q.question_text}
            </p>
            <div className="space-y-3">
              {[
                { key: 'A', val: q.option_a },
                { key: 'B', val: q.option_b },
                { key: 'C', val: q.option_c },
                { key: 'D', val: q.option_d },
              ].map(opt => (
                <button key={opt.key}
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.key }))}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    answers[q.id] === opt.key
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}>
                  <span className="font-bold mr-3 text-gray-400">{opt.key}.</span>{opt.val}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0} className="btn-secondary disabled:opacity-40">
            ← Previous
          </button>
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)} className="btn-primary">Next →</button>
          ) : (
            <button onClick={handleSubmit}
              disabled={submitting || totalAnswered < questions.length}
              className="btn-primary disabled:opacity-40">
              {submitting ? 'Submitting...' : 'Submit Quiz ✓'}
            </button>
          )}
        </div>

        {totalAnswered < questions.length && current === questions.length - 1 && (
          <p className="text-center text-yellow-400 text-xs mt-3">
            ⚠️ {questions.length - totalAnswered} question{questions.length - totalAnswered !== 1 ? 's' : ''} unanswered
          </p>
        )}
      </div>
    </div>
  )
}