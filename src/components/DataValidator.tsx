import React from 'react'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

// Define ValidationError interface locally to avoid import issues
interface ValidationError {
  row: number
  field: string
  message: string
  value?: any
}

interface DataValidatorProps {
  data: any[]
  errors: any[]
  validationErrors: ValidationError[]
  requiredFields: string[]
  onValidationComplete: (isValid: boolean, validData: any[], errors: ValidationError[]) => void
}

const DataValidator: React.FC<DataValidatorProps> = ({
  data,
  errors,
  validationErrors,
  requiredFields,
  onValidationComplete
}) => {
  const totalErrors = errors.length + validationErrors.length
  const validRows = data.length - validationErrors.length
  const hasErrors = totalErrors > 0

  React.useEffect(() => {
    onValidationComplete(!hasErrors, data, validationErrors)
  }, [hasErrors, data, validationErrors, onValidationComplete])

  if (data.length === 0) {
    return null
  }

  return (
    <div className="mt-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Data Validation</h4>
        <div className="flex items-center">
          {hasErrors ? (
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          )}
          <span className={`text-sm font-medium ${hasErrors ? 'text-red-600' : 'text-green-600'}`}>
            {hasErrors ? 'Validation Failed' : 'Validation Passed'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{data.length}</p>
          <p className="text-sm text-gray-500">Total Rows</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{validRows}</p>
          <p className="text-sm text-gray-500">Valid Rows</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{totalErrors}</p>
          <p className="text-sm text-gray-500">Errors</p>
        </div>
      </div>

      {requiredFields.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Required Fields:</p>
          <div className="flex flex-wrap gap-2">
            {requiredFields.map((field) => (
              <span
                key={field}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <p className="text-sm font-medium text-red-800">
              Validation Errors ({validationErrors.length})
            </p>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {validationErrors.slice(0, 10).map((error, index) => (
              <div key={index} className="text-xs text-red-700 mb-1">
                <span className="font-medium">Row {error.row}:</span> {error.field} - {error.message}
                {error.value && (
                  <span className="text-gray-500 ml-2">(Value: "{error.value}")</span>
                )}
              </div>
            ))}
            {validationErrors.length > 10 && (
              <p className="text-xs text-gray-500 mt-2">
                ... and {validationErrors.length - 10} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <p className="text-sm font-medium text-red-800">
              Parse Errors ({errors.length})
            </p>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {errors.slice(0, 5).map((error, index) => (
              <div key={index} className="text-xs text-red-700 mb-1">
                <span className="font-medium">Row {error.row}:</span> {error.message}
              </div>
            ))}
            {errors.length > 5 && (
              <p className="text-xs text-gray-500 mt-2">
                ... and {errors.length - 5} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {!hasErrors && (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-2" />
          <p className="text-sm font-medium">All data is valid and ready to import</p>
        </div>
      )}
    </div>
  )
}

export default DataValidator
