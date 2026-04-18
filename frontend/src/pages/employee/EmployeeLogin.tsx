import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeAuthApi } from '../../api/client'

export default function EmployeeLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await employeeAuthApi.login(email, password)
      const { access_token, employee } = res.data
      localStorage.setItem('employee_token', access_token)
      localStorage.setItem('employee_name', employee.full_name)
      localStorage.setItem('employee_id', String(employee.id))  // ← ADD THIS
      navigate('/employee/training')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            CS
          </div>
          <h1 className="text-2xl font-bold text-white">CyberShield Training</h1>
          <p className="text-gray-400 mt-1">Employee Portal</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-2">Sign In</h2>
          <p className="text-gray-400 text-sm mb-6">
            Use the credentials provided by your administrator.
          </p>

          {error && (
            <div className="bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Work Email</label>
              <input
                type="email"
                className="input"
                placeholder="your.email@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Admin?{' '}
          <a href="/admin/login" className="text-blue-400 hover:text-blue-300">
            Admin Login →
          </a>
        </p>
      </div>
    </div>
  )
}