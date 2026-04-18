import { useState, useEffect, useRef } from 'react'
import { phishingApi } from '../../api/client'

interface InboxItem {
  assignment_id: number; sender_name: string; sender_email_display: string
  subject: string; preview: string; is_opened: boolean
  result_status: string; created_at: string
}
interface EmailDetail {
  assignment_id: number; sender_name: string; sender_email_display: string
  subject: string; message_body: string; cta_text: string
  is_opened: boolean; is_clicked: boolean; is_reported_phishing: boolean
  is_reported_spam: boolean; result_status: string
}

export default function PhishingInbox() {
  const storedId = localStorage.getItem('employee_id')
  const employeeId = storedId ? parseInt(storedId) : 0

  const [inbox, setInbox] = useState<InboxItem[]>([])
  const [selected, setSelected] = useState<EmailDetail | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadInbox()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadInbox = () => {
    setLoading(true)
    phishingApi.getInbox(employeeId)
      .then(r => setInbox(r.data))
      .finally(() => setLoading(false))
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const openEmail = async (item: InboxItem) => {
    const detail = await phishingApi.getEmail(item.assignment_id, employeeId)
    setSelected(detail.data)
    setMenuOpen(false)
    if (!item.is_opened) {
      await phishingApi.markOpened(item.assignment_id, employeeId)
      setInbox(prev => prev.map(i =>
        i.assignment_id === item.assignment_id
          ? { ...i, is_opened: true, result_status: 'opened' }
          : i
      ))
    }
  }

  const handleCTAClick = async () => {
    if (!selected || selected.is_clicked) return
    await phishingApi.markClicked(selected.assignment_id, employeeId)
    setSelected(prev => prev ? { ...prev, is_clicked: true, result_status: 'clicked' } : prev)
    showToast('Link clicked — this would have been a phishing attack in real life!')
  }

  const handleReport = async (type: 'phishing' | 'spam') => {
    if (!selected) return
    setMenuOpen(false)
    if (type === 'phishing') {
      await phishingApi.reportPhishing(selected.assignment_id, employeeId)
      setSelected(prev => prev ? { ...prev, is_reported_phishing: true, result_status: 'reported_phishing' } : prev)
      showToast('Reported as phishing. Good catch!')
    } else {
      await phishingApi.reportSpam(selected.assignment_id, employeeId)
      setSelected(prev => prev ? { ...prev, is_reported_spam: true, result_status: 'reported_spam' } : prev)
      showToast('Reported as spam.')
    }
    loadInbox()
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-800 border border-gray-700 text-white text-sm px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              CS
            </div>
            <div>
              <p className="text-white font-semibold text-sm">CyberShield Training</p>
              <p className="text-gray-400 text-xs">Phishing Inbox</p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Training
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Inbox</h1>
          <p className="text-gray-400 text-sm">
            {inbox.filter(i => !i.is_opened).length} unread ·{' '}
            {inbox.length} total
          </p>
        </div>

        <div className={`grid gap-4 ${selected ? 'grid-cols-5' : 'grid-cols-1'}`}>

          {/* Email list */}
          <div className={`${selected ? 'col-span-2' : 'col-span-1'} bg-gray-900 border border-gray-800 rounded-xl overflow-hidden`}>
            {loading && (
              <p className="text-center text-gray-500 text-sm py-12">Loading...</p>
            )}
            {!loading && inbox.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-400 text-sm">No emails yet</p>
                <p className="text-gray-600 text-xs mt-1">Your admin hasn't assigned any simulations</p>
              </div>
            )}
            {inbox.map((item, i) => (
              <div
                key={item.assignment_id}
                onClick={() => openEmail(item)}
                className={`px-4 py-4 cursor-pointer transition-colors border-b border-gray-800 last:border-b-0 ${
                  selected?.assignment_id === item.assignment_id
                    ? 'bg-blue-600/10 border-l-2 border-l-blue-500'
                    : 'hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {!item.is_opened && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                  <span className={`text-sm truncate flex-1 ${item.is_opened ? 'text-gray-400 font-normal' : 'text-white font-semibold'}`}>
                    {item.sender_name}
                  </span>
                  <span className="text-xs text-gray-600 shrink-0">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                <p className={`text-sm truncate mb-1 ${item.is_opened ? 'text-gray-500' : 'text-gray-200 font-medium'}`}>
                  {item.subject}
                </p>
                <p className="text-xs text-gray-600 truncate">{item.preview}</p>
              </div>
            ))}
          </div>

          {/* Email detail */}
          {selected && (
            <div className="col-span-3 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">

              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-800/50">
                <p className="text-sm font-medium text-white truncate flex-1 mr-4">{selected.subject}</p>
                <div className="relative shrink-0" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(o => !o)}
                    className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    ⋯ More
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-9 z-50 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden w-52 shadow-xl">
                      <button
                        onClick={() => handleReport('phishing')}
                        disabled={selected.is_reported_phishing}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-b border-gray-700"
                      >
                        🚨 Report as phishing{selected.is_reported_phishing ? ' ✓' : ''}
                      </button>
                      <button
                        onClick={() => handleReport('spam')}
                        disabled={selected.is_reported_spam}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        🗑 Report as spam{selected.is_reported_spam ? ' ✓' : ''}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sender */}
              <div className="px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                    {selected.sender_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selected.sender_name}</p>
                    <p className="text-xs text-gray-500">&lt;{selected.sender_email_display}&gt;</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-6 flex-1">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-8">
                  {selected.message_body}
                </p>

                {selected.cta_text && (
                  <button
                    onClick={handleCTAClick}
                    disabled={selected.is_clicked}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      selected.is_clicked
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {selected.is_clicked ? `${selected.cta_text} (already clicked)` : selected.cta_text}
                  </button>
                )}

                {(selected.is_reported_phishing || selected.is_reported_spam) && (
                  <div className="mt-6 px-4 py-3 bg-green-600/10 border border-green-600/20 rounded-lg text-sm text-green-400">
                    ✓ {selected.is_reported_phishing
                      ? 'You reported this email as phishing. Great awareness!'
                      : 'You reported this email as spam.'}
                  </div>
                )}

                {selected.is_clicked && (
                  <div className="mt-4 px-4 py-3 bg-red-600/10 border border-red-600/20 rounded-lg text-sm text-red-400">
                    ⚠ You clicked the link in this email. In a real attack, this could have compromised your account.
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