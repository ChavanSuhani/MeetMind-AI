import { MeetingStatus } from '@/types'

const STATUS_CONFIG: Record<MeetingStatus, { label: string; className: string }> = {
  uploaded: { label: 'Uploaded', className: 'mm-badge-uploaded' },
  transcribing: { label: 'Transcribing…', className: 'mm-badge-processing' },
  diarizing: { label: 'Identifying speakers…', className: 'mm-badge-processing' },
  summarizing: { label: 'Summarizing…', className: 'mm-badge-processing' },
  indexing: { label: 'Indexing…', className: 'mm-badge-processing' },
  completed: { label: 'Completed', className: 'mm-badge-completed' },
  failed: { label: 'Failed', className: 'mm-badge-failed' },
}

export default function StatusBadge({ status }: { status: MeetingStatus }) {
  const cfg = STATUS_CONFIG[status]
  return <span className={`mm-badge ${cfg.className}`}>{cfg.label}</span>
}
