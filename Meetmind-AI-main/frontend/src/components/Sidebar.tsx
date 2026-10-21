import { NavLink } from 'react-router-dom'
import { LayoutGrid, UploadCloud, Mic, LogOut, Brain } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <div className="mm-sidebar d-flex flex-column p-3">
      <div className="d-flex align-items-center gap-2 mb-4 px-1">
        <div className="mm-brand-icon">
          <Brain size={20} />
        </div>
        <span className="mm-brand">MeetMind AI</span>
      </div>

      <nav className="d-flex flex-column gap-1 flex-grow-1">
        <NavLink to="/dashboard" className={({ isActive }) => `mm-nav-link ${isActive ? 'active' : ''}`}>
          <LayoutGrid size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => `mm-nav-link ${isActive ? 'active' : ''}`}>
          <UploadCloud size={18} />
          Upload Meeting
        </NavLink>
        <NavLink to="/record" className={({ isActive }) => `mm-nav-link ${isActive ? 'active' : ''}`}>
          <Mic size={18} />
          Record Meeting
        </NavLink>
      </nav>

      <div className="border-top pt-3 mt-3" style={{ borderColor: 'var(--mm-border)' }}>
        <div className="d-flex align-items-center gap-2 px-1 mb-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold"
            style={{ width: 34, height: 34, background: 'var(--mm-primary)', fontSize: '0.85rem' }}
          >
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="fw-semibold small text-truncate" style={{ maxWidth: 150 }}>{user?.full_name}</div>
            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem', maxWidth: 150 }}>{user?.email}</div>
          </div>
        </div>
        <button className="mm-nav-link w-100 border-0 bg-transparent text-start" onClick={logout}>
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  )
}
