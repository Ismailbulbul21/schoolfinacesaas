import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Users, 
  School, 
  BarChart3, 
  LogOut,
  Plus,
  Building2
} from 'lucide-react'

// Import dashboard components (to be created)
import SchoolsList from '../components/super-admin/SchoolsList'
import CreateSchool from '../components/super-admin/CreateSchool'
import SystemStats from '../components/super-admin/SystemStats'
import FileUploadTest from '../components/super-admin/FileUploadTest'

const SuperAdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/super-admin', icon: BarChart3 },
    { name: 'Schools', href: '/super-admin/schools', icon: School },
    { name: 'Create School', href: '/super-admin/create-school', icon: Plus },
    { name: 'File Upload', href: '/super-admin/file-upload', icon: Users },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-sm border-r border-slate-200 shadow-xl">
          <div className="flex-1 flex flex-col pt-4 pb-3 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Finance Pro
              </span>
            </div>
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      } mr-3 flex-shrink-0 h-4 w-4`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-slate-200 p-3 bg-slate-50/50">
            <div className="flex items-center flex-1">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                  <span className="text-sm font-semibold text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">Super Admin</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-56 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-10 w-10 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
          >
            <span className="sr-only">Open sidebar</span>
            <Building2 className="h-5 w-5" />
          </button>
        </div>
        
        {/* Main content area */}
        <main className="flex-1">
          <div className="py-4">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <Routes>
                  <Route path="/" element={<SystemStats />} />
                  <Route path="/schools" element={<SchoolsList />} />
                  <Route path="/create-school" element={<CreateSchool />} />
                  <Route path="/file-upload" element={<FileUploadTest />} />
                </Routes>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SuperAdminDashboard
