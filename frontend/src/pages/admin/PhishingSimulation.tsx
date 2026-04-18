import { useState, useEffect, useCallback } from 'react'
import { employeesApi, phishingApi } from '../../api/client'

interface Employee { id: number; full_name: string; email: string; department?: string }
interface GeneratedContent {
  sender_name: string; sender_email_display: string
  subject: string; message_body: string; cta_text: string
}
interface Campaign {
  id: number; title: string; email_type: string; template_type: string
  difficulty: string; subject: string; sender_name: string
  sender_email_display: string; message_body: string; cta_text?: string
  created_at: string; total_assigned: number; total_opened: number
  total_clicked: number; total_reported: number
  open_rate: number; click_rate: number; report_rate: number
  employees: { id: number; full_name: string; email: string }[]
}
interface DashboardRow {
  assignment_id: number; employee_name: string; employee_email: string
  campaign_id: number; campaign_title: string; email_subject: string
  email_type: string; difficulty: string; is_opened: boolean
  is_clicked: boolean; is_reported_phishing: boolean; is_reported_spam: boolean
  result_status: string; created_at: string
}
interface Stats {
  total_campaigns: number; total_assigned: number; total_opened: number
  total_clicked: number; total_reported_phishing: number
  total_reported_spam: number; total_ignored: number
}
interface EmployeeScore {
  name: string; email: string; total: number
  clicked: number; reported: number; score: number; risk: string
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', desc: 'Obviously suspicious', color: 'text-green-400', border: 'border-green-500', bg: 'bg-green-600/10' },
  { value: 'medium', label: 'Medium', desc: 'Realistic looking', color: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-600/10' },
  { value: 'hard', label: 'Hard', desc: 'Very convincing', color: 'text-red-400', border: 'border-red-500', bg: 'bg-red-600/10' },
]
const TEMPLATE_OPTIONS = [
  { value: 'password_reset', label: 'Password Reset', icon: '🔐' },
  { value: 'hr_notice', label: 'HR Notice', icon: '👥' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'it_alert', label: 'IT Alert', icon: '🖥️' },
]
const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-gray-700/60 text-gray-400' },
  opened: { label: 'Opened', cls: 'bg-blue-600/20 text-blue-400' },
  clicked: { label: 'Clicked ⚠', cls: 'bg-red-600/20 text-red-400' },
  reported_phishing: { label: 'Reported ✓', cls: 'bg-green-600/20 text-green-400' },
  reported_spam: { label: 'Spam Report ✓', cls: 'bg-green-600/20 text-green-400' },
  ignored: { label: 'Ignored', cls: 'bg-yellow-600/20 text-yellow-400' },
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function StatCard({ icon, label, value, sub, barValue, barColor }: {
  icon: string; label: string; value: string | number
  sub?: string; barValue?: number; barColor?: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
      {barValue !== undefined && barColor && (
        <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${Math.min(barValue, 100)}%` }} />
        </div>
      )}
    </div>
  )
}

function CampaignModal({ campaign, onClose, onDelete }: {
  campaign: Campaign; onClose: () => void; onDelete: (id: number) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <div>
            <h2 className="text-base font-bold text-white">{campaign.title}</h2>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${campaign.email_type === 'phishing' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                {campaign.email_type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${campaign.difficulty === 'hard' ? 'bg-red-900/40 text-red-400' : campaign.difficulty === 'medium' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-green-900/40 text-green-400'}`}>
                {campaign.difficulty}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Open Rate', value: `${campaign.open_rate}%`, color: 'text-blue-400', bar: campaign.open_rate, barC: 'bg-blue-500' },
              { label: 'Click Rate', value: `${campaign.click_rate}%`, color: 'text-red-400', bar: campaign.click_rate, barC: 'bg-red-500' },
              { label: 'Report Rate', value: `${campaign.report_rate}%`, color: 'text-green-400', bar: campaign.report_rate, barC: 'bg-green-500' },
            ].map(s => (
              <div key={s.label} className="bg-gray-800/50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <div className="mt-2 bg-gray-700 rounded-full h-1">
                  <div className={`h-1 rounded-full ${s.barC}`} style={{ width: `${Math.min(s.bar, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="border border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 text-xs text-gray-400">Email Preview</div>
            <div className="p-4 bg-gray-950">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-800">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {campaign.sender_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{campaign.sender_name}</p>
                  <p className="text-xs text-gray-500">&lt;{campaign.sender_email_display}&gt;</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-white mb-2">{campaign.subject}</p>
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{campaign.message_body}</p>
              {campaign.cta_text && (
                <div className="mt-3">
                  <span className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg">{campaign.cta_text}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Assigned Employees ({campaign.employees.length})</p>
            {campaign.employees.length === 0 ? (
              <p className="text-sm text-gray-600">No employees assigned.</p>
            ) : (
              <div className="border border-gray-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {campaign.employees.map((emp, i) => (
                  <div key={emp.id} className={`flex items-center gap-3 px-4 py-3 ${i < campaign.employees.length - 1 ? 'border-b border-gray-800' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-200 shrink-0">
                      {emp.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white">{emp.full_name}</p>
                      <p className="text-xs text-gray-500">{emp.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { onDelete(campaign.id); onClose() }}
            className="w-full py-2.5 rounded-xl border border-red-600/40 text-red-400 text-sm font-medium hover:bg-red-600/10 transition-colors"
          >
            🗑 Delete Campaign
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PhishingSimulation() {
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard')
  const [step, setStep] = useState(1)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [table, setTable] = useState<DashboardRow[]>([])
  const [employeeScores, setEmployeeScores] = useState<EmployeeScore[]>([])

  const [title, setTitle] = useState('')
  const [emailType, setEmailType] = useState('phishing')
  const [templateType, setTemplateType] = useState('password_reset')
  const [difficulty, setDifficulty] = useState('medium')
  const [content, setContentState] = useState<GeneratedContent>({
    sender_name: '', sender_email_display: '', subject: '', message_body: '', cta_text: ''
  })
  const [isAIGenerated, setIsAIGenerated] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])

  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [empSearch, setEmpSearch] = useState('')

  // FIX: Track employee load error separately so the UI can show a useful message
  const [empLoadError, setEmpLoadError] = useState<string | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 4000)
  }

  const patchContent = (patch: Partial<GeneratedContent>) =>
    setContentState(prev => ({ ...prev, ...patch }))

  // FIX: loadAll now logs errors properly instead of swallowing them silently
  const loadAll = useCallback(async () => {
    setEmpLoadError(null)
    try {
      const [dashRes, campRes] = await Promise.all([
        phishingApi.dashboard(),
        phishingApi.list(),
      ])
      setStats(dashRes.data.stats)
      setTable(dashRes.data.table)
      setEmployeeScores(dashRes.data.employee_scores || [])
      setCampaigns(campRes.data)
    } catch (e: any) {
      // FIX: Log the real error so you can see what's actually failing
      console.error('Dashboard/campaigns load failed:', e?.response?.data || e?.message || e)
      showToast(`Failed to load dashboard: ${e?.response?.data?.detail || e?.message || 'Check console'}`, 'error')
    }

    // FIX: Load employees separately so a dashboard error doesn't block the employee list
    try {
      const empRes = await employeesApi.list()
      setEmployees(empRes.data)
    } catch (e: any) {
      console.error('Employee list load failed:', e?.response?.status, e?.response?.data || e?.message || e)
      const detail = e?.response?.data?.detail || e?.message || 'unknown error'
      const status = e?.response?.status
      // FIX: Give a specific error message for auth failures
      if (status === 401 || status === 403) {
        setEmpLoadError('Not authorised — make sure you are logged in as admin.')
      } else {
        setEmpLoadError(`Could not load employees: ${detail}`)
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const r = await phishingApi.generateContent({ email_type: emailType, template_type: templateType, difficulty })
      setContentState(r.data)
      setIsAIGenerated(true)
      showToast('Email content generated!')
    } catch (e: any) {
      const detail = e?.response?.data?.detail || e?.message || 'Unknown error'
      showToast(`Generation failed: ${detail}`, 'error')
    } finally { setIsGenerating(false) }
  }

  const toggleEmployee = (id: number) =>
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleCreate = async () => {
    if (!content.subject.trim() || !content.message_body.trim())
      return showToast('Fill in subject and message body.', 'error')
    if (selectedEmployees.length === 0)
      return showToast('Select at least one employee.', 'error')
    setIsCreating(true)
    try {
      await phishingApi.create({
        title, email_type: emailType, template_type: templateType,
        difficulty, ...content, employee_ids: selectedEmployees,
      })
      showToast(`Campaign "${title}" launched to ${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''}!`)
      setTitle(''); setEmailType('phishing'); setTemplateType('password_reset')
      setDifficulty('medium'); setIsAIGenerated(false)
      setContentState({ sender_name: '', sender_email_display: '', subject: '', message_body: '', cta_text: '' })
      setSelectedEmployees([]); setStep(1); setView('dashboard')
      loadAll()
    } catch (e: any) {
      console.error('Campaign create failed:', e?.response?.data || e?.message || e)
      showToast(`Failed to create campaign: ${e?.response?.data?.detail || e?.message || 'Check console'}`, 'error')
    } finally { setIsCreating(false) }
  }

  // FIX: was calling (phishingApi as any).deleteCampaign — now correctly typed
  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await phishingApi.deleteCampaign(id)
      showToast('Campaign deleted.')
      loadAll()
    } catch (e: any) {
      console.error('Delete campaign failed:', e?.response?.data || e?.message || e)
      showToast('Failed to delete campaign.', 'error')
    } finally { setDeletingId(null) }
  }

  const openRate = stats && stats.total_assigned > 0 ? Math.round(stats.total_opened / stats.total_assigned * 100) : 0
  const clickRate = stats && stats.total_assigned > 0 ? Math.round(stats.total_clicked / stats.total_assigned * 100) : 0
  const reportRate = stats && stats.total_assigned > 0
    ? Math.round((stats.total_reported_phishing + stats.total_reported_spam) / stats.total_assigned * 100) : 0

  const formatDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const filteredEmployees = employees.filter(e =>
    e.full_name.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.email.toLowerCase().includes(empSearch.toLowerCase())
  )

  const steps = ['Setup', 'Email Content', 'Preview', 'Assign & Launch']
  const StepBar = () => (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => {
        const n = i + 1; const active = step === n; const done = step > n
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-white font-medium' : done ? 'text-green-400' : 'text-gray-600'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 mb-4 ${step > n ? 'bg-green-500' : 'bg-gray-800'}`} />}
          </div>
        )
      })}
    </div>
  )

  // ── CREATE VIEW ──────────────────────────────────────────────────────────────
  if (view === 'create') return (
    <div className="min-h-screen bg-gray-950 text-white">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${toastType === 'success' ? 'bg-green-900/80 border-green-600/40 text-green-300' : 'bg-red-900/80 border-red-600/40 text-red-300'}`}>
          {toast}
        </div>
      )}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => { setView('dashboard'); setStep(1) }}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Create Phishing Campaign</h1>
            <p className="text-gray-500 text-xs">Simulate a phishing email and assign it to employees</p>
          </div>
        </div>
        <StepBar />

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Campaign Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Q1 Password Reset Drill"
                className="input w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium">Email Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'phishing', label: '🎣 Phishing', desc: 'Tests if employees fall for it' },
                  { value: 'genuine', label: '✉️ Genuine', desc: 'Looks like a real company email' },
                ].map(o => (
                  <button key={o.value} onClick={() => setEmailType(o.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${emailType === o.value ? 'border-blue-500 bg-blue-600/10' : 'border-gray-800 bg-gray-800/40 hover:border-gray-700'}`}>
                    <p className={`text-sm font-semibold ${emailType === o.value ? 'text-blue-400' : 'text-white'}`}>{o.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setDifficulty(o.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${difficulty === o.value ? `${o.border} ${o.bg} ${o.color}` : 'border-gray-800 bg-gray-800/40 text-gray-400 hover:border-gray-700'}`}>
                    <p className="text-sm font-semibold">{o.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium">Template Type</label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setTemplateType(o.value)}
                    className={`px-4 py-3 rounded-xl border text-left flex items-center gap-3 transition-all ${templateType === o.value ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-gray-800 bg-gray-800/40 text-gray-300 hover:border-gray-700 hover:text-white'}`}>
                    <span className="text-lg">{o.icon}</span>
                    <span className="text-sm font-medium">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { if (!title.trim()) return showToast('Enter a campaign title.', 'error'); setStep(2) }}
              className="btn-primary w-full py-3 font-semibold">
              Next: Email Content →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/30 border border-purple-700/40 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">✨ AI Email Generator</p>
                  <p className="text-xs text-gray-400 mt-1">Auto-generate a realistic {emailType} email. Fully editable after.</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[
                      emailType === 'phishing' ? '🎣 Phishing' : '✉️ Genuine',
                      TEMPLATE_OPTIONS.find(o => o.value === templateType)?.label ?? '',
                      `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty`,
                    ].map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 border border-gray-700">{tag}</span>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={isGenerating}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0">
                  {isGenerating ? <><Spinner /> Generating...</> : '✦ Generate'}
                </button>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Email Content</h2>
                {isAIGenerated && <span className="text-xs text-purple-400">✦ AI generated — editable</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Sender Name</label>
                  <input value={content.sender_name} onChange={e => patchContent({ sender_name: e.target.value })}
                    placeholder="IT Security Team" className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Sender Email</label>
                  <input value={content.sender_email_display} onChange={e => patchContent({ sender_email_display: e.target.value })}
                    placeholder="security@company.com" className="input w-full" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Subject *</label>
                <input value={content.subject} onChange={e => patchContent({ subject: e.target.value })}
                  placeholder="Urgent: Your account has been compromised" className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Message Body *</label>
                <textarea value={content.message_body} onChange={e => patchContent({ message_body: e.target.value })}
                  placeholder="Write your simulated email body here..." rows={8}
                  className="input w-full resize-none text-sm leading-relaxed" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">CTA Button Text</label>
                <input value={content.cta_text} onChange={e => patchContent({ cta_text: e.target.value })}
                  placeholder="Reset Password, Verify Now, Click Here" className="input w-full" />
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white text-sm transition-colors">← Back</button>
              <button onClick={() => {
                if (!content.subject.trim() || !content.message_body.trim())
                  return showToast('Fill in subject and message body first.', 'error')
                setStep(3)
              }} className="btn-primary px-6 py-2.5 text-sm font-semibold">Next: Preview →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="bg-gray-800 px-5 py-3 border-b border-gray-700 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-400 flex-1 text-center">Email Preview</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emailType === 'phishing' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                  {emailType === 'phishing' ? '🎣 Phishing simulation' : '✉️ Genuine'}
                </span>
              </div>
              <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {content.sender_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{content.sender_name || 'Sender Name'}</p>
                    <p className="text-xs text-gray-500">&lt;{content.sender_email_display || 'sender@example.com'}&gt;</p>
                  </div>
                </div>
                <p className="text-base font-semibold text-white">{content.subject || 'No subject'}</p>
              </div>
              <div className="px-6 py-5 bg-gray-950">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{content.message_body || 'No message body.'}</p>
                {content.cta_text && (
                  <div className="mt-5">
                    <span className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-default">{content.cta_text}</span>
                    <p className="text-xs text-gray-600 mt-2">↑ This button is tracked when clicked</p>
                  </div>
                )}
              </div>
              {emailType === 'phishing' && (
                <div className="px-6 py-4 bg-red-950/30 border-t border-red-900/30">
                  <p className="text-xs font-semibold text-red-400 mb-2">🚩 Admin view — Red flags in this email</p>
                  <ul className="space-y-1">
                    {[
                      difficulty === 'easy' ? 'Overly urgent language designed to panic the reader' : null,
                      content.cta_text ? `Suspicious CTA button: "${content.cta_text}"` : null,
                      content.sender_email_display?.includes('gmail') || content.sender_email_display?.includes('yahoo') ? 'Sender uses a personal email domain' : null,
                      'Requests immediate action without identity verification',
                    ].filter(Boolean).map((flag, i) => (
                      <li key={i} className="text-xs text-red-300 flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5">•</span>{flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white text-sm transition-colors">← Edit Content</button>
              <button onClick={() => setStep(4)} className="btn-primary px-6 py-2.5 text-sm font-semibold">Next: Assign Employees →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Assign & Launch */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Campaign Summary</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Title', value: title, cls: 'text-white' },
                  { label: 'Type', value: emailType === 'phishing' ? '🎣 Phishing' : '✉️ Genuine', cls: emailType === 'phishing' ? 'text-red-400' : 'text-blue-400' },
                  { label: 'Difficulty', value: difficulty, cls: difficulty === 'hard' ? 'text-red-400' : difficulty === 'medium' ? 'text-yellow-400' : 'text-green-400' },
                  { label: 'Template', value: TEMPLATE_OPTIONS.find(o => o.value === templateType)?.label ?? '', cls: 'text-white' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">{item.label}</p>
                    <p className={`font-medium mt-0.5 capitalize truncate ${item.cls}`}>{item.value}</p>
                  </div>
                ))}
                <div className="bg-gray-800/50 rounded-lg p-3 col-span-2">
                  <p className="text-gray-500 text-xs">Subject</p>
                  <p className="text-white font-medium mt-0.5 truncate">{content.subject}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">Select Employees</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {/* FIX: Show error if employees failed to load instead of generic "no employees" */}
                    {empLoadError
                      ? <span className="text-red-400">{empLoadError}</span>
                      : employees.length === 0
                        ? 'No employees found — add employees first from the Employees page'
                        : `${selectedEmployees.length} of ${employees.length} selected`}
                  </p>
                </div>
                {employees.length > 0 && (
                  <button
                    onClick={() => setSelectedEmployees(
                      selectedEmployees.length === employees.length ? [] : employees.map(e => e.id)
                    )}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {selectedEmployees.length === employees.length ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>

              {employees.length > 0 && (
                <input
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="input w-full mb-3 text-sm"
                />
              )}

              <div className="border border-gray-800 rounded-xl max-h-60 overflow-y-auto">
                {empLoadError ? (
                  // FIX: Show actionable error message instead of misleading "no employees found"
                  <div className="py-10 text-center">
                    <p className="text-red-400 text-sm">Failed to load employees</p>
                    <p className="text-gray-600 text-xs mt-1">{empLoadError}</p>
                    <button
                      onClick={loadAll}
                      className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-500 text-sm">No employees found.</p>
                    <p className="text-gray-600 text-xs mt-1">Go to the Employees page to add employees first.</p>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-6">No employees match your search.</p>
                ) : filteredEmployees.map((emp, i) => (
                  <label
                    key={emp.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-800 ${i < filteredEmployees.length - 1 ? 'border-b border-gray-800' : ''} ${selectedEmployees.includes(emp.id) ? 'bg-blue-600/10' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="rounded"
                    />
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-200 shrink-0">
                      {emp.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{emp.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{emp.email}{emp.department ? ` · ${emp.department}` : ''}</p>
                    </div>
                    {selectedEmployees.includes(emp.id) && <span className="text-blue-400 text-xs">✓</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="text-gray-400 hover:text-white text-sm transition-colors">← Back</button>
              <button
                onClick={handleCreate}
                disabled={isCreating || selectedEmployees.length === 0}
                className="btn-primary px-8 py-3 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {isCreating
                  ? <><Spinner /> Launching...</>
                  : `🚀 Launch to ${selectedEmployees.length} employee${selectedEmployees.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── DASHBOARD VIEW ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${toastType === 'success' ? 'bg-green-900/80 border-green-600/40 text-green-300' : 'bg-red-900/80 border-red-600/40 text-red-300'}`}>
          {toast}
        </div>
      )}

      {selectedCampaign && (
        <CampaignModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} onDelete={handleDelete} />
      )}

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Phishing Simulation</h1>
            <p className="text-gray-400 text-sm mt-1">Test and track employee awareness against phishing attacks.</p>
          </div>
          <button
            onClick={() => { setView('create'); setStep(1) }}
            className="btn-primary px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shrink-0"
          >
            + Create Campaign
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <Spinner /><span className="text-sm">Loading dashboard...</span>
            </div>
          </div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="📁" label="Total Campaigns" value={stats.total_campaigns} sub="campaigns created" />
                <StatCard icon="📨" label="Emails Sent" value={stats.total_assigned} sub="total assignments" />
                <StatCard icon="📬" label="Open Rate" value={`${openRate}%`} sub={`${stats.total_opened} opened`} barValue={openRate} barColor="bg-blue-500" />
                <StatCard icon="⚠️" label="Click Rate" value={`${clickRate}%`} sub={`${stats.total_clicked} clicked`} barValue={clickRate} barColor="bg-red-500" />
                <StatCard icon="🛡️" label="Report Rate" value={`${reportRate}%`} sub={`${stats.total_reported_phishing + stats.total_reported_spam} reported`} barValue={reportRate} barColor="bg-green-500" />
                <StatCard icon="🚨" label="Phishing Reports" value={stats.total_reported_phishing} sub="correctly identified" />
                <StatCard icon="🗑️" label="Spam Reports" value={stats.total_reported_spam} sub="marked as spam" />
                <StatCard icon="👻" label="Ignored" value={stats.total_ignored} sub="no interaction" />
              </div>
            )}

            {employeeScores.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Employee Awareness Scores</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Risk level per employee based on simulation results</p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    {[
                      { label: 'Low Risk', cls: 'text-green-400', count: employeeScores.filter(e => e.risk === 'low').length },
                      { label: 'Medium', cls: 'text-yellow-400', count: employeeScores.filter(e => e.risk === 'medium').length },
                      { label: 'High Risk', cls: 'text-red-400', count: employeeScores.filter(e => e.risk === 'high').length },
                    ].map(r => (
                      <div key={r.label} className="text-center">
                        <p className={`font-bold text-base ${r.cls}`}>{r.count}</p>
                        <p className="text-gray-600">{r.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {employeeScores.map(emp => (
                    <div key={emp.email} className="flex items-center gap-4 py-2 border-b border-gray-800/50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-200 shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                        <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{emp.total} emails</span>
                        <span className={emp.clicked > 0 ? 'text-red-400' : ''}>{emp.clicked} clicked</span>
                        <span className={emp.reported > 0 ? 'text-green-400' : ''}>{emp.reported} reported</span>
                      </div>
                      <div className="w-24 text-right">
                        <span className={`text-sm font-bold ${emp.score >= 70 ? 'text-green-400' : emp.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {emp.score}%
                        </span>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${emp.risk === 'high' ? 'bg-red-600/20 text-red-400' : emp.risk === 'medium' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-green-600/20 text-green-400'}`}>
                          {emp.risk}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">All Campaigns</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{campaigns.length} total campaigns</p>
                </div>
              </div>
              {campaigns.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-5xl mb-4">🎣</p>
                  <p className="text-gray-300 font-semibold">No campaigns yet</p>
                  <p className="text-gray-600 text-sm mt-1 mb-4">Create your first campaign to start testing employee awareness.</p>
                  <button onClick={() => { setView('create'); setStep(1) }} className="btn-primary px-5 py-2 text-sm">+ Create Campaign</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {['Campaign', 'Type', 'Difficulty', 'Assigned', 'Open', 'Click', 'Report', 'Date', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map(c => (
                        <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-white">{c.title}</p>
                            <p className="text-xs text-gray-500 truncate max-w-36">{c.subject}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.email_type === 'phishing' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                              {c.email_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs capitalize font-medium ${c.difficulty === 'hard' ? 'text-red-400' : c.difficulty === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                              {c.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{c.total_assigned}</td>
                          <td className="px-4 py-3"><span className="text-blue-400 text-xs font-medium">{c.open_rate}%</span></td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${c.click_rate > 30 ? 'text-red-400' : 'text-gray-400'}`}>{c.click_rate}%</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${c.report_rate > 50 ? 'text-green-400' : 'text-gray-400'}`}>{c.report_rate}%</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDate(c.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSelectedCampaign(c)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                                View
                              </button>
                              <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors disabled:opacity-50">
                                {deletingId === c.id ? '...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {table.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800">
                  <h3 className="text-sm font-semibold text-white">All Assignment Results</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{table.length} total employee assignments</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {['Employee', 'Campaign', 'Type', 'Difficulty', 'Opened', 'Clicked', 'Reported', 'Status', 'Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.map(row => {
                        const s = STATUS_META[row.result_status] || STATUS_META.pending
                        const isReported = row.is_reported_phishing || row.is_reported_spam
                        return (
                          <tr key={row.assignment_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-white whitespace-nowrap">{row.employee_name}</p>
                              <p className="text-xs text-gray-600">{row.employee_email}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 max-w-32 truncate">{row.campaign_title}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.email_type === 'phishing' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                                {row.email_type}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs capitalize font-medium ${row.difficulty === 'hard' ? 'text-red-400' : row.difficulty === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                                {row.difficulty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={row.is_opened ? 'text-blue-400' : 'text-gray-700'}>{row.is_opened ? '✓' : '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={row.is_clicked ? 'text-red-400 font-bold' : 'text-gray-700'}>{row.is_clicked ? '✓' : '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={isReported ? 'text-green-400 font-bold' : 'text-gray-700'}>{isReported ? '✓' : '—'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDate(row.created_at)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}