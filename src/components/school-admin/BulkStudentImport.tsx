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
  Download,
  X,
  Users
} from 'lucide-react'

interface StudentData {
  name: string
  class_name: string
}

interface ParsedData {
  headers: string[]
  rows: string[][]
  mappedData: StudentData[]
  errors: string[]
}

interface ColumnMapping {
  name: string | null
  class_name: string | null
}

const BulkStudentImport: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { schoolId } = useAuth()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload')
  const [, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ name: null, class_name: null })
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null)

  // Smart column detection
  const detectColumns = (headers: string[]): ColumnMapping => {
    const nameVariations = [
      'name', 'student name', 'full name', 'student full name',
      'magaca_ardayga', 'magaca ardayga', 'اسم الطالب',
      'nom étudiant', 'nombre estudiante', 'nome estudante'
    ]
    
    const classVariations = [
      'class_name', 'class', 'grade', 'class name', 'section', 'form',
      'fasalka', 'fasalka', 'الصف', 'classe', 'grado', 'classe'
    ]

    const mapping: ColumnMapping = { name: null, class_name: null }

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim()
      
      // Check for name column
      if (nameVariations.some(variation => 
        lowerHeader.includes(variation.toLowerCase()) || 
        variation.toLowerCase().includes(lowerHeader)
      )) {
        mapping.name = header
      }
      
      // Check for class column
      if (classVariations.some(variation => 
        lowerHeader.includes(variation.toLowerCase()) || 
        variation.toLowerCase().includes(lowerHeader)
      )) {
        mapping.class_name = header
      }
    })

    return mapping
  }

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
          const detectedMapping = detectColumns(headers)
          
          setParsedData({
            headers,
            rows,
            mappedData: [],
            errors: []
          })
          setColumnMapping(detectedMapping)
          setStep('mapping')
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
        const detectedMapping = detectColumns(headers)
        
        setParsedData({
          headers,
          rows,
          mappedData: [],
          errors: []
        })
        setColumnMapping(detectedMapping)
        setStep('mapping')
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

  // Process mapped data
  const processMappedData = () => {
    if (!parsedData || !columnMapping.name || !columnMapping.class_name) return

    const nameIndex = parsedData.headers.indexOf(columnMapping.name)
    const classIndex = parsedData.headers.indexOf(columnMapping.class_name)
    
    const mappedData: StudentData[] = []
    const errors: string[] = []

    parsedData.rows.forEach((row, index) => {
      const name = row[nameIndex]?.trim()
      const className = row[classIndex]?.trim()

      if (!name) {
        errors.push(`Row ${index + 2}: Empty name field`)
        return
      }

      if (!className) {
        errors.push(`Row ${index + 2}: Empty class field`)
        return
      }

      // Clean and standardize name
      const cleanName = name
        .replace(/[,_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      // Clean class name
      const cleanClassName = className
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/class|grade|form/i, '')
        .trim()

      mappedData.push({
        name: cleanName,
        class_name: cleanClassName || className.toLowerCase()
      })
    })

    setParsedData(prev => prev ? { ...prev, mappedData, errors } : null)
    setStep('preview')
  }

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (students: StudentData[]) => {
      if (!schoolId) throw new Error('No school ID')
      
      const { data, error } = await supabase.rpc('bulk_insert_students', {
        p_school_id: schoolId,
        p_students_data: students
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // The function returns an array with [inserted_count, error_count, errors]
      const result = data?.[0]
      const successCount = result?.inserted_count || 0
      // const _errorCount = result?.error_count || 0
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
    if (!parsedData?.mappedData) return
    setStep('importing')
    bulkImportMutation.mutate(parsedData.mappedData)
  }

  const resetImport = () => {
    setStep('upload')
    setFile(null)
    setParsedData(null)
    setColumnMapping({ name: null, class_name: null })
    setImportResults(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Bulk Import Students</h2>
              <p className="text-gray-600">Upload CSV or Excel file to import multiple students</p>
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

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">File Format Requirements</h4>
                <div className="space-y-2 text-blue-800">
                  <p>• Your file must contain columns for student names and classes</p>
                  <p>• Column names can be in any language (English, Somali, Arabic, etc.)</p>
                  <p>• Extra columns will be ignored automatically</p>
                  <p>• Student IDs will be generated automatically</p>
                </div>
                
                <div className="mt-4">
                  <h5 className="font-semibold text-blue-900 mb-2">Example CSV format:</h5>
                  <div className="bg-white border border-blue-300 rounded-lg p-3 font-mono text-sm">
                    name,class_name<br/>
                    Ahmed Hassan,c1<br/>
                    Fatima Ali,c2
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

          {step === 'mapping' && parsedData && (
            <div className="space-y-6">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Column Mapping</h3>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Detected Columns:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Name Column
                    </label>
                    <select
                      value={columnMapping.name || ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select column...</option>
                      {parsedData.headers.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Column
                    </label>
                    <select
                      value={columnMapping.class_name || ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, class_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select column...</option>
                      {parsedData.headers.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
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
                  onClick={processMappedData}
                  disabled={!columnMapping.name || !columnMapping.class_name}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && parsedData && (
            <div className="space-y-6">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Import Preview</h3>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">
                    {parsedData.mappedData.length} students ready to import
                  </h4>
                  {parsedData.errors.length > 0 && (
                    <span className="text-red-600 text-sm">
                      {parsedData.errors.length} errors found
                    </span>
                  )}
                </div>

                {parsedData.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold text-red-900 mb-2">Errors:</h5>
                    <ul className="text-red-800 text-sm space-y-1">
                      {parsedData.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

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
                      {parsedData.mappedData.map((student, index) => (
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
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={parsedData.mappedData.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Import {parsedData.mappedData.length} Students
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

export default BulkStudentImport
