import { ChangeEvent, DragEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileAudio, X } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { uploadMeeting } from '@/services/meetingService'

export default function MeetingUpload() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  function handleFileSelect(selected: File | null) {
    if (!selected) return
    setFile(selected)
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''))
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0])
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Please select an audio or video file to upload.')
      return
    }
    setError('')
    setIsUploading(true)
    try {
      const meeting = await uploadMeeting(title, description, file, setProgress)
      navigate(`/meetings/${meeting.id}`)
    } catch (err) {
      setError('Upload failed. Please try again.')
      setIsUploading(false)
    }
  }

  return (
    <AppLayout>
      <h3 className="fw-bold mb-1">Upload a Meeting</h3>
      <p className="text-muted mb-4">
        We'll transcribe the audio, identify speakers, and generate a summary automatically.
      </p>

      <form onSubmit={handleSubmit} className="mm-card p-4 p-md-5" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div
          className={`mm-upload-zone p-5 text-center mb-4 ${isDragOver ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="audio/*,video/mp4,.webm"
            className="d-none"
            onChange={handleInputChange}
          />

          {file ? (
            <div className="d-flex align-items-center justify-content-center gap-3">
              <FileAudio size={28} style={{ color: 'var(--mm-primary)' }} />
              <div className="text-start">
                <div className="fw-semibold">{file.name}</div>
                <div className="text-muted small">{(file.size / (1024 * 1024)).toFixed(1)} MB</div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light border-0"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud size={36} className="mb-2" style={{ color: 'var(--mm-primary)' }} />
              <div className="fw-semibold mb-1">Drag & drop your recording here</div>
              <div className="text-muted small">or click to browse — MP3, WAV, M4A, MP4, WebM</div>
            </>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold">Meeting title</label>
          <input
            type="text"
            className="form-control"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Weekly Product Sync"
          />
        </div>

        <div className="mb-4">
          <label className="form-label small fw-semibold">Description (optional)</label>
          <textarea
            className="form-control"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any context about this meeting…"
          />
        </div>

        {isUploading && (
          <div className="mb-4">
            <div className="progress" style={{ height: 8, borderRadius: 999 }}>
              <div
                className="progress-bar"
                style={{ width: `${progress}%`, background: 'var(--mm-primary)' }}
              />
            </div>
            <div className="text-muted small mt-1">Uploading… {progress}%</div>
          </div>
        )}

        <button type="submit" className="btn mm-btn-primary px-4 py-2" disabled={isUploading}>
          {isUploading ? 'Uploading…' : 'Upload & Process'}
        </button>
      </form>
    </AppLayout>
  )
}
