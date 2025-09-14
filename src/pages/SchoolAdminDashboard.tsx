import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Users, 
  BarChart3, 
  LogOut,
  DollarSign,
  FileText,
  Menu,
  X,
  Bell,
  Lock,
} from 'lucide-react'

// Import dashboard components
import SchoolOverview from '../components/school-admin/SchoolOverview'
import StudentsList from '../components/school-admin/StudentsList'
import FeeItemsList from '../components/school-admin/FeeItemsList'
import InvoiceGeneration from '../components/school-admin/InvoiceGeneration'
import Reports from '../components/school-admin/Reports'
import PasswordChangeModal from '../components/school-admin/PasswordChangeModal'
import FullLogo from '../components/FullLogo'

const SchoolAdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [showPasswordModal, setShowPasswordModal] = React.useState(false)

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/school-admin', 
      icon: BarChart3,
      description: 'Overview and statistics'
    },
    { 
      name: 'Students', 
      href: '/school-admin/students', 
      icon: Users,
      description: 'Manage student records'
    },
    { 
      name: 'Fee Items', 
      href: '/school-admin/fee-items', 
      icon: DollarSign,
      description: 'Configure fee types'
    },
    { 
      name: 'Generate Invoices', 
      href: '/school-admin/invoices', 
      icon: FileText,
      description: 'Create student invoices'
    },
    { 
      name: 'Reports', 
      href: '/school-admin/reports', 
      icon: BarChart3,
      description: 'View payment reports'
    },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="h-screen flex overflow-hidden relative">
      {/* Professional School Management Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpolygon points='50 0 100 50 50 100 0 50'/%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Modern Sidebar - Optimized width for better screen fit */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ width: '280px' }}>
        <div className="flex flex-col h-full">
          {/* Enhanced Logo and header */}
          <div className="flex items-center justify-between px-6 py-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
            <div className="flex items-center">
              <FullLogo size="medium" showText={true} className="text-white" />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Enhanced Navigation with better spacing */}
          <nav className="flex-1 px-6 py-6 space-y-3 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md hover:transform hover:scale-105'
                  }`}
                >
                  <item.icon
                    className={`mr-4 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className={`text-xs mt-1 ${
                      isActive ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Enhanced User profile */}
          <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">School Administrator</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  title="Change password"
                >
                  <Lock className="h-5 w-5" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - Full height */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Enhanced Top header */}
        <header className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 md:ml-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {navigation.find(item => item.href === location.pathname)?.description || 'School management overview'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Enhanced Notifications */}
              <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 relative group">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                <div className="absolute -bottom-12 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Notifications
                </div>
              </button>

              {/* Enhanced User menu */}
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Main content area with glass effect */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            <div className="max-w-7xl mx-auto px-6 py-6 h-full">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full">
                <Routes>
                  <Route path="/" element={<SchoolOverview />} />
                  <Route path="/students" element={<StudentsList />} />
                  <Route path="/fee-items" element={<FeeItemsList />} />
                  <Route path="/invoices" element={<InvoiceGeneration />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  )
}

export default SchoolAdminDashboard
