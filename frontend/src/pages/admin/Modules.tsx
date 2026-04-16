import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { modulesApi } from '../../api/client'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const categoryColors: Record<string, string> = {
  mandatory: 'bg-red-600/20 text-red-400 border-red-600/30',
  nepal_compliance: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  optional: 'bg-green-600/20 text-green-400 border-green-600/30',
}

const categoryLabels: Record<string, string> = {
  mandatory: '🔴 Mandatory',
  nepal_compliance: '🟡 Nepal Law',
  optional: '🟢 Optional',
}

export default function Modules() {
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [preview, setPreview] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    try {
      const r = await modulesApi.list()
      setModules(r.data)
    } catch {
      setModules([])
    } finally {
      setLoading(false)
    }
  }

  const filtered =
    filter === 'all' ? modules : modules.filter((m) => m.category === filter)

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete module "${title}"?`)) return

    try {
      await modulesApi.delete(id)
      setModules((prev) => prev.filter((m) => m.id !== id))
      if (preview?.id === id) setPreview(null)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete module')
    }
  }

  const handleOpenEdit = (module: any) => {
    setEditing({
      id: module.id,
      title: module.title || '',
      description: module.description || '',
      video_url: module.video_url || '',
      content_type: module.content_type || 'video',
      category: module.category || 'mandatory',
      pass_threshold: module.pass_threshold || 80,
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)

    try {
      const fd = new FormData()
      fd.append('title', editing.title)
      fd.append('description', editing.description)
      fd.append('video_url', editing.video_url)
      fd.append('content_type', editing.content_type)
      fd.append('category', editing.category)
      fd.append('pass_threshold', String(editing.pass_threshold))

      const res = await modulesApi.update(editing.id, fd)

      setModules((prev) =>
        prev.map((m) => (m.id === editing.id ? res.data : m))
      )

      if (preview?.id === editing.id) {
        setPreview(res.data)
      }

      setEditing(null)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update module')
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading modules..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Modules</h1>
          <p className="text-gray-400 mt-1">{modules.length} modules total</p>
        </div>
        <Link to="/admin/modules/new" className="btn-primary">
          + Create Module
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: `📚 All (${modules.length})` },
          {
            key: 'mandatory',
            label: `🔴 Mandatory (${modules.filter((m) => m.category === 'mandatory').length})`,
          },
          {
            key: 'nepal_compliance',
            label: `🟡 Nepal Law (${modules.filter((m) => m.category === 'nepal_compliance').length})`,
          },
          {
            key: 'optional',
            label: `🟢 Optional (${modules.filter((m) => m.category === 'optional').length})`,
          },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-500">No modules in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m: any) => (
            <div
              key={m.id}
              className="card hover:border-gray-600 transition-all"
            >
              {m.content_type === 'video' && m.video_url ? (
                <div
                  className="w-full h-36 bg-black rounded-lg overflow-hidden mb-3 cursor-pointer relative group"
                  onClick={() => setPreview(m)}
                >
                  {extractYouTubeId(m.video_url) ? (
                    <img
                      src={`https://img.youtube.com/vi/${extractYouTubeId(m.video_url)}/mqdefault.jpg`}
                      alt={m.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Invalid video URL
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-blue-600/80 transition-colors">
                      <span className="text-white text-xl ml-1">▶</span>
                    </div>
                  </div>
                </div>
              ) : m.content_type === 'pdf' ? (
                <div
                  className="w-full h-36 bg-gray-800 rounded-lg overflow-hidden mb-3 cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-gray-700 transition-colors border border-gray-700"
                  onClick={() => setPreview(m)}
                >
                  <span className="text-4xl">📄</span>
                  <span className="text-xs text-gray-400">
                    Click to preview document
                  </span>
                </div>
              ) : (
                <div className="w-full h-36 bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No content URL</span>
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    categoryColors[m.category] || categoryColors.mandatory
                  }`}
                >
                  {categoryLabels[m.category] || m.category}
                </span>
                <span className="text-xs text-gray-500">
                  {m.content_type === 'pdf' ? '📄 PDF' : '🎥 Video'}
                </span>
              </div>

              <h3 className="font-semibold text-white mb-1 text-sm leading-snug">
                {m.title}
              </h3>
              <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                {m.description}
              </p>

              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span>Pass: {m.pass_threshold}%</span>
                <span>·</span>
                <span>
                  {m.quiz
                    ? `📝 ${m.quiz.question_count || m.quiz.questions?.length || 0} questions`
                    : '⚠️ No quiz'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPreview(m)}
                  className="btn-secondary text-xs"
                >
                  {m.content_type === 'pdf' ? '👁 Preview Doc' : '▶ Preview Video'}
                </button>

                <Link
                  to={`/admin/modules/${m.id}/quiz`}
                  className="btn-secondary text-xs text-center"
                >
                  {m.quiz ? 'Edit Quiz' : 'Add Quiz'}
                </Link>

                <button
                  onClick={() => handleOpenEdit(m)}
                  className="btn-secondary text-xs"
                >
                  Edit Module
                </button>

                <button
                  onClick={() => handleDelete(m.id, m.title)}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs px-3 py-2"
                >
                  Delete Module
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-gray-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      categoryColors[preview.category] || categoryColors.mandatory
                    }`}
                  >
                    {categoryLabels[preview.category] || preview.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {preview.content_type === 'pdf'
                      ? '📄 PDF Document'
                      : '🎥 Video'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  {preview.title}
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {preview.description}
                </p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none ml-4 shrink-0"
              >
                ×
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[70vh]">
              {preview.content_type === 'pdf' ? (
                <div>
                  <div className="w-full h-[450px] rounded-lg overflow-hidden border border-gray-700 bg-white mb-4">
                    <iframe
                      src={preview.video_url}
                      width="100%"
                      height="100%"
                      title={preview.title}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    {getYouTubeEmbedUrl(preview.video_url) ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={getYouTubeEmbedUrl(preview.video_url)}
                        title={preview.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Invalid video URL
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      Pass threshold:{' '}
                      <span className="text-white font-medium">
                        {preview.pass_threshold}%
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Questions:{' '}
                      <span className="text-white font-medium">
                        {preview.quiz?.question_count ||
                          preview.quiz?.questions?.length ||
                          0}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-800 flex justify-between items-center">
              <Link
                to={`/admin/modules/${preview.id}/quiz`}
                className="btn-secondary text-sm"
              >
                {preview.quiz ? 'Edit Quiz' : 'Add Quiz'}
              </Link>
              <button
                onClick={() => setPreview(null)}
                className="btn-primary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl w-full max-w-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveEdit}>
              <div className="flex items-start justify-between p-5 border-b border-gray-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Edit Module</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Update module details, link, type, and category
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="text-gray-400 hover:text-white text-2xl leading-none ml-4 shrink-0"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="label">Module Title *</label>
                  <input
                    className="input"
                    value={editing.title}
                    onChange={(e) =>
                      setEditing((prev: any) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input min-h-24 resize-none"
                    value={editing.description}
                    onChange={(e) =>
                      setEditing((prev: any) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="label">Content Type</label>
                  <select
                    className="input"
                    value={editing.content_type}
                    onChange={(e) =>
                      setEditing((prev: any) => ({
                        ...prev,
                        content_type: e.target.value,
                        video_url: '',
                      }))
                    }
                  >
                    <option value="video">🎥 Video</option>
                    <option value="pdf">📄 PDF</option>
                  </select>
                </div>

                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={editing.category}
                    onChange={(e) =>
                      setEditing((prev: any) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    <option value="mandatory">🔴 Mandatory</option>
                    <option value="nepal_compliance">🟡 Nepal Law</option>
                    <option value="optional">🟢 Optional</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    {editing.content_type === 'pdf'
                      ? 'PDF URL'
                      : 'Video URL'}
                  </label>
                  <input
                    className="input"
                    value={editing.video_url}
                    onChange={(e) =>
                      setEditing((prev: any) => ({ ...prev, video_url: e.target.value }))
                    }
                    placeholder={
                      editing.content_type === 'pdf'
                        ? 'https://drive.google.com/file/d/.../preview'
                        : 'https://youtube.com/watch?v=...'
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Pass Threshold (%)</label>
                  <input
                    type="number"
                    className="input"
                    min={50}
                    max={100}
                    value={editing.pass_threshold}
                    onChange={(e) =>
                      setEditing((prev: any) => ({
                        ...prev,
                        pass_threshold: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function extractYouTubeId(url: string): string {
  if (!url) return ''

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return ''
}

function getYouTubeEmbedUrl(url: string): string {
  const id = extractYouTubeId(url)
  if (!id) return ''
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
}