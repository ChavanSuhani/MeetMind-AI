import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="spinner-border" style={{ color: 'var(--mm-primary)' }} role="status" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
