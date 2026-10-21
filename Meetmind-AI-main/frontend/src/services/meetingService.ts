import { api } from './api'
import { ActionItem, ChatMessage, MeetingDetail, MeetingListItem } from '@/types'

export async function listMeetings(): Promise<MeetingListItem[]> {
  const { data } = await api.get<MeetingListItem[]>('/meetings')
  return data
}

export async function getMeeting(meetingId: string): Promise<MeetingDetail> {
  const { data } = await api.get<MeetingDetail>(`/meetings/${meetingId}`)
  return data
}

export async function uploadMeeting(
  title: string,
  description: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<MeetingListItem> {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('description', description)
  formData.append('file', file)

  const { data } = await api.post<MeetingListItem>('/meetings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total))
      }
    },
  })
  return data
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  await api.delete(`/meetings/${meetingId}`)
}

export async function renameSpeaker(meetingId: string, speakerId: string, displayName: string): Promise<void> {
  await api.patch(`/meetings/${meetingId}/speakers/${speakerId}`, { display_name: displayName })
}

export async function updateActionItem(
  meetingId: string,
  itemId: string,
  updates: Partial<ActionItem>,
): Promise<ActionItem> {
  const { data } = await api.patch<ActionItem>(`/meetings/${meetingId}/action-items/${itemId}`, updates)
  return data
}

export async function getChatHistory(meetingId: string): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(`/meetings/${meetingId}/chat`)
  return data
}

export async function askQuestion(meetingId: string, question: string): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>(`/meetings/${meetingId}/chat`, { question })
  return data
}
