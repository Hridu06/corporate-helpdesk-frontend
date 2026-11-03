import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PageLoader } from '../components/common/PageLoader'
import { useDisclosure } from '../hooks/useDisclosure'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { cn } from '../utils/cn'

export function MainLayout() {
  const sidebar = useDisclosure()
  const [collapsed, setCollapsed] = useState(false)
  const toggleNavigation = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) setCollapsed((current) => !current)
    else sidebar.open()
  }

  return (
    <div className="workspace-surface min-h-screen">
      <Sidebar open={sidebar.isOpen} onClose={sidebar.close} collapsed={collapsed} />
      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-[88px]' : 'lg:pl-[264px]')}>
        <Navbar onMenuClick={toggleNavigation} collapsed={collapsed} />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-7 lg:py-7">
          {/* Pages are code-split; the shell stays put while a page downloads. */}
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
