import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../../api/client'
import StatCard from '../../components/ui/StatCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Badge from '../../components/ui/Badge'

export default function Dashboard() {
  const [stats, setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.stats()
      .then(r => setStats(r.data))
      .catch(() => setStats({
        total_employees: 0, total_modules: 0, total_assignments: 0,
        completion_rate: 0, total_completions: 0,
        failed_attempts: 0, in_progress: 0, recent_completions: []
      }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  const portalUrl = `${window.location.origin}/employee/login`

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">CyberShield Training Overview</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/modules/new" className="btn-primary">+ New Module</Link>
          <Link to="/admin/employees" className="btn-secondary">+ Add Employee</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Employees"  value={stats?.total_employees ?? 0}    icon="◉" color="blue"   subtitle="Registered in platform" />
        <StatCard title="Completion Rate"  value={`${stats?.completion_rate ?? 0}%`} icon="✓" color="green"  subtitle={`${stats?.total_completions ?? 0} passed`} />
        <StatCard title="Failed Attempts"  value={stats?.failed_attempts ?? 0}    icon="✕" color="red"    subtitle="Need to retake" />
        <StatCard title="Training Modules" value={stats?.total_modules ?? 0}      icon="▶" color="yellow" subtitle="Active modules" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-white mb-4">Recent Training Activity</h3>
          {!stats?.recent_completions?.length ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-gray-400 text-sm font-medium">No activity yet</p>
              <p className="text-gray-500 text-xs mt-1">
                Add employees → assign modules → they login and train
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recent_completions.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {p.employee?.full_name ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{p.module?.title ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    {p.best_score > 0 && (
                      <span className="text-xs text-gray-400">{p.best_score}%</span>
                    )}
                    <Badge variant={
                      p.status === 'passed' ? 'passed' :
                      p.status === 'failed' ? 'failed' : 'watching'
                    } />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Employee portal card */}
          <div className="card border-blue-600/30 bg-blue-600/5">
            <p className="text-sm font-semibold text-blue-400 mb-1">🔗 Employee Portal</p>
            <p className="text-xs text-gray-400 mb-2">
              Share this URL with employees so they can login and start training:
            </p>
            <code className="text-xs text-white break-all block bg-gray-800 p-2 rounded mb-2">
              {portalUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(portalUrl)}
              className="text-xs text-blue-400 hover:text-blue-300">
              📋 Copy URL
            </button>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: '/admin/employees', icon: '◉', color: 'text-blue-400 bg-blue-600/20', title: 'Add Employees', sub: 'Register & assign training' },
                { to: '/admin/modules/new', icon: '▶', color: 'text-green-400 bg-green-600/20', title: 'Create Module', sub: 'Add training content' },
                { to: '/admin/reports', icon: '▤', color: 'text-yellow-400 bg-yellow-600/20', title: 'View Reports', sub: 'Track progress & scores' },
              ].map(a => (
                <Link key={a.to} to={a.to}
                  className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  <div className={`w-8 h-8 ${a.color} rounded-lg flex items-center justify-center`}>
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}