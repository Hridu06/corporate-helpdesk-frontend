import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage'
import { AuthLayout } from '../layouts/AuthLayout'
import { MainLayout } from '../layouts/MainLayout'
import { ComingSoonPage } from '../pages/common/ComingSoonPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { NotFoundPage } from '../pages/errors/NotFoundPage'
import { GuestRoute } from './GuestRoute'
import { moduleRoutes } from './moduleRoutes'
import { PermissionRoute } from './PermissionRoute'
import { ProtectedRoute } from './ProtectedRoute'

// One permission-gated route per module; each becomes a real page as it is built.
const moduleRouteObjects = moduleRoutes.map((route) => ({
  element: <PermissionRoute permission={route.permission} />,
  children: [
    { path: route.path, element: <ComingSoonPage title={route.label} description={route.description} /> },
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
