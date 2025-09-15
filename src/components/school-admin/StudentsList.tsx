import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import FlexibleBulkImport from './FlexibleBulkImport'
import { StudentPrint } from '../PrintUtils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Users,
  GraduationCap,
  Upload,
  RefreshCw,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  FileText,
  X
} from 'lucide-react'

interface Student {
  id: string
  name: string
  class_name: string
  school_id: string
  created_at: string
  updated_at: string
  is_active: boolean
  student_id?: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  parent_name?: string
  parent_phone?: string
  parent_email?: string
  home_address?: string
  emergency_contact?: string
  admission_date?: string
  academic_year?: string
  transportation?: string
  medical_conditions?: string
  allergies?: string
  notes?: string
}

const StudentsList: React.FC = () => {
  const { schoolId } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [importedColumns, setImportedColumns] = useState<string[]>([])
  const [newStudent, setNewStudent] = useState({ name: '', class_name: '' })
  const queryClient = useQueryClient()



  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching students:', error)
        throw error
      }
      // Ensure all students have proper data
      return (data || []).map(student => ({
        ...student,
        name: student.name || '',
        class_name: student.class_name || ''
      })) as Student[]
    },
    enabled: !!schoolId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the data
  })

  const addStudentMutation = useMutation({
    mutationFn: async (studentData: { name: string; class_name: string }) => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('students')
        .insert({
          name: studentData.name,
          class_name: studentData.class_name,
          school_id: schoolId,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', schoolId] })
      setNewStudent({ name: '', class_name: '' })
      setShowAddForm(false)
    },
  })

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, name, class_name }: { id: string; name: string; class_name: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update({ name, class_name })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', schoolId] })
      setEditingStudent(null)
    },
  })

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      // First delete all invoices for this student
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('student_id', studentId)
      
      if (invoiceError) {
        console.error('Error deleting student invoices:', invoiceError)
        throw invoiceError
      }

      // Then delete the student record completely
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', schoolId] })
      // Also invalidate reports to refresh the data
      queryClient.invalidateQueries({ queryKey: ['invoices', schoolId] })
    },
  })

  const filteredStudents = students?.filter((student: Student) => {
    const nameMatch = (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const classMatch = (student.class_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    return nameMatch || classMatch
  }) || []



  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault()
    if (newStudent.name.trim() && newStudent.class_name.trim()) {
      addStudentMutation.mutate(newStudent)
    }
  }

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingStudent && editingStudent.name.trim() && editingStudent.class_name.trim()) {
      updateStudentMutation.mutate({
        id: editingStudent.id,
        name: editingStudent.name,
        class_name: editingStudent.class_name,
      })
    }
  }

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!studentId) {
      console.error('Student ID is undefined')
      return
    }
    
    if (window.confirm(`Are you sure you want to remove ${studentName || 'this student'}?`)) {
      try {
        await deleteStudentMutation.mutateAsync(studentId)
      } catch (error) {
        console.error('Error deleting student:', error)
      }
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['students', schoolId] })
  }

  const handleImportComplete = (columns: string[]) => {
    setImportedColumns(columns)
  }

  // Determine which columns to show in the table
  const getVisibleColumns = () => {
    const defaultColumns = ['name', 'class_name'] // Always show these
    const allColumns = [...defaultColumns, ...importedColumns]
    return [...new Set(allColumns)] // Remove duplicates
  }

  const visibleColumns = getVisibleColumns()

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-6 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                Error loading students
              </h3>
              <p className="mt-2 text-sm text-red-700">
                {error.message}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Students</h1>
            <p className="text-sm text-gray-600">{filteredStudents.length} students</p>
            {importedColumns.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-blue-600">
                  Showing columns: {importedColumns.map(col => {
                    const columnNames: Record<string, string> = {
                      'name': 'Name',
                      'class_name': 'Class',
                      'email': 'Email',
                      'phone': 'Phone',
                      'parent_name': 'Parent',
                      'student_id': 'Student ID',
                      'date_of_birth': 'Date of Birth',
                      'gender': 'Gender'
                    };
                    return columnNames[col] || col;
                  }).join(', ')}
                </p>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-xs font-medium text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
            <button
              onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-xs font-medium text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Upload className="h-4 w-4 mr-1" />
              Import Students
            </button>
            {students && students.length > 0 && (
              <StudentPrint 
                students={students} 
                className="inline-flex"
              />
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-xs font-medium text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
        </div>
      </div>



      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Student</h3>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Student Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="mt-2 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-3 px-4"
                  placeholder="Enter student name"
                  required
                />
              </div>
              <div>
                <label htmlFor="class_name" className="block text-sm font-medium text-gray-700">
                  Class
                </label>
                <input
                  type="text"
                  id="class_name"
                  value={newStudent.class_name}
                  onChange={(e) => setNewStudent({ ...newStudent, class_name: e.target.value })}
                  className="mt-2 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-3 px-4"
                  placeholder="Enter class name"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-white py-3 px-6 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addStudentMutation.isPending}
                className="inline-flex justify-center py-3 px-6 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
              >
                {addStudentMutation.isPending ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'No students match your search criteria.' : 'Get started by adding your first student.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  {visibleColumns.includes('student_id') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  {(visibleColumns.includes('email') || visibleColumns.includes('phone')) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                  )}
                  {visibleColumns.includes('parent_name') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student: Student, index: number) => (
                  <tr key={student.id || `student-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name || 'Unnamed Student'}
                          </div>
                          {student.gender && (
                            <div className="text-xs text-gray-500 capitalize">{student.gender}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {visibleColumns.includes('student_id') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.student_id || 'Auto-generated'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.class_name || 'No Class'}</div>
                      {student.academic_year && (
                        <div className="text-xs text-gray-500">{student.academic_year}</div>
                      )}
                    </td>
                    {(visibleColumns.includes('email') || visibleColumns.includes('phone')) && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.email && (
                            <div className="text-xs text-gray-600">{student.email}</div>
                          )}
                          {student.phone && (
                            <div className="text-xs text-gray-600">{student.phone}</div>
                          )}
                          {!student.email && !student.phone && (
                            <div className="text-xs text-gray-400">No contact info</div>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('parent_name') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.parent_name && (
                            <div className="text-xs text-gray-600">{student.parent_name}</div>
                          )}
                          {student.parent_phone && (
                            <div className="text-xs text-gray-600">{student.parent_phone}</div>
                          )}
                          {!student.parent_name && !student.parent_phone && (
                            <div className="text-xs text-gray-400">No parent info</div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded transition-colors"
                          title="Edit Student"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.name || 'Unnamed Student')}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                          title="Delete Student"
                          disabled={deleteStudentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple Bulk Import Modal */}
      {showBulkImport && (
        <FlexibleBulkImport 
          onClose={() => setShowBulkImport(false)} 
          onImportComplete={handleImportComplete}
        />
      )}


      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Student</h3>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                  Student Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editingStudent.name?.trim() || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-class" className="block text-sm font-medium text-gray-700">
                  Class
                </label>
                <input
                  type="text"
                  id="edit-class"
                  value={editingStudent.class_name?.trim() || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, class_name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStudentMutation.isPending}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateStudentMutation.isPending ? 'Updating...' : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Student Details</h3>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{viewingStudent.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Student ID</label>
                    <p className="text-gray-900">{viewingStudent.student_id || 'Auto-generated'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Class/Grade</label>
                    <p className="text-gray-900">{viewingStudent.class_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-gray-900 capitalize">{viewingStudent.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">
                      {viewingStudent.date_of_birth 
                        ? new Date(viewingStudent.date_of_birth).toLocaleDateString() 
                        : 'Not provided'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-green-600" />
                  Contact Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingStudent.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingStudent.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Home Address</label>
                    <p className="text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingStudent.home_address || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Parent/Guardian Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Name</label>
                    <p className="text-gray-900">{viewingStudent.parent_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Phone</label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingStudent.parent_phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Email</label>
                    <p className="text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {viewingStudent.parent_email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-gray-900">{viewingStudent.emergency_contact || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                  Academic Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Admission Date</label>
                    <p className="text-gray-900">
                      {viewingStudent.admission_date 
                        ? new Date(viewingStudent.admission_date).toLocaleDateString() 
                        : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Academic Year</label>
                    <p className="text-gray-900">{viewingStudent.academic_year || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Transportation</label>
                    <p className="text-gray-900">{viewingStudent.transportation || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Health Information */}
              {(viewingStudent.medical_conditions || viewingStudent.allergies) && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-600" />
                    Health Information
                  </h4>
                  <div className="space-y-3">
                    {viewingStudent.medical_conditions && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Medical Conditions</label>
                        <p className="text-gray-900">{viewingStudent.medical_conditions}</p>
                      </div>
                    )}
                    {viewingStudent.allergies && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Allergies</label>
                        <p className="text-gray-900">{viewingStudent.allergies}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {viewingStudent.notes && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                    Additional Notes
                  </h4>
                  <p className="text-gray-900">{viewingStudent.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setEditingStudent(viewingStudent)
                  setViewingStudent(null)
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Edit Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentsList
