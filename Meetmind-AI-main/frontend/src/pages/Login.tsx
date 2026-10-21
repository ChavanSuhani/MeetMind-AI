import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { AxiosError } from 'axios'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      setError(axiosErr.response?.data?.detail || 'Login failed. Please try again.')
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

        <h5 className="text-center mb-1">Welcome back</h5>
        <p className="text-muted text-center mb-4">Sign in to access your meeting intelligence</p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn mm-btn-primary w-100 py-2" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
