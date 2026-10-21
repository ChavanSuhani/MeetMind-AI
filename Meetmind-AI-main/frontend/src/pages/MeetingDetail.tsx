import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Sparkles, ListChecks, MessagesSquare } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import StatusBadge from '@/components/StatusBadge'
import TranscriptView from '@/components/TranscriptView'
import SummaryPanel from '@/components/SummaryPanel'
import ActionItems from '@/components/ActionItems'
import ChatBox from '@/components/ChatBox'
import { getMeeting } from '@/services/meetingService'
import { MeetingDetail as MeetingDetailType } from '@/types'

type Tab = 'summary' | 'transcript' | 'actions' | 'chat'

const PROCESSING_STATUSES = ['uploaded', 'transcribing', 'diarizing', 'summarizing', 'indexing']

export default function MeetingDetail() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [meeting, setMeeting] = useState<MeetingDetailType | null>(null)
  const [tab, setTab] = useState<Tab>('summary')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!meetingId) return
    refresh()
    const interval = setInterval(() => {
      if (meeting && !PROCESSING_STATUSES.includes(meeting.status)) return
      refresh()
    }, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, meeting?.status])

  async function refresh() {
    if (!meetingId) return
    try {
      const data = await getMeeting(meetingId)
      setMeeting(data)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border" style={{ color: 'var(--mm-primary)' }} role="status" />
        </div>
      </AppLayout>
    )
  }

  if (!meeting) {
    return (
      <AppLayout>
        <p className="text-muted">Meeting not found.</p>
      </AppLayout>
    )
  }

  const isProcessing = PROCESSING_STATUSES.includes(meeting.status)
  const isCompleted = meeting.status === 'completed'

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: 'summary', label: 'Summary', icon: <Sparkles size={16} /> },
    { key: 'transcript', label: 'Transcript', icon: <FileText size={16} /> },
    { key: 'actions', label: 'Action Items', icon: <ListChecks size={16} /> },
    { key: 'chat', label: 'Ask AI', icon: <MessagesSquare size={16} /> },
  ]

  return (
    <AppLayout>
      <div className="d-flex align-items-center justify-content-between mb-1 flex-wrap gap-2">
        <h3 className="fw-bold mb-0">{meeting.title}</h3>
        <StatusBadge status={meeting.status} />
      </div>
      {meeting.description && <p className="text-muted mb-4">{meeting.description}</p>}

      {isProcessing && (
        <div className="alert d-flex align-items-center gap-2 mb-4" style={{ background: 'rgba(108,99,255,0.08)', border: 'none', color: 'var(--mm-primary)' }}>
          <div className="spinner-border spinner-border-sm" role="status" />
          MeetMind AI is processing this recording — this page will update automatically.
        </div>
      )}

      {meeting.status === 'failed' && (
        <div className="alert alert-danger mb-4">
          Processing failed{meeting.error_message ? `: ${meeting.error_message.slice(0, 200)}` : '.'}
        </div>
      )}

      <ul className="nav gap-2 mb-4" style={{ borderBottom: '1px solid var(--mm-border)' }}>
        {tabs.map((t) => (
          <li className="nav-item" key={t.key}>
            <button
              className="btn d-flex align-items-center gap-2 rounded-0 border-0 px-3 py-2"
              style={{
                borderBottom: tab === t.key ? '2px solid var(--mm-primary)' : '2px solid transparent',
                color: tab === t.key ? 'var(--mm-primary)' : 'var(--mm-text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
              onClick={() => setTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mm-card p-4 p-md-5">
        {tab === 'summary' && <SummaryPanel summary={meeting.summary} keyPoints={meeting.key_points} />}
        {tab === 'transcript' && <TranscriptView segments={meeting.segments} meetingId={meeting.id} />}
        {tab === 'actions' && <ActionItems meetingId={meeting.id} items={meeting.action_items} />}
        {tab === 'chat' && <ChatBox meetingId={meeting.id} disabled={!isCompleted} />}
      </div>
    </AppLayout>
  )
}
