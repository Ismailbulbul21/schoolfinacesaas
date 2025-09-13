import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FileUpload from './FileUpload'
import DataValidator from './DataValidator'
import { validateData } from '../utils/validation'

// Define ValidationError interface locally to avoid import issues
interface ValidationError {
  row: number
  field: string
  message: string
  value?: any
}
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Download,
  FileText,
  Users,
  DollarSign
} from 'lucide-react'

interface BulkUploadProps {
  type: 'students' | 'payments' | 'fee_items'
  onSuccess?: (count: number) => void
  onError?: (error: string) => void
}

const BulkUpload: React.FC<BulkUploadProps> = ({ type, onSuccess, onError }) => {
  const [uploadedData, setUploadedData] = useState<any[]>([])
  const [parseErrors, setParseErrors] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isValid, setIsValid] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { schoolId } = useAuth()
  const queryClient = useQueryClient()

  const getTypeConfig = () => {
    switch (type) {
      case 'students':
        return {
          title: 'Upload Students',
          description: 'Upload a CSV or Excel file with student data',
          requiredFields: ['name', 'class_name'],
          icon: Users,
          sampleData: [
            { name: 'Ahmed Hassan', class_name: 'Grade 1' },
            { name: 'Fatima Ali', class_name: 'Grade 2' },
            { name: 'Omar Mohamed', class_name: 'Grade 1' }
          ]
        }
      case 'payments':
        return {
          title: 'Upload Payments',
          description: 'Upload a CSV or Excel file with payment data',
          requiredFields: ['student_name', 'class_name', 'fee_item', 'status'],
          icon: DollarSign,
          sampleData: [
            { student_name: 'Ahmed Hassan', class_name: 'Grade 1', fee_item: 'Monthly Tuition', status: 'paid', amount: 50, date: '2024-01-15' },
            { student_name: 'Fatima Ali', class_name: 'Grade 2', fee_item: 'Exam Fee', status: 'unpaid', amount: 25, date: '' }
          ]
        }
      case 'fee_items':
        return {
          title: 'Upload Fee Items',
          description: 'Upload a CSV or Excel file with fee item data',
          requiredFields: ['name', 'amount'],
          icon: FileText,
          sampleData: [
            { name: 'Monthly Tuition', amount: 50 },
            { name: 'Exam Fee', amount: 25 },
            { name: 'Library Fee', amount: 10 }
          ]
        }
    }
  }

  const config = getTypeConfig()
  const IconComponent = config.icon

  const bulkInsertMutation = useMutation({
    mutationFn: async (data: any[]) => {
      if (!schoolId) {
        throw new Error('School ID not found')
      }

      switch (type) {
        case 'students':
          return await supabase.rpc('bulk_insert_students', {
            p_school_id: schoolId,
            p_students_data: data
          })
        case 'payments':
          return await supabase.rpc('bulk_update_payments', {
            p_school_id: schoolId,
            p_payments_data: data
          })
        case 'fee_items':
          // For fee items, we'll insert directly since we don't have a bulk function yet
          const { data: result, error } = await supabase
            .from('fee_items')
            .insert(data.map(item => ({
              ...item,
              school_id: schoolId
            })))
            .select()
          if (error) throw error
          return { data: result }
        default:
          throw new Error('Unknown upload type')
      }
    },
    onSuccess: (result) => {
      const count = result.data?.length || 0
      onSuccess?.(count)
      queryClient.invalidateQueries({ queryKey: [type] })
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      resetUpload()
    },
    onError: (error) => {
      onError?.(error.message)
    }
  })

  const handleFileProcessed = (data: any[], errors: any[]) => {
    setUploadedData(data)
    setParseErrors(errors)
    
    if (data.length > 0) {
      const validation = validateData(data, type)
      setValidationErrors(validation.errors)
      setIsValid(validation.isValid)
    } else {
      setValidationErrors([])
      setIsValid(false)
    }
  }

  const handleValidationComplete = (isValid: boolean, validData: any[], errors: ValidationError[]) => {
    setIsValid(isValid)
    setValidationErrors(errors)
  }

  const handleUpload = async () => {
    if (!isValid || uploadedData.length === 0) return

    setIsUploading(true)
    try {
      await bulkInsertMutation.mutateAsync(uploadedData)
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadedData([])
    setParseErrors([])
    setValidationErrors([])
    setIsValid(false)
  }

  const downloadSample = () => {
    const csvContent = [
      Object.keys(config.sampleData[0]).join(','),
      ...config.sampleData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sample_${type}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <IconComponent className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{config.title}</h2>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>
        <button
          onClick={downloadSample}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Download className="h-4 w-4 mr-2" />
          Sample CSV
        </button>
      </div>

      <div className="space-y-6">
        <FileUpload
          onFileProcessed={handleFileProcessed}
          title=""
          description=""
          isLoading={isUploading}
        />

        {uploadedData.length > 0 && (
          <DataValidator
            data={uploadedData}
            errors={parseErrors}
            validationErrors={validationErrors}
            requiredFields={config.requiredFields}
            onValidationComplete={handleValidationComplete}
          />
        )}

        {uploadedData.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center">
              {isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {isValid ? 'Ready to upload' : 'Please fix errors before uploading'}
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetUpload}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isUploading}
              >
                Reset
              </button>
              <button
                onClick={handleUpload}
                disabled={!isValid || isUploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {uploadedData.length} {type}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BulkUpload
