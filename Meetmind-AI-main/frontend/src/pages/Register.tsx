import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { AxiosError } from 'axios'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setIsSubmitting(true)
    try {
      await register(fullName, email, password)
      navigate('/dashboard')
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      setError(axiosErr.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ background: 'var(--mm-bg)' }}>
      <div className="mm-card p-4 p-md-5" style={{ width: '100%', maxWidth: 420 }}>
        <div className="d-flex align-items-center gap-2 mb-4 justify-content-center">
          <div className="mm-brand-icon"><Brain size={20} /></div>
          <span className="mm-brand fs-4">MeetMind AI</span>
        </div>

        <h5 className="text-center mb-1">Create your account</h5>
        <p className="text-muted text-center mb-4">Start turning meetings into insights</p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Full name</label>
            <input
              type="text"
              className="form-control"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <button type="submit" className="btn mm-btn-primary w-100 py-2" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
