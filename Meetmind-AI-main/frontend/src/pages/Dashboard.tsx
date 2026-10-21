import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UploadCloud, Search, Inbox } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import MeetingCard from '@/components/MeetingCard'
import { deleteMeeting, listMeetings } from '@/services/meetingService'
import { MeetingListItem } from '@/types'

export default function Dashboard() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    refresh()
    // Poll for status updates while any meeting is still processing
    const interval = setInterval(refresh, 6000)
    return () => clearInterval(interval)
  }, [])

  async function refresh() {
    try {
      const data = await listMeetings()
      setMeetings(data)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteMeeting(id)
    setMeetings((prev) => prev.filter((m) => m.id !== id))
  }

  const filtered = meetings.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <AppLayout>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1">Your Meetings</h3>
          <p className="text-muted mb-0">Transcripts, summaries, and action items — all in one place.</p>
        </div>
        <Link to="/upload" className="btn mm-btn-primary d-flex align-items-center gap-2 px-3 py-2">
          <UploadCloud size={18} /> New Meeting
        </Link>
      </div>

      <div className="mb-4" style={{ maxWidth: 380 }}>
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0" style={{ borderColor: 'var(--mm-border)' }}>
            <Search size={16} className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            style={{ borderColor: 'var(--mm-border)' }}
            placeholder="Search meetings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border" style={{ color: 'var(--mm-primary)' }} role="status" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mm-card p-5 text-center">
          <Inbox size={40} className="text-muted mb-3" />
          <h6 className="fw-semibold">No meetings yet</h6>
          <p className="text-muted mb-3">Upload a recording or record one directly to get started.</p>
          <Link to="/upload" className="btn mm-btn-primary px-4">
            Upload your first meeting
          </Link>
        </div>
      ) : (
        filtered.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} onDelete={handleDelete} />
        ))
      )}
    </AppLayout>
  )
}
