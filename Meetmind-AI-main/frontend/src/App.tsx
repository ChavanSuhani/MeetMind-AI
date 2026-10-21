import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MeetingUpload from './pages/MeetingUpload'
import MeetingRecorder from './pages/MeetingRecorder'
import MeetingDetail from './pages/MeetingDetail'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <MeetingUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/record"
        element={
          <ProtectedRoute>
            <MeetingRecorder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meetings/:meetingId"
        element={
          <ProtectedRoute>
            <MeetingDetail />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
