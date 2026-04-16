import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeAuthApi } from '../../api/client'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const statusColors: Record<string, string> = {
  passed:       'bg-green-600/20 text-green-400 border-green-600/30',
  failed:       'bg-red-600/20 text-red-400 border-red-600/30',
  watching:     'bg-blue-600/20 text-blue-400 border-blue-600/30',
  quiz_pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  not_started:  'bg-gray-700/50 text-gray-400 border-gray-600/30',
}

const statusLabels: Record<string, string> = {
  passed:       '✓ Passed',
  failed:       '✕ Failed — Retry',
  watching:     '▶ In Progress',
  quiz_pending: '📝 Quiz Ready',
  not_started:  '○ Not Started',
}

const categoryLabels: Record<string, string> = {
  mandatory:       '🔴 Mandatory',
  nepal_compliance:'🟡 Nepal Law',
  optional:        '🟢 Optional',
}

export default function MyTraining() {
  const navigate = useNavigate()
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const token = localStorage.getItem('employee_token')
    const name  = localStorage.getItem('employee_name')
    if (!token) { navigate('/employee/login'); return }
    setEmployeeName(name || 'Employee')

    employeeAuthApi.getMyModules(token)
      .then(r => setModules(r.data))
      .catch(() => { navigate('/employee/login') })
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('employee_token')
    localStorage.removeItem('employee_name')
    navigate('/employee/login')
  }

  const handleStart = (token: string, status: string) => {
    if (status === 'passed') return
    if (status === 'quiz_pending') navigate(`/employee/training/${token}/quiz`)
    else navigate(`/employee/training/${token}/watch`)
  }

  const passed  = modules.filter(m => m.progress.status === 'passed').length
  const total   = modules.length
  const pending = modules.filter(m => m.progress.status !== 'passed').length

  const filtered =
    filter === 'pending'   ? modules.filter(m => m.progress.status !== 'passed') :
    filter === 'completed' ? modules.filter(m => m.progress.status === 'passed') :
    modules

  if (loading) return <LoadingSpinner text="Loading your training modules..." />

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              CS
            </div>
            <div>
              <p className="text-white font-semibold text-sm">CyberShield Training</p>
              <p className="text-gray-400 text-xs">Welcome, {employeeName}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header + progress bar */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">My Training</h1>
          <p className="text-gray-400 text-sm mb-3">
            {passed} of {total} module{total !== 1 ? 's' : ''} completed
            {pending > 0 && ` · ${pending} pending`}
          </p>
          {total > 0 && (
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((passed / total) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all',       label: `All (${total})` },
            { key: 'pending',   label: `Pending (${pending})` },
            { key: 'completed', label: `Completed (${passed})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Module cards */}
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-4xl mb-3">
              {filter === 'all' ? '📚' : filter === 'pending' ? '✓' : '📊'}
            </p>
            <p className="text-gray-300 font-medium">
              {filter === 'all'
                ? 'No modules assigned yet'
                : filter === 'pending'
                ? 'All modules completed!'
                : 'No completed modules yet'}
            </p>
            {filter === 'all' && (
              <p className="text-gray-500 text-sm mt-1">
                Your administrator will assign training modules to you.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item: any) => {
              const { module, progress, link_token } = item
              const isPassed = progress.status === 'passed'
              return (
                <div key={link_token}
                  className={`card transition-all ${
                    isPassed ? 'border-green-600/20' : 'hover:border-gray-600'
                  }`}>
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {module.content_type === 'pdf' ? '📄' : '🎥'}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        statusColors[progress.status] || statusColors.not_started
                      }`}>
                        {statusLabels[progress.status] || 'Not Started'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {categoryLabels[module.category] || module.category}
                      </span>
                    </div>
                  </div>

                  {/* Title + description */}
                  <h3 className="font-semibold text-white mb-1 text-sm leading-snug">
                    {module.title}
                  </h3>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                    {module.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Pass: {module.pass_threshold}%</span>
                    {progress.attempts > 0 && (
                      <span>
                        Best: {progress.best_score}% · {progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Action button */}
                  {isPassed ? (
                    <div className="w-full py-2 text-center text-sm font-medium text-green-400 bg-green-600/10 rounded-lg border border-green-600/20">
                      ✓ Training Complete
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStart(link_token, progress.status)}
                      className="btn-primary w-full text-sm">
                      {progress.status === 'not_started' ? 'Start Training →' :
                       progress.status === 'quiz_pending' ? 'Take Quiz →' :
                       progress.status === 'failed' ? 'Retry Training →' :
                       'Continue →'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}