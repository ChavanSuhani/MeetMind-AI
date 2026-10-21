import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Square, Upload } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { uploadMeeting } from '@/services/meetingService'

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function MeetingRecorder() {
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setSeconds(0)
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch (err) {
      setError('Microphone access was denied. Please allow microphone permissions and try again.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (timerRef.current) window.clearInterval(timerRef.current)
  }

  async function handleUpload() {
    if (!audioBlob) return
    if (!title.trim()) {
      setError('Please give this meeting a title.')
      return
    }
    setError('')
    setIsUploading(true)
    try {
      const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
      const meeting = await uploadMeeting(title, '', file, setProgress)
      navigate(`/meetings/${meeting.id}`)
    } catch (err) {
      setError('Upload failed. Please try again.')
      setIsUploading(false)
    }
  }

  return (
    <AppLayout>
      <h3 className="fw-bold mb-1">Record a Meeting</h3>
      <p className="text-muted mb-4">Record directly from your browser microphone — no download needed.</p>

      <div className="mm-card p-4 p-md-5 text-center" style={{ maxWidth: 560 }}>
        {error && <div className="alert alert-danger py-2 text-start">{error}</div>}

        <div
          className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
          style={{
            width: 120,
            height: 120,
            background: isRecording ? 'rgba(239,68,68,0.08)' : 'rgba(108,99,255,0.08)',
          }}
        >
          <Mic size={44} style={{ color: isRecording ? 'var(--mm-danger)' : 'var(--mm-primary)' }} />
        </div>

        <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
          {isRecording && <span className="mm-record-dot" />}
          <span className="fs-4 fw-semibold font-monospace">{formatTime(seconds)}</span>
        </div>

        {!audioBlob ? (
          <button
            className={`btn px-4 py-2 ${isRecording ? 'btn-danger' : 'mm-btn-primary'}`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <span className="d-flex align-items-center gap-2"><Square size={16} /> Stop Recording</span>
            ) : (
              <span className="d-flex align-items-center gap-2"><Mic size={16} /> Start Recording</span>
            )}
          </button>
        ) : (
          <div className="text-start">
            <audio controls src={audioUrl ?? undefined} className="w-100 mb-3" />

            <label className="form-label small fw-semibold">Meeting title</label>
            <input
              type="text"
              className="form-control mb-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Product Sync"
            />

            {isUploading && (
              <div className="mb-3">
                <div className="progress" style={{ height: 8, borderRadius: 999 }}>
                  <div className="progress-bar" style={{ width: `${progress}%`, background: 'var(--mm-primary)' }} />
                </div>
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                className="btn mm-btn-outline flex-grow-1"
                onClick={() => { setAudioBlob(null); setAudioUrl(null); setSeconds(0) }}
                disabled={isUploading}
              >
                Discard & Re-record
              </button>
              <button
                className="btn mm-btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                onClick={handleUpload}
                disabled={isUploading}
              >
                <Upload size={16} /> {isUploading ? 'Uploading…' : 'Save & Process'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
