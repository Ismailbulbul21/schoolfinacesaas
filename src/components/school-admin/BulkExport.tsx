import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Download, 
  FileText, 
  X, 
  CheckCircle,
  Settings,
  Users
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface BulkExportProps {
  onClose: () => void
}

const BulkExport: React.FC<BulkExportProps> = ({ onClose }) => {
  const { schoolId } = useAuth()
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'class_name', 'student_id'])
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx')
  const [isExporting, setIsExporting] = useState(false)

  // Fetch students data
  const { data: students, isLoading } = useQuery({
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
      return data || []
    },
    enabled: !!schoolId
  })

  // Available columns for export
  const availableColumns = [
    { id: 'name', label: 'Full Name', required: true },
    { id: 'student_id', label: 'Student ID', required: false },
    { id: 'class_name', label: 'Class/Grade', required: true },
    { id: 'email', label: 'Email', required: false },
    { id: 'phone', label: 'Phone', required: false },
    { id: 'date_of_birth', label: 'Date of Birth', required: false },
    { id: 'gender', label: 'Gender', required: false },
    { id: 'parent_name', label: 'Parent Name', required: false },
    { id: 'parent_phone', label: 'Parent Phone', required: false },
    { id: 'parent_email', label: 'Parent Email', required: false },
    { id: 'home_address', label: 'Home Address', required: false },
    { id: 'emergency_contact', label: 'Emergency Contact', required: false },
    { id: 'admission_date', label: 'Admission Date', required: false },
    { id: 'academic_year', label: 'Academic Year', required: false },
    { id: 'transportation', label: 'Transportation', required: false },
    { id: 'medical_conditions', label: 'Medical Conditions', required: false },
    { id: 'allergies', label: 'Allergies', required: false },
    { id: 'notes', label: 'Notes', required: false }
  ]

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId)
      } else {
        return [...prev, columnId]
      }
    })
  }

  const handleExport = async () => {
    if (!students || selectedColumns.length === 0) return

    setIsExporting(true)

    try {
      // Prepare data for export
      const exportData = students.map(student => {
        const row: any = {}
        selectedColumns.forEach(columnId => {
          const column = availableColumns.find(col => col.id === columnId)
          if (column) {
            let value = student[columnId as keyof typeof student]
            
            // Format dates
            if (columnId.includes('date') && value) {
              value = new Date(value as string).toLocaleDateString()
            }
            
            row[column.label] = value || ''
          }
        })
        return row
      })

      if (exportFormat === 'csv') {
        // Export as CSV
        const csvContent = [
          selectedColumns.map(col => availableColumns.find(c => c.id === col)?.label).join(','),
          ...exportData.map(row => 
            selectedColumns.map(col => {
              const value = row[availableColumns.find(c => c.id === col)?.label || '']
              return `"${(value || '').toString().replace(/"/g, '""')}"`
            }).join(',')
          )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      } else {
        // Export as Excel
        const worksheet = XLSX.utils.json_to_sheet(exportData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
        
        XLSX.writeFile(workbook, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`)
      }

      // Show success message briefly
      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 1000)

    } catch (error) {
      console.error('Export error:', error)
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Export Students</h2>
              <p className="text-gray-600">Export student data to CSV or Excel</p>
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
          {/* Export Format Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h3>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="xlsx"
                  checked={exportFormat === 'xlsx'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx')}
                  className="mr-2"
                />
                <span className="text-gray-700">Excel (.xlsx)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx')}
                  className="mr-2"
                />
                <span className="text-gray-700">CSV (.csv)</span>
              </label>
            </div>
          </div>

          {/* Column Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Columns to Export</h3>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {availableColumns.map((column) => (
                <label
                  key={column.id}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedColumns.includes(column.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.id)}
                    onChange={() => handleColumnToggle(column.id)}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {column.label}
                    </span>
                    {column.required && (
                      <span className="ml-2 text-xs text-red-600 font-medium">Required</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                Exporting {students?.length || 0} students with {selectedColumns.length} columns
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={selectedColumns.length === 0 || isExporting}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Students
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkExport


