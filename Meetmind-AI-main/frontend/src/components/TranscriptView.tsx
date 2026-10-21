import { useState } from 'react'
import { Pencil, Check } from 'lucide-react'
import { Speaker, TranscriptSegment } from '@/types'
import { renameSpeaker } from '@/services/meetingService'

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function SpeakerLabel({
  speaker,
  meetingId,
  onRenamed,
}: {
  speaker: Speaker
  meetingId: string
  onRenamed: (speakerId: string, name: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(speaker.display_name || speaker.diarization_label)

  async function save() {
    if (name.trim()) {
      await renameSpeaker(meetingId, speaker.id, name.trim())
      onRenamed(speaker.id, name.trim())
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <span className="d-inline-flex align-items-center gap-1">
        <input
          className="form-control form-control-sm d-inline-block"
          style={{ width: 140 }}
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button className="btn btn-sm btn-light border-0" onClick={save}>
          <Check size={14} />
        </button>
      </span>
    )
  }

  return (
    <span className="fw-semibold d-inline-flex align-items-center gap-1">
      <span className="mm-speaker-dot" style={{ background: speaker.color }} />
      {speaker.display_name || speaker.diarization_label}
      <button
        className="btn btn-sm btn-link text-muted p-0 ms-1"
        style={{ lineHeight: 1 }}
        onClick={() => setIsEditing(true)}
        title="Rename speaker"
      >
        <Pencil size={12} />
      </button>
    </span>
  )
}

export default function TranscriptView({
  segments,
  meetingId,
}: {
  segments: TranscriptSegment[]
  meetingId: string
}) {
  const [localSegments, setLocalSegments] = useState(segments)

  function handleRenamed(speakerId: string, name: string) {
    setLocalSegments((prev) =>
      prev.map((seg) =>
        seg.speaker?.id === speakerId
          ? { ...seg, speaker: { ...seg.speaker, display_name: name } }
          : seg,
      ),
    )
  }

  if (segments.length === 0) {
    return <p className="text-muted">Transcript will appear here once processing is complete.</p>
  }

  return (
    <div className="d-flex flex-column gap-3">
      {localSegments.map((seg) => (
        <div key={seg.id} className="mm-segment p-2 rounded-3 d-flex gap-3">
          <span className="text-muted small font-monospace pt-1" style={{ minWidth: 44 }}>
            {formatTimestamp(seg.start_time)}
          </span>
          <div>
            {seg.speaker && (
              <div className="mb-1">
                <SpeakerLabel speaker={seg.speaker} meetingId={meetingId} onRenamed={handleRenamed} />
              </div>
            )}
            <div>{seg.text}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
