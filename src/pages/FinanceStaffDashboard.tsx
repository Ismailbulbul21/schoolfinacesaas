import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Building2, LogOut } from 'lucide-react'

const FinanceStaffDashboard: React.FC = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Finance Staff Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Finance Staff Dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">
              This dashboard is under development. You'll be able to manage student payments and upload payment data here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinanceStaffDashboard
