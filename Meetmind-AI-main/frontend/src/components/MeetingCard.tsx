import { useNavigate } from 'react-router-dom'
import { Clock, Trash2, FileText } from 'lucide-react'
import { MeetingListItem } from '@/types'
import StatusBadge from './StatusBadge'

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function MeetingCard({
  meeting,
  onDelete,
}: {
  meeting: MeetingListItem
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()

  return (
    <div
      className="mm-card p-3 p-md-4 mb-3 d-flex align-items-center justify-content-between"
      role="button"
      onClick={() => navigate(`/meetings/${meeting.id}`)}
    >
      <div className="d-flex align-items-center gap-3 overflow-hidden">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 44, height: 44, background: 'rgba(108,99,255,0.1)', color: 'var(--mm-primary)' }}
        >
          <FileText size={20} />
        </div>
        <div className="overflow-hidden">
          <div className="fw-semibold text-truncate">{meeting.title}</div>
          <div className="d-flex align-items-center gap-3 text-muted small mt-1">
            <span className="d-flex align-items-center gap-1">
              <Clock size={14} /> {formatDuration(meeting.duration_seconds)}
            </span>
            <span>{formatDate(meeting.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3 flex-shrink-0">
        <StatusBadge status={meeting.status} />
        <button
          className="btn btn-sm btn-light border-0 text-danger"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('Delete this meeting? This cannot be undone.')) {
              onDelete(meeting.id)
            }
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
