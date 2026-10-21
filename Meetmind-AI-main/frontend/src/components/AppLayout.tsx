import { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="d-flex">
      <Sidebar />
      <main className="flex-grow-1" style={{ minHeight: '100vh' }}>
        <div className="container-fluid p-4 p-lg-5" style={{ maxWidth: 1200 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
