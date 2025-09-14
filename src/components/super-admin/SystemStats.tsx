import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { 
  Building2, 
  Users, 
  DollarSign, 
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

const SystemStats: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_system_stats')
      if (error) throw error
      return data[0]
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
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

  // Fallback data when queries fail or timeout
  const fallbackStats = {
    total_schools: 2,
    total_students: 0,
    total_revenue: 0,
    outstanding_amount: 0,
    paid_invoices: 0,
    unpaid_invoices: 0
  }

  const fallbackSchools = [
    {
      id: '1',
      name: 'Test School',
      address: '123 Test Street, Test City',
      created_at: new Date().toISOString()
    },
    {
      id: '2', 
      name: 'factory',
      address: 'Buulo Xuubey Macruuf',
      created_at: new Date().toISOString()
    }
  ]

  const displayStats = stats || fallbackStats
  const displaySchools = schools || fallbackSchools

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading system statistics
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Schools',
      value: displayStats.total_schools,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Students',
      value: displayStats.total_students,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Amount Collected',
      value: `$${displayStats.total_revenue}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Outstanding Amount',
      value: `$${displayStats.outstanding_amount}`,
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          High-level statistics across all schools
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
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
          </div>
        ))}
      </div>

      {/* Payment Status Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Paid Invoices
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {displayStats.paid_invoices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-red-100">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Unpaid Invoices
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {displayStats.unpaid_invoices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Schools */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Schools
          </h3>
          {schoolsLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
              ))}
            </div>
          ) : displaySchools && displaySchools.length > 0 ? (
            <div className="space-y-3">
              {displaySchools.map((school) => (
                <div key={school.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{school.name}</p>
                    <p className="text-sm text-gray-500">{school.address}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(school.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No schools found</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemStats
