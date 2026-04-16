import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { modulesApi } from '../../api/client'

export default function CreateModule() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    pass_threshold: 80,
    video_url: '',
    content_type: 'video',
    category: 'mandatory',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('pass_threshold', String(form.pass_threshold))
      fd.append('video_url', form.video_url)
      fd.append('content_type', form.content_type)
      fd.append('category', form.category)

      console.log('SUBMITTING MODULE:', {
        title: form.title,
        description: form.description,
        pass_threshold: form.pass_threshold,
        video_url: form.video_url,
        content_type: form.content_type,
        category: form.category,
      })

      const res = await modulesApi.create(fd)
      navigate(`/admin/modules/${res.data.id}/quiz`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create module')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Training Module</h1>
        <p className="text-gray-400 mt-1">Add a new cybersecurity training module</p>
      </div>

      <div className="card">
        {error && (
          <div className="bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Module Title *</label>
            <input
              className="input"
              placeholder="e.g. Phishing Awareness Training"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-24 resize-none"
              placeholder="What will employees learn in this module?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Content Type *</label>
            <select
              className="input"
              value={form.content_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
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
            <label className="label">Category *</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="mandatory">🔴 Mandatory</option>
              <option value="nepal_compliance">🟡 Nepal Law</option>
              <option value="optional">🟢 Optional</option>
            </select>
          </div>

          <div>
            <label className="label">
              {form.content_type === 'pdf'
                ? 'PDF URL (Google Drive preview / direct PDF link)'
                : 'Video URL (YouTube / direct link)'}
            </label>
            <input
              className="input"
              placeholder={
                form.content_type === 'pdf'
                  ? 'https://drive.google.com/file/d/.../preview'
                  : 'https://youtube.com/watch?v=...'
              }
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.content_type === 'pdf'
                ? 'Paste a PDF preview link or direct PDF link'
                : 'Paste a YouTube URL or direct video link'}
            </p>
          </div>

          <div>
            <label className="label">Pass Threshold (%)</label>
            <input
              type="number"
              className="input"
              min={50}
              max={100}
              value={form.pass_threshold}
              onChange={(e) =>
                setForm((f) => ({ ...f, pass_threshold: Number(e.target.value) }))
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum score required to pass (recommended: 80%)
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Creating...' : 'Create & Add Quiz →'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/modules')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}