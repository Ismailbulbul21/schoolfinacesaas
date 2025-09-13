import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  FileText, 
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  GraduationCap
} from 'lucide-react'

interface FeeItem {
  id: string
  name: string
  amount: number
  school_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

interface Student {
  id: string
  name: string
  class_name: string
  school_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

// Prefilled invoice generation options
const PREFILLED_INVOICE_OPTIONS = [
  {
    id: 'monthly-tuition',
    name: 'Monthly Tuition (Lacagta Waxbarashada)',
    description: 'Generate monthly tuition invoices for all students',
    somaliDescription: 'Soo saar faktiyada lacagta waxbarashada bilka ah ee dhammaan ardayda',
    suggestedDueDate: 30, // days from today
    icon: '📚'
  },
  {
    id: 'exam-fee',
    name: 'Exam Fee (Lacagta Imtixaanka)',
    description: 'Generate exam fee invoices for all students',
    somaliDescription: 'Soo saar faktiyada lacagta imtixaanka ee dhammaan ardayda',
    suggestedDueDate: 14, // days from today
    icon: '📝'
  },
  {
    id: 'library-fee',
    name: 'Library Fee (Lacagta Maktabadda)',
    description: 'Generate library fee invoices for all students',
    somaliDescription: 'Soo saar faktiyada lacagta maktabadda ee dhammaan ardayda',
    suggestedDueDate: 7, // days from today
    icon: '📖'
  },
  {
    id: 'sports-fee',
    name: 'Sports Fee (Lacagta Ciyaaraha)',
    description: 'Generate sports fee invoices for all students',
    somaliDescription: 'Soo saar faktiyada lacagta ciyaaraha ee dhammaan ardayda',
    suggestedDueDate: 21, // days from today
    icon: '⚽'
  },
  {
    id: 'book-fee',
    name: 'Book Fee (Lacagta Buugga)',
    description: 'Generate book fee invoices for all students',
    somaliDescription: 'Soo saar faktiyada lacagta buugga ee dhammaan ardayda',
    suggestedDueDate: 14, // days from today
    icon: '📚'
  }
]

const InvoiceGeneration: React.FC = () => {
  const { schoolId } = useAuth()
  const [selectedFeeItem, setSelectedFeeItem] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)
  const [showPrefilledOptions, setShowPrefilledOptions] = useState(false)
  
  // Student selection state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState<string>('')
  const [showStudentSelection, setShowStudentSelection] = useState(false)
  
  const queryClient = useQueryClient()

  const { data: feeItems, isLoading: feeItemsLoading, error: feeItemsError } = useQuery({
    queryKey: ['fee-items', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('fee_items')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FeeItem[]
    },
    enabled: !!schoolId,
  })

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['students', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Student[]
    },
    enabled: !!schoolId,
  })

  const generateInvoicesMutation = useMutation({
    mutationFn: async ({ feeItemId, dueDate, studentIds }: { feeItemId: string; dueDate: string; studentIds?: string[] }) => {
      if (!schoolId) throw new Error('No school ID')
      
      if (studentIds && studentIds.length > 0) {
        // Generate invoices for specific students (with duplicate prevention)
        const { data, error } = await supabase.rpc('generate_invoices_for_students_no_duplicates', {
          p_school_id: schoolId,
          p_fee_item_id: feeItemId,
          p_due_date: dueDate,
          p_student_ids: studentIds
        })
        if (error) throw error
        return data
      } else {
        // Generate invoices for all students (with duplicate prevention)
        const { data, error } = await supabase.rpc('generate_invoices_for_school_no_duplicates', {
          p_school_id: schoolId,
          p_fee_item_id: feeItemId,
          p_due_date: dueDate
        })
        if (error) throw error
        return data
      }
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['school-stats', schoolId] })
      setGenerationResult({ 
        success: true, 
        message: `Successfully generated ${count} invoices!`, 
        count: count 
      })
      setSelectedFeeItem('')
      setDueDate('')
      setSelectedStudents(new Set())
      setShowStudentSelection(false)
    },
    onError: (error: any) => {
      setGenerationResult({ 
        success: false, 
        message: error.message || 'Failed to generate invoices' 
      })
    },
  })

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFeeItem || !dueDate) {
      setGenerationResult({ 
        success: false, 
        message: 'Please select a fee item and due date' 
      })
      return
    }

    setIsGenerating(true)
    setGenerationResult(null)

    try {
      const studentIds = selectedStudents.size > 0 ? Array.from(selectedStudents) : undefined
      await generateInvoicesMutation.mutateAsync({
        feeItemId: selectedFeeItem,
        dueDate: dueDate,
        studentIds: studentIds
      })
    } catch (error) {
      console.error('Error generating invoices:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrefilledInvoiceGeneration = async (option: typeof PREFILLED_INVOICE_OPTIONS[0]) => {
    // Find matching fee item
    const matchingFeeItem = feeItems?.find(item => 
      item.name.toLowerCase().includes(option.id.replace('-', ' ')) ||
      item.name.toLowerCase().includes(option.name.toLowerCase().split(' ')[0])
    )

    if (!matchingFeeItem) {
      setGenerationResult({ 
        success: false, 
        message: `No matching fee item found for ${option.name}. Please create the fee item first.` 
      })
      return
    }

    // Calculate suggested due date
    const today = new Date()
    const dueDate = new Date(today.getTime() + (option.suggestedDueDate * 24 * 60 * 60 * 1000))
    const dueDateString = dueDate.toISOString().split('T')[0]

    setIsGenerating(true)
    setGenerationResult(null)
    setShowPrefilledOptions(false)

    try {
      await generateInvoicesMutation.mutateAsync({
        feeItemId: matchingFeeItem.id,
        dueDate: dueDateString,
        studentIds: undefined // Use all students for prefilled options
      })
    } catch (error) {
      console.error('Error generating invoices:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedFeeItemData = feeItems?.find(item => item.id === selectedFeeItem)

  // Filter students based on search and class filter
  const filteredStudents = students?.filter(student => {
    const matchesSearch = (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (student.class_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesClass = !classFilter || student.class_name === classFilter
    return matchesSearch && matchesClass
  }) || []

  // Get students for individual selection
  // If individual selection is open, show all students (filtered by search)
  // If specific students are selected, show only those selected students
  const individualSelectionStudents = showStudentSelection 
    ? (selectedStudents.size > 0 
        ? students?.filter(student => selectedStudents.has(student.id)) || []
        : students?.filter(student => {
            const matchesSearch = (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                 (student.class_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            return matchesSearch
          }) || [])
    : []

  // Get unique classes for filter dropdown
  const uniqueClasses = [...new Set(students?.map(student => student.class_name) || [])].sort()

  // Student selection handlers
  const handleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedStudents.size === individualSelectionStudents.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(individualSelectionStudents.map(student => student.id)))
    }
  }

  const handleSelectAllInClass = (className: string) => {
    const classStudents = students?.filter(student => student.class_name === className) || []
    const classStudentIds = classStudents.map(student => student.id)
    
    const allClassSelected = classStudentIds.every(id => selectedStudents.has(id))
    
    const newSelection = new Set(selectedStudents)
    if (allClassSelected) {
      classStudentIds.forEach(id => newSelection.delete(id))
    } else {
      classStudentIds.forEach(id => newSelection.add(id))
    }
    setSelectedStudents(newSelection)
  }

  const clearSelection = () => {
    setSelectedStudents(new Set())
  }

  if (feeItemsLoading || studentsLoading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (feeItemsError || studentsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading data
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {feeItemsError?.message || studentsError?.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Simple Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Generate Invoices</h1>
        <p className="text-gray-600 mt-1">Create invoices for students</p>
      </div>

      {/* Generation Result */}
      {generationResult && (
        <div className={`mb-6 rounded-md p-4 ${generationResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {generationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${generationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {generationResult.message}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Prefilled Invoice Generation Modal */}
      {showPrefilledOptions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Quick Invoice Generation (Soo saar Faktiyada Dhaqso)
              </h3>
              <button
                onClick={() => setShowPrefilledOptions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Select a common invoice type to generate invoices for all students automatically.
              <br />
              <span className="text-gray-500">
                Dooro nooca faktiyada caadiga ah si aad u soo saarto faktiyada dhammaan ardayda si toos ah.
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {PREFILLED_INVOICE_OPTIONS.map((option) => {
                const matchingFeeItem = feeItems?.find(item => 
                  item.name.toLowerCase().includes(option.id.replace('-', ' ')) ||
                  item.name.toLowerCase().includes(option.name.toLowerCase().split(' ')[0])
                )
                const isAvailable = !!matchingFeeItem
                
                return (
                  <div
                    key={option.id}
                    onClick={() => isAvailable ? handlePrefilledInvoiceGeneration(option) : null}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isAvailable 
                        ? 'border-gray-200 hover:border-green-500 hover:bg-green-50' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{option.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{option.name}</h4>
                        {matchingFeeItem && (
                          <p className="text-xs text-green-600">${matchingFeeItem.amount}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{option.description}</p>
                    <p className="text-xs text-gray-400 mb-2">{option.somaliDescription}</p>
                    {isAvailable ? (
                      <div className="text-xs text-green-600 font-medium">
                        Click to generate (Guji si aad u soo saarto)
                      </div>
                    ) : (
                      <div className="text-xs text-red-600 font-medium">
                        Fee item not found (Lacagta lama helin)
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPrefilledOptions(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel (Jooji)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleGenerateInvoices} className="space-y-6">
          {/* Fee Item Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fee Item</label>
              <select
                value={selectedFeeItem}
                onChange={(e) => setSelectedFeeItem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select fee...</option>
                {feeItems?.map((feeItem) => (
                  <option key={feeItem.id} value={feeItem.id}>
                    {feeItem.name} - ${feeItem.amount}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              
              {/* Quick Date Selection */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-2">Quick select:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                      setDueDate(nextWeek.toISOString().split('T')[0])
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      dueDate === new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const nextTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
                      setDueDate(nextTwoWeeks.toISOString().split('T')[0])
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      dueDate === new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    +2 Weeks
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
                      setDueDate(nextMonth.toISOString().split('T')[0])
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      dueDate === new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    +1 Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                      setDueDate(endOfMonth.toISOString().split('T')[0])
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      dueDate === new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    End of Month
                  </button>
                </div>
              </div>
              
              {/* Date Input */}
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {/* Date Preview */}
              {dueDate && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">
                      Due: {new Date(dueDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Students</label>
            
            {/* Quick Selection Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedStudents(new Set())
                  setShowStudentSelection(true)
                }}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  selectedStudents.size === 0 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="h-6 w-6 mx-auto mb-1" />
                <div className="font-medium">All Students</div>
                <div className="text-xs text-gray-500">{students?.length || 0} students</div>
              </button>
              
              {uniqueClasses.map((className) => {
                const classStudents = students?.filter(s => s.class_name === className) || []
                const isSelected = classStudents.every(s => selectedStudents.has(s.id)) && classStudents.length > 0
                
                return (
                  <button
                    key={className}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        // Deselect all students in this class
                        const newSelected = new Set(selectedStudents)
                        classStudents.forEach(s => newSelected.delete(s.id))
                        setSelectedStudents(newSelected)
                      } else {
                        // Select all students in this class
                        const newSelected = new Set(selectedStudents)
                        classStudents.forEach(s => newSelected.add(s.id))
                        setSelectedStudents(newSelected)
                        setShowStudentSelection(true)
                      }
                    }}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      isSelected 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="h-6 w-6 mx-auto mb-1" />
                    <div className="font-medium">Class {className}</div>
                    <div className="text-xs text-gray-500">{classStudents.length} students</div>
                  </button>
                )
              })}
            </div>
            
            {/* Individual Student Selection */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">
                {selectedStudents.size > 0 ? `${selectedStudents.size} students selected` : 'All students will be included'}
              </span>
              <button
                type="button"
                onClick={() => setShowStudentSelection(!showStudentSelection)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showStudentSelection ? 'Hide individual selection' : 'Select individual students'}
              </button>
            </div>

            {/* Individual Student List */}
            {showStudentSelection && (
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {/* Quick Actions */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Clear
                  </button>
                  <span className="text-xs text-gray-500 px-2 py-1">
                    {selectedStudents.size} of {individualSelectionStudents.length} selected
                  </span>
                </div>

                {/* Search */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* Student List */}
                <div className="space-y-2">
                  {individualSelectionStudents.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No students found
                    </div>
                  ) : (
                    individualSelectionStudents.map((student) => (
                      <div key={student.id} className="flex items-center p-2 hover:bg-gray-100 rounded">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => handleStudentSelection(student.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name || 'Unnamed Student'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Class {student.class_name}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedStudents.size > 0 
                ? `${selectedStudents.size} students selected`
                : `All ${students?.length || 0} students`
              }
            </div>
            <button
              type="submit"
              disabled={isGenerating || !selectedFeeItem || !dueDate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Invoices'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InvoiceGeneration
