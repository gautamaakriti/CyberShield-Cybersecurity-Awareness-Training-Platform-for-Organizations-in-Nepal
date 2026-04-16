import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizzesApi, modulesApi } from '../../api/client'

interface QuestionForm {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'A' | 'B' | 'C' | 'D'
}

const emptyQ = (): QuestionForm => ({
  question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A'
})

export default function CreateQuiz() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('Module Quiz')
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQ()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')

  useEffect(() => {
    if (id) {
      modulesApi.get(Number(id)).then(r => setModuleTitle(r.data.title)).catch(() => {})
      quizzesApi.get(Number(id)).then(r => {
        if (r.data) {
          setTitle(r.data.title)
          setQuestions(r.data.questions?.length ? r.data.questions : [emptyQ()])
        }
      }).catch(() => {})
    }
  }, [id])

  const updateQ = (i: number, field: keyof QuestionForm, value: string) => {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await quizzesApi.create(Number(id), { title, questions })
      navigate('/admin/modules')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Quiz</h1>
        <p className="text-gray-400 mt-1">For module: <span className="text-blue-400">{moduleTitle}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>}

        <div className="card">
          <label className="label">Quiz Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        {questions.map((q, i) => (
          <div key={i} className="card border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-blue-400">Question {i + 1}</span>
              {questions.length > 1 && (
                <button type="button" onClick={() => setQuestions(qs => qs.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-400 hover:text-red-300">Remove</button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Question</label>
                <input className="input" placeholder="Enter your question..." value={q.question_text}
                  onChange={e => updateQ(i, 'question_text', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['a', 'b', 'c', 'd'] as const).map(opt => (
                  <div key={opt}>
                    <label className="label">Option {opt.toUpperCase()}</label>
                    <input className="input" placeholder={`Option ${opt.toUpperCase()}`}
                      value={q[`option_${opt}` as keyof QuestionForm]}
                      onChange={e => updateQ(i, `option_${opt}` as keyof QuestionForm, e.target.value)} required />
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Correct Answer</label>
                <select className="input" value={q.correct_option}
                  onChange={e => updateQ(i, 'correct_option', e.target.value as any)}>
                  {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>Option {o}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={() => setQuestions(qs => [...qs, emptyQ()])}
          className="btn-secondary w-full border-dashed border-gray-600">
          + Add Question
        </button>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Quiz'}
          </button>
          <button type="button" onClick={() => navigate('/admin/modules')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
