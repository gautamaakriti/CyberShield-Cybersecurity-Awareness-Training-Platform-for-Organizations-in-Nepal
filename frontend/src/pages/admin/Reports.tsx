import { useEffect, useState } from 'react'
import { dashboardApi } from '../../api/client'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Badge from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6']

function shortenTitle(title: string, max = 28) {
  if (!title) return 'Unknown'
  return title.length > max ? `${title.slice(0, max)}…` : title
}

export default function Reports() {
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.progress()
      .then(r => setProgress(r.data))
      .catch(() => setProgress([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Delete this training record?')) return

    try {
      await dashboardApi.deleteProgress(id)
      setProgress(prev => prev.filter((p: any) => p.id !== id))
    } catch {
      alert('Failed to delete training record')
    }
  }

  const handleResetAll = async () => {
    if (!confirm('Reset all employee training records? This will remove all progress and quiz attempts.')) return

    try {
      await dashboardApi.resetAllProgress()
      setProgress([])
    } catch {
      alert('Failed to reset all training records')
    }
  }

  const passed = progress.filter(p => p.status === 'passed').length
  const failed = progress.filter(p => p.status === 'failed').length
  const inProgress = progress.filter(
    p => p.status === 'watching' || p.status === 'quiz_pending'
  ).length
  const notStarted = progress.filter(p => p.status === 'not_started').length
  const total = progress.length
  const passRate = total ? Math.round((passed / total) * 100) : 0

  const pieData = [
    { name: 'Passed', value: passed },
    { name: 'Failed', value: failed },
    { name: 'In Progress', value: inProgress },
    { name: 'Not Started', value: notStarted },
  ].filter(d => d.value > 0)

  const moduleScoreMap: Record<string, { fullName: string; shortName: string; total: number; count: number }> = {}

  progress.forEach((p: any) => {
    const fullName = p.module?.title || 'Unknown'
    const shortName = shortenTitle(fullName, 26)

    if (!moduleScoreMap[fullName]) {
      moduleScoreMap[fullName] = {
        fullName,
        shortName,
        total: 0,
        count: 0
      }
    }

    moduleScoreMap[fullName].total += p.best_score || 0
    moduleScoreMap[fullName].count += 1
  })

  const barData = Object.values(moduleScoreMap)
    .map(m => ({
      name: m.shortName,
      fullName: m.fullName,
      avg: Math.round(m.total / m.count)
    }))
    .sort((a, b) => b.avg - a.avg)

  if (loading) return <LoadingSpinner text="Loading reports..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-gray-400 mt-1">Track employee training progress and completion rates</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pass Rate', value: `${passRate}%`, color: 'text-green-400', border: 'border-green-600/20' },
          { label: 'Passed', value: passed, color: 'text-blue-400', border: 'border-blue-600/20' },
          { label: 'Failed', value: failed, color: 'text-red-400', border: 'border-red-600/20' },
          { label: 'Total Records', value: total, color: 'text-yellow-400', border: 'border-yellow-600/20' },
        ].map(s => (
          <div key={s.label} className={`card text-center border ${s.border}`}>
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card min-h-[360px]">
            <h3 className="font-semibold text-white mb-4">Completion Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {barData.length > 0 && (
            <div className="card min-h-[360px]">
              <h3 className="font-semibold text-white mb-4">Avg Score by Module</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={180}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 8
                    }}
                    labelStyle={{ color: '#f3f4f6' }}
                    formatter={(val: any) => [`${val}%`, 'Avg Score']}
                    labelFormatter={(_: any, payload: any) =>
                      payload?.[0]?.payload?.fullName || ''
                    }
                  />
                  <Bar dataKey="avg" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">Employee Training Records</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{total} records</span>
            {total > 0 && (
              <button
                onClick={handleResetAll}
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1 rounded"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr>
                {['Employee', 'Module', 'Status', 'Best Score', 'Attempts', 'Completed', ''].map(h => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800">
              {progress.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <p className="text-4xl mb-3">📊</p>
                    <p className="text-gray-400 font-medium">No training data yet</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Go to Employees → add employees → generate links → share with them
                    </p>
                  </td>
                </tr>
              ) : (
                progress.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-200">
                        {p.employee?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500">{p.employee?.email ?? ''}</p>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400 max-w-[220px]">
                      <p className="truncate">{p.module?.title ?? '—'}</p>
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          p.status === 'passed'
                            ? 'passed'
                            : p.status === 'failed'
                            ? 'failed'
                            : 'watching'
                        }
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300 w-10">
                          {p.best_score ? `${p.best_score}%` : '—'}
                        </span>
                        {p.best_score > 0 && (
                          <div className="w-16">
                            <ProgressBar
                              value={p.best_score}
                              color={p.best_score >= 80 ? 'green' : 'red'}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400 text-center">
                      {p.attempts}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-400">
                      {p.completed_at
                        ? new Date(p.completed_at).toLocaleDateString('en-GB')
                        : '—'}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteRecord(p.id)}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}