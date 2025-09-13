import React, { useState } from 'react'
import BulkUpload from '../BulkUpload'
import { CheckCircle, AlertCircle } from 'lucide-react'

const FileUploadTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'payments' | 'fee_items'>('students')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSuccess = (count: number) => {
    setSuccessMessage(`Successfully uploaded ${count} ${activeTab}`)
    setErrorMessage(null)
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const handleError = (error: string) => {
    setErrorMessage(error)
    setSuccessMessage(null)
    setTimeout(() => setErrorMessage(null), 5000)
  }

  const tabs = [
    { id: 'students', label: 'Students', count: 0 },
    { id: 'payments', label: 'Payments', count: 0 },
    { id: 'fee_items', label: 'Fee Items', count: 0 }
  ] as const

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">File Upload System</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload CSV or Excel files to bulk import data
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Upload Component */}
      <BulkUpload
        type={activeTab}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700">For Students:</h4>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Required fields: name, class_name</li>
              <li>Names must be at least 2 characters long</li>
              <li>No duplicate names in the same class</li>
              <li>Download the sample CSV to see the format</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">For Payments:</h4>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Required fields: student_name, class_name, fee_item, status</li>
              <li>Status must be "paid" or "unpaid"</li>
              <li>Amount should be a positive number</li>
              <li>Date should be in YYYY-MM-DD format</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">For Fee Items:</h4>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Required fields: name, amount</li>
              <li>Names must be at least 2 characters long</li>
              <li>Amount must be a positive number</li>
              <li>No duplicate fee item names</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileUploadTest
