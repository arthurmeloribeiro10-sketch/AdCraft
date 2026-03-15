import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60">
        <Header />
        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto mt-14 p-6"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
