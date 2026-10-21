import { Sparkles } from 'lucide-react'

export default function SummaryPanel({ summary, keyPoints }: { summary: string | null; keyPoints: string[] }) {
  if (!summary) {
    return <p className="text-muted">The AI summary will appear here once processing is complete.</p>
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-2">
        <Sparkles size={16} style={{ color: 'var(--mm-primary)' }} />
        <span className="fw-semibold small text-uppercase" style={{ color: 'var(--mm-primary)', letterSpacing: 0.5 }}>
          AI Summary
        </span>
      </div>
      <p className="mb-4">{summary}</p>

      {keyPoints.length > 0 && (
        <>
          <div className="fw-semibold small text-uppercase text-muted mb-2" style={{ letterSpacing: 0.5 }}>
            Key Points
          </div>
          <ul className="mb-0 ps-3">
            {keyPoints.map((point, i) => (
              <li key={i} className="mb-2">{point}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
