import { lazy } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { MainLayout } from '../layouts/MainLayout'
import { ComingSoonPage } from '../pages/common/ComingSoonPage'
import { NotFoundPage } from '../pages/errors/NotFoundPage'
import { GuestRoute } from './GuestRoute'
import { moduleRoutes } from './moduleRoutes'
import { PermissionRoute } from './PermissionRoute'
import { ProtectedRoute } from './ProtectedRoute'

// Pages load on demand (each becomes its own chunk); the layouts provide the Suspense fallback.
const lazyPage = (load, name) => lazy(() => load().then((module) => ({ default: module[name] })))

const LoginPage = lazyPage(() => import('../features/auth/pages/LoginPage'), 'LoginPage')
const RegisterPage = lazyPage(() => import('../features/auth/pages/RegisterPage'), 'RegisterPage')
const ForgotPasswordPage = lazyPage(() => import('../features/auth/pages/ForgotPasswordPage'), 'ForgotPasswordPage')
const ResetPasswordPage = lazyPage(() => import('../features/auth/pages/ResetPasswordPage'), 'ResetPasswordPage')
const VerifyEmailPage = lazyPage(() => import('../features/auth/pages/VerifyEmailPage'), 'VerifyEmailPage')
const DashboardPage = lazyPage(() => import('../pages/dashboard/DashboardPage'), 'DashboardPage')
const UsersPage = lazyPage(() => import('../features/users/pages/UsersPage'), 'UsersPage')
const LoginActivityPage = lazyPage(() => import('../features/activity/pages/LoginActivityPage'), 'LoginActivityPage')
const DepartmentsPage = lazyPage(() => import('../features/departments/pages/DepartmentsPage'), 'DepartmentsPage')

// Modules that have a real page; every other module still shows "Coming soon".
const modulePages = {
  users: <UsersPage />,
  activity: <LoginActivityPage />,
  departments: <DepartmentsPage />,
}

// One permission-gated route per module.
const moduleRouteObjects = moduleRoutes.map((route) => ({
  element: <PermissionRoute permission={route.permission} />,
  children: [
    {
      path: route.path,
      element: modulePages[route.key] ?? <ComingSoonPage title={route.label} description={route.description} />,
    },
  ],
}))

// Forgot/reset/verify pages are public on purpose: they are reached from emailed links.
// Route guards are UX only; the backend authorises every API request.
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    element: <AuthLayout />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [{ path: '/dashboard', element: <DashboardPage /> }, ...moduleRouteObjects],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
