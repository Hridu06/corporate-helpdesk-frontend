import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PageLoader } from '../components/common/PageLoader'
import { config } from '../utils/config'

/** The split-screen login always owns the full viewport, including after logout. */
export function LoginLayout() {
  return (
    <main className="min-h-svh w-full">
      <Suspense fallback={<div className="flex min-h-svh items-center justify-center"><PageLoader /></div>}>
        <Outlet />
      </Suspense>
    </main>
  )
}

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-2xl font-semibold text-brand-700">{config.appName}</p>
        <main className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
