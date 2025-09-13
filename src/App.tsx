import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { queryClient } from './lib/queryClient'

// Components
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SchoolAdminDashboard from './pages/SchoolAdminDashboard'
import FinanceStaffDashboard from './pages/FinanceStaffDashboard'
import LoadingSpinner from './components/LoadingSpinner'
import SessionManager from './components/SessionManager'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user, userRole, loading } = useAuth()

  // Only show loading if we're actually loading and don't have a user
  if (loading && !user) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { user, userRole, loading } = useAuth()

  console.log('AppRoutes render:', { user, userRole, loading })

  // Only show loading spinner if we have no user and are still loading
  if (loading && !user) {
    console.log('Showing loading spinner')
    return <LoadingSpinner />
  }

  // If no user, show login/setup routes
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // If user exists but no role yet, show a minimal loading state
  if (user && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // User is authenticated and has a role
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/setup" element={<Navigate to="/dashboard" replace />} />
      
      <Route 
        path="/super-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/school-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['school_admin']}>
            <SchoolAdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/finance-staff/*" 
        element={
          <ProtectedRoute allowedRoles={['finance_staff']}>
            <FinanceStaffDashboard />
          </ProtectedRoute>
        } 
      />
      
      
      <Route 
        path="/dashboard" 
        element={
          userRole === 'super_admin' ? <Navigate to="/super-admin" replace /> :
          userRole === 'school_admin' ? <Navigate to="/school-admin" replace /> :
          userRole === 'finance_staff' ? <Navigate to="/finance-staff" replace /> :
          user ? <div>Loading user role...</div> : <Navigate to="/login" replace />
        } 
      />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionManager />
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App