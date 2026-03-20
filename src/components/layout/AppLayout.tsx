import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ApiKeyModal from '../ui/ApiKeyModal'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60">
        <Header onOpenSettings={() => setSettingsOpen(true)} />
        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto mt-14 p-6"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          {children}
        </main>
      </div>

      <ApiKeyModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
