import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface FileUploadProps {
  onFileProcessed: (data: any[], errors: any[]) => void
  acceptedTypes?: string[]
  maxSize?: number
  isLoading?: boolean
  title?: string
  description?: string
}

interface ParsedData {
  data: any[]
  errors: any[]
  fileName: string
  fileSize: number
  rowCount: number
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileProcessed,
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  maxSize = 5 * 1024 * 1024, // 5MB
  isLoading = false,
  title = "Upload File",
  description = "Drag and drop your file here, or click to select"
}) => {
  const [uploadedFile, setUploadedFile] = useState<ParsedData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const parseFile = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve) => {
      const fileName = file.name
      const fileSize = file.size
      let data: any[] = []
      let errors: any[] = []

      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            data = results.data as any[]
            errors = results.errors.map(error => ({
              row: error.row,
              message: error.message,
              type: 'parse_error'
            }))
            resolve({
              data,
              errors,
              fileName,
              fileSize,
              rowCount: data.length
            })
          },
          error: (error) => {
            errors = [{
              row: 0,
              message: error.message,
              type: 'file_error'
            }]
            resolve({
              data: [],
              errors,
              fileName,
              fileSize,
              rowCount: 0
            })
          }
        })
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target?.result, { type: 'binary' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            
            if (jsonData.length > 0) {
              const headers = jsonData[0] as string[]
              data = jsonData.slice(1).map((row: unknown) => {
                const rowArray = row as any[]
                const obj: any = {}
                headers.forEach((header, i) => {
                  obj[header] = rowArray[i] || ''
                })
                return obj
              })
            }
            
            resolve({
              data,
              errors,
              fileName,
              fileSize,
              rowCount: data.length
            })
          } catch (error) {
            errors = [{
              row: 0,
              message: error instanceof Error ? error.message : 'Unknown error',
              type: 'parse_error'
            }]
            resolve({
              data: [],
              errors,
              fileName,
              fileSize,
              rowCount: 0
            })
          }
        }
        reader.readAsBinaryString(file)
      } else {
        errors = [{
          row: 0,
          message: 'Unsupported file type',
          type: 'file_error'
        }]
        resolve({
          data: [],
          errors,
          fileName,
          fileSize,
          rowCount: 0
        })
      }
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsProcessing(true)

    try {
      const parsedData = await parseFile(file)
      setUploadedFile(parsedData)
      onFileProcessed(parsedData.data, parsedData.errors)
    } catch (error) {
      console.error('Error processing file:', error)
      onFileProcessed([], [{
        row: 0,
        message: 'Failed to process file',
        type: 'file_error'
      }])
    } finally {
      setIsProcessing(false)
    }
  }, [onFileProcessed])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize,
    multiple: false
  })

  const removeFile = () => {
    setUploadedFile(null)
    onFileProcessed([], [])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isProcessing ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Processing file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop the file here' : 'Upload a file'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {description}
              </p>
              <div className="text-xs text-gray-400">
                <p>Accepted formats: {acceptedTypes.join(', ')}</p>
                <p>Max size: {formatFileSize(maxSize)}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <File className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="font-medium text-gray-900">{uploadedFile.fileName}</p>
                <p className="text-sm text-gray-500">
                  {uploadedFile.rowCount} rows • {formatFileSize(uploadedFile.fileSize)}
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {uploadedFile.errors.length > 0 && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <p className="text-sm font-medium text-red-800">
                  {uploadedFile.errors.length} error(s) found
                </p>
              </div>
              <div className="text-xs text-red-700">
                {uploadedFile.errors.slice(0, 3).map((error, index) => (
                  <p key={index}>
                    Row {error.row}: {error.message}
                  </p>
                ))}
                {uploadedFile.errors.length > 3 && (
                  <p>... and {uploadedFile.errors.length - 3} more errors</p>
                )}
              </div>
            </div>
          )}

          {uploadedFile.errors.length === 0 && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              <p className="text-sm font-medium">File parsed successfully</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FileUpload
