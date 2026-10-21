export interface User {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  created_at: string
}

export type MeetingStatus =
  | 'uploaded'
  | 'transcribing'
  | 'diarizing'
  | 'summarizing'
  | 'indexing'
  | 'completed'
  | 'failed'

export interface MeetingListItem {
  id: string
  title: string
  status: MeetingStatus
  duration_seconds: number | null
  created_at: string
}

export interface Speaker {
  id: string
  diarization_label: string
  display_name: string | null
  color: string
}

export interface TranscriptSegment {
  id: string
  start_time: number
  end_time: number
  text: string
  speaker: Speaker | null
}

export type ActionItemPriority = 'low' | 'medium' | 'high'

export interface ActionItem {
  id: string
  description: string
  assignee: string | null
  due_date: string | null
  priority: ActionItemPriority
  is_completed: boolean
}

export interface MeetingDetail {
  id: string
  title: string
  description: string | null
  status: MeetingStatus
  error_message: string | null
  duration_seconds: number | null
  summary: string | null
  key_points: string[]
  created_at: string
  updated_at: string
  speakers: Speaker[]
  segments: TranscriptSegment[]
  action_items: ActionItem[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
