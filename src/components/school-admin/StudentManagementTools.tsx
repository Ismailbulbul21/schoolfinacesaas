import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Settings, 
  Filter, 
  Search, 
  SortAsc, 
  SortDesc,
  Users,
  GraduationCap,
  Calendar,
  BarChart3,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface StudentManagementToolsProps {
  onClose: () => void
  onFilterChange: (filters: any) => void
  onSortChange: (sort: any) => void
  currentFilters: any
  currentSort: any
}

const StudentManagementTools: React.FC<StudentManagementToolsProps> = ({
  onClose,
  onFilterChange,
  onSortChange,
  currentFilters,
  currentSort
}) => {
  const { schoolId } = useAuth()
  const [filters, setFilters] = useState(currentFilters)
  const [sort, setSort] = useState(currentSort)

  // Fetch class statistics
  const { data: classStats } = useQuery({
    queryKey: ['class-stats', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('students')
        .select('class_name')
        .eq('school_id', schoolId)
        .eq('is_active', true)
      
      if (error) throw error
      
      // Count students per class
      const stats = data?.reduce((acc: any, student) => {
        const className = student.class_name || 'Unknown'
        acc[className] = (acc[className] || 0) + 1
        return acc
      }, {}) || {}
      
      return Object.entries(stats).map(([className, count]) => ({
        className,
        count: count as number
      }))
    },
    enabled: !!schoolId
  })

  const handleApplyFilters = () => {
    onFilterChange(filters)
    onSortChange(sort)
    onClose()
  }

  const handleResetFilters = () => {
    const defaultFilters = {
      classFilter: '',
      genderFilter: '',
      hasContact: false,
      hasParentInfo: false,
      dateRange: {
        start: '',
        end: ''
      }
    }
    const defaultSort = {
      field: 'name',
      direction: 'asc'
    }
    
    setFilters(defaultFilters)
    setSort(defaultSort)
    onFilterChange(defaultFilters)
    onSortChange(defaultSort)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Student Management Tools</h2>
              <p className="text-gray-600">Advanced filtering and sorting options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Filters Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                Filters
              </h3>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Class
                </label>
                <select
                  value={filters.classFilter}
                  onChange={(e) => setFilters({ ...filters, classFilter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Classes</option>
                  {classStats?.map((stat) => (
                    <option key={stat.className} value={stat.className}>
                      {stat.className} ({stat.count} students)
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Gender
                </label>
                <select
                  value={filters.genderFilter}
                  onChange={(e) => setFilters({ ...filters, genderFilter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Contact Info Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Filters
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasContact}
                    onChange={(e) => setFilters({ ...filters, hasContact: e.target.checked })}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Has contact information</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasParentInfo}
                    onChange={(e) => setFilters({ ...filters, hasParentInfo: e.target.checked })}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Has parent information</span>
                </label>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        dateRange: { ...filters.dateRange, start: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        dateRange: { ...filters.dateRange, end: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sorting Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <SortAsc className="w-5 h-5 mr-2 text-green-600" />
                Sorting
              </h3>

              {/* Sort Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  value={sort.field}
                  onChange={(e) => setSort({ ...sort, field: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Name</option>
                  <option value="class_name">Class</option>
                  <option value="student_id">Student ID</option>
                  <option value="created_at">Admission Date</option>
                  <option value="date_of_birth">Date of Birth</option>
                  <option value="gender">Gender</option>
                </select>
              </div>

              {/* Sort Direction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Direction
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="asc"
                      checked={sort.direction === 'asc'}
                      onChange={(e) => setSort({ ...sort, direction: e.target.value })}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <SortAsc className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-700">Ascending (A-Z)</span>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="desc"
                      checked={sort.direction === 'desc'}
                      onChange={(e) => setSort({ ...sort, direction: e.target.value })}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <SortDesc className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-700">Descending (Z-A)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Class Statistics */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" />
                  Class Statistics
                </h4>
                <div className="space-y-2">
                  {classStats?.map((stat) => (
                    <div key={stat.className} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{stat.className}</span>
                      <span className="text-gray-500">{stat.count} students</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleResetFilters}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
            >
              Reset All
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Apply Filters & Sort
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentManagementTools


