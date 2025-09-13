import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  X,
  Users,
  Download
} from 'lucide-react'

interface SimpleBulkImportProps {
  onClose: () => void
}

const SimpleBulkImport: React.FC<SimpleBulkImportProps> = ({ onClose }) => {
  const { schoolId } = useAuth()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [, setFile] = useState<File | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null)

  // Parse uploaded file
  const parseFile = useCallback((file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (fileExtension === 'csv') {
      Papa.parse(file, {
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors)
            return
          }
          
          const headers = results.data[0] as string[]
          const rows = results.data.slice(1) as string[][]
          
          // Simple mapping - just look for name and class columns
          const nameIndex = headers.findIndex(h => 
            h.toLowerCase().includes('name') || h.toLowerCase().includes('student')
          )
          const classIndex = headers.findIndex(h => 
            h.toLowerCase().includes('class') || h.toLowerCase().includes('grade')
          )
          
          if (nameIndex === -1 || classIndex === -1) {
            setErrors(['Please make sure your file has columns for student names and classes'])
            return
          }
          
          const parsedStudents = rows.map((row, index) => ({
            name: row[nameIndex]?.trim() || '',
            class_name: row[classIndex]?.trim() || '',
            row: index + 2
          })).filter(student => student.name && student.class_name)
          
          setStudents(parsedStudents)
          setStep('preview')
        },
        header: false,
        skipEmptyLines: true
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        
        if (jsonData.length === 0) return
        
        const headers = jsonData[0]
        const rows = jsonData.slice(1)
        
        // Simple mapping - just look for name and class columns
        const nameIndex = headers.findIndex(h => 
          h.toLowerCase().includes('name') || h.toLowerCase().includes('student')
        )
        const classIndex = headers.findIndex(h => 
          h.toLowerCase().includes('class') || h.toLowerCase().includes('grade')
        )
        
        if (nameIndex === -1 || classIndex === -1) {
          setErrors(['Please make sure your file has columns for student names and classes'])
          return
        }
        
        const parsedStudents = rows.map((row, index) => ({
          name: row[nameIndex]?.trim() || '',
          class_name: row[classIndex]?.trim() || '',
          row: index + 2
        })).filter(student => student.name && student.class_name)
        
        setStudents(parsedStudents)
        setStep('preview')
      }
      reader.readAsBinaryString(file)
    }
  }, [])

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      parseFile(file)
    }
  }, [parseFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (students: any[]) => {
      if (!schoolId) throw new Error('No school ID')
      
      const { data, error } = await supabase.rpc('bulk_insert_students', {
        p_school_id: schoolId,
        p_students_data: students
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const result = data?.[0]
      const successCount = result?.inserted_count || 0
      const errors = result?.errors || []
      
      setImportResults({ 
        success: successCount, 
        errors: errors.map((err: any) => `${err.student_name} (${err.class_name}): ${err.error}`)
      })
      setStep('complete')
      queryClient.invalidateQueries({ queryKey: ['students', schoolId] })
    },
    onError: (error) => {
      setImportResults({ success: 0, errors: [error.message] })
      setStep('complete')
    }
  })

  const handleImport = () => {
    if (students.length === 0) return
    setStep('importing')
    bulkImportMutation.mutate(students)
  }

  const resetImport = () => {
    setStep('upload')
    setFile(null)
    setStudents([])
    setErrors([])
    setImportResults(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Simple Bulk Import</h2>
              <p className="text-gray-600">Upload CSV or Excel file to import students</p>
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
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {isDragActive ? 'Drop your file here' : 'Upload CSV or Excel file'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span>Supported: .csv, .xlsx, .xls (Max 5MB)</span>
                  </div>
                </div>
              </div>

              {/* Simple Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">Simple File Format</h4>
                <div className="space-y-2 text-blue-800">
                  <p>• Your file just needs columns for student names and classes</p>
                  <p>• Column names can be anything (Name, Student Name, Class, Grade, etc.)</p>
                  <p>• We'll automatically find the right columns</p>
                </div>
                
                <div className="mt-4">
                  <h5 className="font-semibold text-blue-900 mb-2">Example:</h5>
                  <div className="bg-white border border-blue-300 rounded-lg p-3 font-mono text-sm">
                    Name,Class<br/>
                    Ahmed Hassan,Grade 1<br/>
                    Fatima Ali,Grade 2
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = '/student-import-template.csv'
                      link.download = 'student-import-template.csv'
                      link.click()
                    }}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Ready to Import</h3>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-semibold text-red-900 mb-2">Errors:</h5>
                  <ul className="text-red-800 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">
                    {students.length} students ready to import
                  </h4>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Class</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.slice(0, 10).map((student, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{student.name}</td>
                          <td className="px-4 py-3">{student.class_name}</td>
                          <td className="px-4 py-3">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length > 10 && (
                    <div className="text-center text-gray-500 text-sm mt-2">
                      ... and {students.length - 10} more students
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={resetImport}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={students.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Import {students.length} Students
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mx-auto mb-4">
                <Upload className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Importing Students...</h3>
              <p className="text-gray-600">Please wait while we process your data</p>
            </div>
          )}

          {step === 'complete' && importResults && (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Import Complete!</h3>
              <p className="text-gray-600 mb-6">
                Successfully imported {importResults.success} students
              </p>
              
              {importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <h5 className="font-semibold text-red-900 mb-2">Errors:</h5>
                  <ul className="text-red-800 text-sm space-y-1">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-center space-x-3">
                <button
                  onClick={resetImport}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Import More
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimpleBulkImport

