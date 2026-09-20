import { Outlet } from 'react-router-dom'
import { useDisclosure } from '../hooks/useDisclosure'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  const sidebar = useDisclosure()

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebar.isOpen} onClose={sidebar.close} />
      <div className="lg:pl-64">
        <Navbar onMenuClick={sidebar.open} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
