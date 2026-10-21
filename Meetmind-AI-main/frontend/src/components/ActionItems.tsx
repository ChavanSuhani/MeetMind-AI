import { useState } from 'react'
import { ActionItem } from '@/types'
import { updateActionItem } from '@/services/meetingService'

const PRIORITY_COLORS: Record<string, string> = {
  low: 'var(--mm-text-muted)',
  medium: 'var(--mm-warning)',
  high: 'var(--mm-danger)',
}

export default function ActionItems({ meetingId, items }: { meetingId: string; items: ActionItem[] }) {
  const [localItems, setLocalItems] = useState(items)

  async function toggleComplete(item: ActionItem) {
    const updated = await updateActionItem(meetingId, item.id, { is_completed: !item.is_completed })
    setLocalItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
  }

  if (localItems.length === 0) {
    return <p className="text-muted">No action items were identified for this meeting.</p>
  }

  return (
    <div className="d-flex flex-column gap-2">
      {localItems.map((item) => (
        <div key={item.id} className="d-flex align-items-start gap-3 p-2 rounded-3 mm-segment">
          <input
            type="checkbox"
            className="form-check-input mt-1"
            checked={item.is_completed}
            onChange={() => toggleComplete(item)}
          />
          <div className="flex-grow-1">
            <div
              className={item.is_completed ? 'text-decoration-line-through text-muted' : ''}
            >
              {item.description}
            </div>
            <div className="d-flex align-items-center gap-3 mt-1 small text-muted">
              {item.assignee && <span>👤 {item.assignee}</span>}
              {item.due_date && <span>📅 {new Date(item.due_date).toLocaleDateString()}</span>}
              <span style={{ color: PRIORITY_COLORS[item.priority] }} className="fw-semibold text-capitalize">
                {item.priority} priority
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
