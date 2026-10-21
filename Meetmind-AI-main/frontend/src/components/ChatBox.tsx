import { FormEvent, useEffect, useRef, useState } from 'react'
import { Send, MessageCircleQuestion } from 'lucide-react'
import { ChatMessage } from '@/types'
import { askQuestion, getChatHistory } from '@/services/meetingService'

export default function ChatBox({ meetingId, disabled }: { meetingId: string; disabled: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getChatHistory(meetingId).then(setMessages)
  }, [meetingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!question.trim() || isAsking) return

    const optimisticUser: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUser])
    setQuestion('')
    setIsAsking(true)

    try {
      const answer = await askQuestion(meetingId, optimisticUser.content)
      setMessages((prev) => [...prev, answer])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', content: 'Sorry, something went wrong answering that.', created_at: new Date().toISOString() },
      ])
    } finally {
      setIsAsking(false)
    }
  }

  return (
    <div className="d-flex flex-column" style={{ height: 480 }}>
      <div className="flex-grow-1 overflow-auto mb-3 pe-1">
        {messages.length === 0 && (
          <div className="text-center text-muted py-5">
            <MessageCircleQuestion size={32} className="mb-2" />
            <p className="mb-0 small">Ask anything about this meeting — decisions, action items, who said what…</p>
          </div>
        )}
        <div className="d-flex flex-column gap-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 ${msg.role === 'user' ? 'mm-chat-bubble-user align-self-end' : 'mm-chat-bubble-assistant align-self-start'}`}
              style={{ maxWidth: '85%' }}
            >
              {msg.content}
            </div>
          ))}
          {isAsking && (
            <div className="mm-chat-bubble-assistant p-3 align-self-start" style={{ maxWidth: '85%' }}>
              <span className="spinner-grow spinner-grow-sm me-1" style={{ color: 'var(--mm-primary)' }} />
              Thinking…
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="d-flex gap-2">
        <input
          type="text"
          className="form-control"
          placeholder={disabled ? 'Available once processing completes…' : 'Ask a question about this meeting…'}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={disabled || isAsking}
        />
        <button type="submit" className="btn mm-btn-primary d-flex align-items-center" disabled={disabled || isAsking}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
