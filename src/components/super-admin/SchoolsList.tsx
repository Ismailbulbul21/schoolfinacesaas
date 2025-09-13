import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// Define types locally to avoid export issues
interface School {
  id: string
  name: string
  address?: string
  phone?: string
  created_at: string
  updated_at: string
  is_active: boolean
  total_students: number
  total_invoices: number
  unpaid_invoices: number
  total_unpaid_amount: number
}

import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Building2,
  Phone,
  MapPin,
  Calendar,
  Power,
  PowerOff,
  AlertTriangle,
  DollarSign,
  Users,
  FileText
} from 'lucide-react'
import { Link } from 'react-router-dom'

const SchoolsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [deactivateReason, setDeactivateReason] = useState('')
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: schools, isLoading, error } = useQuery({
    queryKey: ['schools-with-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_schools_with_status')
      if (error) throw error
      return data as School[]
    },
  })

  const toggleSchoolStatusMutation = useMutation({
    mutationFn: async ({ schoolId, isActive, reason }: { schoolId: string; isActive: boolean; reason?: string }) => {
      const { data, error } = await supabase.rpc('toggle_school_active_status', {
        p_school_id: schoolId,
        p_is_active: isActive,
        p_reason: reason
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-with-status'] })
      setShowDeactivateModal(false)
      setSelectedSchool(null)
      setDeactivateReason('')
    },
  })

  const filteredSchools = schools?.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.address?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && school.is_active) ||
                         (statusFilter === 'inactive' && !school.is_active)
    return matchesSearch && matchesStatus
  }) || []

  const handleToggleSchoolStatus = (school: School) => {
    if (school.is_active) {
      // Deactivate school
      setSelectedSchool(school)
      setShowDeactivateModal(true)
    } else {
      // Activate school
      toggleSchoolStatusMutation.mutate({
        schoolId: school.id,
        isActive: true
      })
    }
  }

  const handleConfirmDeactivation = () => {
    if (selectedSchool) {
      toggleSchoolStatusMutation.mutate({
        schoolId: selectedSchool.id,
        isActive: false,
        reason: deactivateReason
      })
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading schools
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all schools in the system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/super-admin/create-school"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add School
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Schools</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schools List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredSchools.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No schools</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No schools match your search.' : 'Get started by creating a new school.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  to="/super-admin/create-school"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add School
                </Link>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredSchools.map((school) => (
              <li key={school.id} className={`${!school.is_active ? 'bg-gray-50' : ''}`}>
                <div className="px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          school.is_active ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Building2 className={`h-6 w-6 ${
                            school.is_active ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {school.name}
                          </h3>
                          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            school.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {school.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {/* School Details */}
                        <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500 space-x-4">
                          {school.address && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {school.address}
                            </div>
                          )}
                          {school.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {school.phone}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(school.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="font-medium">{school.total_students}</span>
                            <span className="text-gray-500 ml-1">students</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <FileText className="h-4 w-4 mr-2 text-green-500" />
                            <span className="font-medium">{school.total_invoices}</span>
                            <span className="text-gray-500 ml-1">invoices</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                            <span className="font-medium">{school.unpaid_invoices}</span>
                            <span className="text-gray-500 ml-1">unpaid</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-4 w-4 mr-2 text-red-500" />
                            <span className="font-medium">${school.total_unpaid_amount.toFixed(2)}</span>
                            <span className="text-gray-500 ml-1">owed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50"
                        title="Edit School"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleSchoolStatus(school)}
                        className={`p-2 rounded-lg transition-colors ${
                          school.is_active
                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={school.is_active ? 'Deactivate School' : 'Activate School'}
                        disabled={toggleSchoolStatusMutation.isPending}
                      >
                        {school.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Deactivation Modal */}
      {showDeactivateModal && selectedSchool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Deactivate School
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to deactivate <strong>{selectedSchool.name}</strong>?
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    This will prevent the school from accessing the system.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for deactivation (optional)
                </label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="Enter reason for deactivation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeactivateModal(false)
                    setSelectedSchool(null)
                    setDeactivateReason('')
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeactivation}
                  disabled={toggleSchoolStatusMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {toggleSchoolStatusMutation.isPending ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchoolsList
