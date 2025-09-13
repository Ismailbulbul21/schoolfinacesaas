import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'

const SchoolOverview: React.FC = () => {
  const { schoolId } = useAuth()

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['school-stats', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase.rpc('get_school_stats', {
        p_school_id: schoolId
      })
      if (error) throw error
      return data[0]
    },
    enabled: !!schoolId,
  })

  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!schoolId,
  })

  const { data: recentStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ['recent-students', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
    enabled: !!schoolId,
  })

  if (statsLoading || schoolLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading school statistics
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {statsError.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Students',
      value: stats?.total_students || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/school-admin/students',
      visible: true
    },
    {
      name: 'Amount Collected',
      value: `$${stats?.total_amount_collected || 0}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/school-admin/reports',
      visible: true
    },
    {
      name: 'Paid Invoices',
      value: stats?.total_paid_invoices || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/school-admin/reports',
      visible: true
    },
    {
      name: 'Outstanding Amount',
      value: `$${stats?.total_amount_outstanding || 0}`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      href: '/school-admin/reports',
      visible: true
    },
  ].filter(card => card.visible)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {school?.name || 'School Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your school management dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link
          to="/school-admin/students"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">Manage Students</h3>
                <p className="text-sm text-gray-500">Add, edit, or remove students</p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/school-admin/fee-items"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">Fee Items</h3>
                <p className="text-sm text-gray-500">Create and manage fee types</p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/school-admin/invoices"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-purple-100">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">Generate Invoices</h3>
                <p className="text-sm text-gray-500">Create invoices for all students</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Students */}
      <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Students
            </h3>
          {studentsLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
              ))}
            </div>
          ) : recentStudents && recentStudents.length > 0 ? (
            <div className="space-y-3">
              {recentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.class_name}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(student.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No students found</p>
          )}
            <div className="mt-4">
              <Link
                to="/school-admin/students"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all students →
              </Link>
            </div>
          </div>
        </div>
    </div>
  )
}

export default SchoolOverview

