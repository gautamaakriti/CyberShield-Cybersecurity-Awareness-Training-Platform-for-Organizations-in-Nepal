import { useEffect, useState } from 'react'
import { employeesApi, modulesApi } from '../../api/client'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Badge from '../../components/ui/Badge'

export default function Employees() {
  const [employees, setEmployees]         = useState<any[]>([])
  const [modules, setModules]             = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [assignResult, setAssignResult]   = useState<any[]>([])
  const [selectedEmps, setSelectedEmps]   = useState<number[]>([])
  const [selectedMods, setSelectedMods]   = useState<number[]>([])
  const [assigning, setAssigning]         = useState(false)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', password: 'Nepal@123', department: '', organization: ''
  })

  const portalUrl = `${window.location.origin}/employee/login`

  useEffect(() => {
    Promise.all([employeesApi.list(), modulesApi.list()])
      .then(([e, m]) => { setEmployees(e.data); setModules(m.data) })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 5000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 5000) }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await employeesApi.create(form)
      setEmployees(prev => [...prev, res.data])
      setForm({ full_name: '', email: '', password: 'Nepal@123', department: '', organization: '' })
      setShowForm(false)
      flash(`✓ ${res.data.full_name} added. They can login at /employee/login with password: ${form.password}`)
    } catch (err: any) {
      flash(err.response?.data?.detail || 'Failed to add employee', true)
    }
  }

  const toggle = (id: number, list: number[], set: (v: number[]) => void) =>
    set(list.includes(id) ? list.filter(x => x !== id) : [...list, id])

  const handleAssign = async () => {
    if (!selectedEmps.length || !selectedMods.length) {
      flash('Select at least one employee AND one module.', true)
      return
    }
    setAssigning(true)
    try {
      const res = await employeesApi.assignModules(selectedEmps, selectedMods)
      setAssignResult(res.data.assignments)
      flash(`✓ ${res.data.total} assignments created! Employees can now see these modules when they login.`)
      const empRes = await employeesApi.list()
      setEmployees(empRes.data)
    } catch {
      flash('Failed to assign modules. Check backend is running.', true)
    } finally {
      setAssigning(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this employee and all their training data?')) return
    try {
      await employeesApi.delete(id)
      setEmployees(prev => prev.filter(e => e.id !== id))
    } catch { flash('Failed to delete employee', true) }
  }

  if (loading) return <LoadingSpinner text="Loading employees..." />

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-gray-400 mt-1">{employees.length} registered employees</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Employee</button>
      </div>

      {/* Portal URL banner */}
      <div className="card border-blue-600/30 bg-blue-600/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-400 mb-0.5">🔗 Employee Training Portal</p>
            <p className="text-xs text-gray-400">Share this with employees so they can login:</p>
            <code className="text-sm text-white font-mono">{portalUrl}</code>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(portalUrl); flash('Portal URL copied!') }}
            className="btn-secondary shrink-0">📋 Copy</button>
        </div>
      </div>

      {error   && <div className="bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-600/20 border border-green-600/30 text-green-400 rounded-lg px-4 py-3 text-sm">{success}</div>}

      {/* Add employee form */}
      {showForm && (
        <div className="card border-blue-600/30">
          <h3 className="font-semibold text-white mb-1">New Employee</h3>
          <p className="text-gray-400 text-xs mb-4">
            Employee will login at <span className="text-blue-400">/employee/login</span> with their email and the password you set below.
          </p>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Work Email *</label>
              <input type="email" className="input" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Login Password *</label>
              <input type="text" className="input" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              <p className="text-xs text-gray-500 mt-1">Share this password with the employee</p>
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Organization</label>
              <input className="input" value={form.organization}
                onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Save Employee</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Assign modules */}
      <div className="card border-gray-700">
        <h3 className="font-semibold text-white mb-1">📋 Assign Training Modules</h3>
        <p className="text-gray-400 text-sm mb-4">
          Select employees and modules. They will see these when they login to the employee portal.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Employees */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="label mb-0">Employees ({selectedEmps.length} selected)</label>
              {employees.length > 0 && (
                <button onClick={() => setSelectedEmps(selectedEmps.length === employees.length ? [] : employees.map(e => e.id))}
                  className="text-xs text-blue-400 hover:text-blue-300">
                  {selectedEmps.length === employees.length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
            <div className="bg-gray-800 rounded-lg border border-gray-700 max-h-56 overflow-y-auto">
              {employees.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 text-center">No employees yet</p>
              ) : employees.map(emp => (
                <label key={emp.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0">
                  <input type="checkbox" checked={selectedEmps.includes(emp.id)}
                    onChange={() => toggle(emp.id, selectedEmps, setSelectedEmps)}
                    className="accent-blue-600 w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate">{emp.full_name}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </div>
                  <div className="text-right shrink-0 text-xs text-gray-500">
                    {emp.assigned_modules} assigned · {emp.completed_modules} done
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="label mb-0">Modules ({selectedMods.length} selected)</label>
              {modules.length > 0 && (
                <button onClick={() => setSelectedMods(selectedMods.length === modules.length ? [] : modules.map(m => m.id))}
                  className="text-xs text-blue-400 hover:text-blue-300">
                  {selectedMods.length === modules.length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
            <div className="bg-gray-800 rounded-lg border border-gray-700 max-h-56 overflow-y-auto">
              {modules.map(mod => (
                <label key={mod.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0">
                  <input type="checkbox" checked={selectedMods.includes(mod.id)}
                    onChange={() => toggle(mod.id, selectedMods, setSelectedMods)}
                    className="accent-blue-600 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{mod.title}</p>
                    <p className="text-xs text-gray-500">
                      {mod.category === 'mandatory' ? '🔴' : mod.category === 'nepal_compliance' ? '🟡' : '🟢'} {mod.category} · {mod.content_type === 'pdf' ? '📄' : '🎥'} {mod.content_type}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleAssign}
            disabled={assigning || !selectedEmps.length || !selectedMods.length}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {assigning ? 'Assigning...' :
              `📋 Assign ${selectedMods.length} Module${selectedMods.length !== 1 ? 's' : ''} to ${selectedEmps.length} Employee${selectedEmps.length !== 1 ? 's' : ''}`}
          </button>
          {(!selectedEmps.length || !selectedMods.length) && (
            <p className="text-xs text-gray-500">Select employees and modules first</p>
          )}
        </div>

        {assignResult.length > 0 && (
          <div className="mt-4 p-3 bg-green-600/10 border border-green-600/30 rounded-lg">
            <p className="text-sm font-medium text-green-400">
              ✓ {assignResult.length} assignments created
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tell employees to login at: <span className="text-blue-400">{portalUrl}</span>
            </p>
          </div>
        )}
      </div>

      {/* Employee table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="font-semibold text-white">All Employees</h3>
          <span className="text-xs text-gray-500">{employees.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr>
                {['Name', 'Email', 'Department', 'Assigned', 'Completed', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {employees.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">No employees yet</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-200">{emp.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{emp.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{emp.department || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 text-center">{emp.assigned_modules}</td>
                  <td className="px-6 py-4 text-sm text-green-400 text-center">{emp.completed_modules}</td>
                  <td className="px-6 py-4"><Badge variant={emp.is_active ? 'active' : 'inactive'} /></td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(emp.id)}
                      className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}