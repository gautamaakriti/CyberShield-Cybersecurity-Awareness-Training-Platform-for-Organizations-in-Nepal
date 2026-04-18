import { useState, useEffect, useRef } from 'react'
import { phishingApi } from '../../api/client'

interface InboxItem {
  assignment_id: number; sender_name: string; sender_email_display: string
  subject: string; preview: string; is_opened: boolean
  result_status: string; created_at: string
}
interface EmailDetail {
  assignment_id: number; sender_name: string; sender_email_display: string
  subject: string; message_body: string; cta_text: string; email_type: string
  is_opened: boolean; is_clicked: boolean; is_reported_phishing: boolean
  is_reported_spam: boolean; result_status: string
}
interface MyResult {
  score: number; feedback: string[]; result_status: string
  is_clicked: boolean; is_reported_phishing: boolean; is_reported_spam: boolean
  email_type: string; subject: string
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-700 text-gray-400',
  opened: 'bg-blue-600/20 text-blue-400',
  clicked: 'bg-red-600/20 text-red-400',
  reported_phishing: 'bg-green-600/20 text-green-400',
  reported_spam: 'bg-green-600/20 text-green-400',
  ignored: 'bg-yellow-600/20 text-yellow-400',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', opened: 'Opened', clicked: 'Clicked ⚠',
  reported_phishing: 'Reported ✓', reported_spam: 'Spam Report ✓', ignored: 'Ignored',
}

export default function PhishingInbox() {
  const storedId = localStorage.getItem('employee_id')
  const employeeId = storedId ? parseInt(storedId) : 0

  const [inbox, setInbox] = useState<InboxItem[]>([])
  const [selected, setSelected] = useState<EmailDetail | null>(null)
  const [result, setResult] = useState<MyResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'warning' | 'info'>('info')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadInbox() }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadInbox = () => {
    setLoading(true)
    phishingApi.getInbox(employeeId)
      .then(r => setInbox(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const showToast = (msg: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 4000)
  }

  const openEmail = async (item: InboxItem) => {
    setShowResult(false)
    setResult(null)
    setMenuOpen(false)
    try {
      const detail = await phishingApi.getEmail(item.assignment_id, employeeId)
      setSelected(detail.data)
      if (!item.is_opened) {
        await phishingApi.markOpened(item.assignment_id, employeeId)
        setInbox(prev => prev.map(i =>
          i.assignment_id === item.assignment_id
            ? { ...i, is_opened: true, result_status: 'opened' } : i
        ))
      }
    } catch { showToast('Failed to load email.', 'warning') }
  }

  const handleCTAClick = async () => {
    if (!selected || selected.is_clicked) return
    setActionLoading(true)
    try {
      await phishingApi.markClicked(selected.assignment_id, employeeId)
      setSelected(prev => prev ? { ...prev, is_clicked: true, result_status: 'clicked' } : prev)
      setInbox(prev => prev.map(i =>
        i.assignment_id === selected.assignment_id ? { ...i, result_status: 'clicked' } : i
      ))
      showToast('You clicked the link! In a real attack, this could compromise your account.', 'warning')
      // auto-show result after 2 seconds
      setTimeout(() => loadAndShowResult(selected.assignment_id), 1500)
    } catch { showToast('Action failed.', 'warning') }
    finally { setActionLoading(false) }
  }

  const handleReport = async (type: 'phishing' | 'spam') => {
    if (!selected) return
    setMenuOpen(false)
    setActionLoading(true)
    try {
      if (type === 'phishing') {
        await phishingApi.reportPhishing(selected.assignment_id, employeeId)
        setSelected(prev => prev ? { ...prev, is_reported_phishing: true, result_status: 'reported_phishing' } : prev)
        setInbox(prev => prev.map(i =>
          i.assignment_id === selected.assignment_id ? { ...i, result_status: 'reported_phishing' } : i
        ))
        showToast('Great job! Reported as phishing. You protected your organization.', 'success')
      } else {
        await phishingApi.reportSpam(selected.assignment_id, employeeId)
        setSelected(prev => prev ? { ...prev, is_reported_spam: true, result_status: 'reported_spam' } : prev)
        setInbox(prev => prev.map(i =>
          i.assignment_id === selected.assignment_id ? { ...i, result_status: 'reported_spam' } : i
        ))
        showToast('Reported as spam.', 'success')
      }
      setTimeout(() => loadAndShowResult(selected.assignment_id), 1500)
    } catch { showToast('Action failed.', 'warning') }
    finally { setActionLoading(false) }
  }

  const loadAndShowResult = async (assignmentId: number) => {
    try {
      const r = await phishingApi.getMyResult(assignmentId, employeeId)
      setResult(r.data)
      setShowResult(true)
    } catch {}
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const unreadCount = inbox.filter(i => !i.is_opened).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border max-w-sm ${
          toastType === 'success' ? 'bg-green-900/90 border-green-600/40 text-green-300' :
          toastType === 'warning' ? 'bg-red-900/90 border-red-600/40 text-red-300' :
          'bg-gray-900 border-gray-700 text-gray-300'
        }`}>{toast}</div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">📬 Phishing Inbox</h1>
          <p className="text-gray-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread email${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            {' · '}Interact with emails to test your phishing awareness
          </p>
        </div>

        <div className={`grid gap-4 ${selected ? 'grid-cols-[360px_1fr]' : 'grid-cols-1'}`}>

          {/* ── INBOX LIST ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Inbox ({inbox.length})
              </span>
              <button onClick={loadInbox} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">↻</button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-500 text-sm">
                <Spinner /> Loading...
              </div>
            ) : inbox.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-gray-500 text-sm">No emails yet.</p>
                <p className="text-gray-600 text-xs mt-1">Your admin will send phishing simulations here.</p>
              </div>
            ) : (
              inbox.map((item, i) => (
                <div
                  key={item.assignment_id}
                  onClick={() => openEmail(item)}
                  className={`px-4 py-3.5 cursor-pointer transition-colors border-b border-gray-800/50 last:border-0 ${
                    selected?.assignment_id === item.assignment_id
                      ? 'bg-blue-600/10 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {!item.is_opened && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                    <span className={`text-sm flex-1 truncate ${item.is_opened ? 'text-gray-400 font-normal' : 'text-white font-semibold'}`}>
                      {item.sender_name}
                    </span>
                    <span className="text-xs text-gray-600 shrink-0">{formatDate(item.created_at)}</span>
                  </div>
                  <p className={`text-sm truncate mb-1 ${item.is_opened ? 'text-gray-500' : 'text-gray-300 font-medium'}`}>
                    {item.subject}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-600 truncate flex-1">{item.preview}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${STATUS_COLORS[item.result_status] || STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[item.result_status] || 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── EMAIL DETAIL ── */}
          {selected && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">

              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-gray-900/80 sticky top-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setSelected(null); setShowResult(false) }}
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >← Back</button>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.result_status] || STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[selected.result_status] || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Quick action buttons */}
                  {!selected.is_reported_phishing && !selected.is_reported_spam && (
                    <>
                      <button
                        onClick={() => handleReport('phishing')}
                        disabled={actionLoading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-orange-600/10 text-orange-400 border border-orange-600/20 hover:bg-orange-600/20 transition-colors disabled:opacity-50"
                      >
                        🚨 Report Phishing
                      </button>
                      <button
                        onClick={() => handleReport('spam')}
                        disabled={actionLoading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
                      >
                        🗑 Spam
                      </button>
                    </>
                  )}
                  {(selected.is_reported_phishing || selected.is_reported_spam || selected.is_clicked) && (
                    <button
                      onClick={() => loadAndShowResult(selected.assignment_id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-600/20 hover:bg-blue-600/20 transition-colors"
                    >
                      📊 View My Score
                    </button>
                  )}
                </div>
              </div>

              {/* Result panel */}
              {showResult && result && (
                <div className={`mx-5 mt-5 rounded-xl p-5 border ${
                  result.score === 100 ? 'bg-green-900/20 border-green-600/30' :
                  result.score >= 60 ? 'bg-blue-900/20 border-blue-600/30' :
                  'bg-red-900/20 border-red-600/30'
                }`}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`text-4xl font-bold ${
                      result.score === 100 ? 'text-green-400' :
                      result.score >= 60 ? 'text-blue-400' : 'text-red-400'
                    }`}>{result.score}%</div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {result.score === 100 ? '🛡️ Excellent awareness!' :
                         result.score >= 60 ? '👍 Good, but could be better' :
                         '⚠️ You fell for it'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Awareness Score</p>
                    </div>
                    {/* Score arc */}
                    <div className="ml-auto">
                      <svg width="56" height="56" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#374151" strokeWidth="5" />
                        <circle cx="28" cy="28" r="22" fill="none"
                          stroke={result.score === 100 ? '#22c55e' : result.score >= 60 ? '#3b82f6' : '#ef4444'}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${(result.score / 100) * 138} 138`}
                          transform="rotate(-90 28 28)" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {result.feedback.map((f, i) => (
                      <p key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0">{i === 0 ? '→' : '•'}</span>{f}
                      </p>
                    ))}
                  </div>
                  <button onClick={() => setShowResult(false)} className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    Hide result
                  </button>
                </div>
              )}

              {/* Sender info */}
              <div className="px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {selected.sender_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{selected.sender_name}</p>
                    <p className="text-xs text-gray-500">&lt;{selected.sender_email_display}&gt;</p>
                  </div>
                  {selected.email_type === 'phishing' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/10 text-red-400 border border-red-600/20 shrink-0">
                      Simulation
                    </span>
                  )}
                </div>
                <p className="text-base font-semibold text-white mt-3">{selected.subject}</p>
              </div>

              {/* Body */}
              <div className="px-5 py-5 flex-1">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">
                  {selected.message_body}
                </p>

                {selected.cta_text && (
                  <div>
                    <button
                      onClick={handleCTAClick}
                      disabled={selected.is_clicked || actionLoading}
                      className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selected.is_clicked
                          ? 'bg-gray-800 text-gray-500 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                      } disabled:opacity-70 flex items-center gap-2`}
                    >
                      {actionLoading ? <><Spinner /> Processing...</> :
                       selected.is_clicked ? `${selected.cta_text} (clicked)` : selected.cta_text}
                    </button>
                    {!selected.is_clicked && (
                      <p className="text-xs text-gray-600 mt-2">
                        💡 Tip: Think before you click. Check the sender email carefully.
                      </p>
                    )}
                    {selected.is_clicked && (
                      <p className="text-xs text-red-400 mt-2">
                        ⚠️ You clicked this link. In a real attack, your credentials could have been stolen.
                      </p>
                    )}
                  </div>
                )}

                {(selected.is_reported_phishing || selected.is_reported_spam) && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-600/30 rounded-xl">
                    <p className="text-sm font-medium text-green-400">
                      {selected.is_reported_phishing ? '🛡️ You reported this as phishing — great catch!' : '✓ You reported this as spam.'}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Reporting suspicious emails helps protect your entire organization.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}