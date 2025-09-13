import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { ColumnDefinition, ColumnTemplate, SchoolColumnConfig } from '../../types/import'
import { 
  CheckCircle, 
  XCircle, 
  Info, 
  Download,
  Settings,
  Users,
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  Heart,
  FileText
} from 'lucide-react'

interface ColumnSelectorProps {
  onColumnsSelected: (columns: string[]) => void
  onClose: () => void
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ onColumnsSelected, onClose }) => {
  const { schoolId } = useAuth()
  const queryClient = useQueryClient()
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['full_name', 'class_name'])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [step, setStep] = useState<'template' | 'customize' | 'preview'>('template')

  // Fetch available column templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['column-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_column_templates')
      if (error) throw error
      return data as ColumnTemplate[]
    }
  })

  // Fetch school's current column configuration
  const { data: schoolConfig, isLoading: configLoading } = useQuery({
    queryKey: ['school-column-config', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase.rpc('get_school_column_config', { p_school_id: schoolId })
      if (error) throw error
      return data as SchoolColumnConfig[]
    },
    enabled: !!schoolId
  })

  // All available columns with their definitions
  const allColumns: ColumnDefinition[] = [
    // Essential columns
    {
      id: 'full_name',
      name: 'full_name',
      displayName: 'Full Name',
      type: 'text',
      required: true,
      category: 'essential',
      description: 'Student\'s complete name',
      validation: { minLength: 2, maxLength: 100 }
    },
    {
      id: 'student_id',
      name: 'student_id',
      displayName: 'Student ID',
      type: 'text',
      required: false,
      category: 'essential',
      description: 'School\'s internal student ID',
      validation: { pattern: '^[A-Z0-9-]+$' }
    },
    {
      id: 'class_name',
      name: 'class_name',
      displayName: 'Class/Grade',
      type: 'text',
      required: true,
      category: 'essential',
      description: 'Current academic level'
    },
    {
      id: 'date_of_birth',
      name: 'date_of_birth',
      displayName: 'Date of Birth',
      type: 'date',
      required: false,
      category: 'essential',
      description: 'Student\'s birth date'
    },
    {
      id: 'gender',
      name: 'gender',
      displayName: 'Gender',
      type: 'select',
      required: false,
      category: 'essential',
      description: 'Student\'s gender',
      validation: { options: ['Male', 'Female', 'Other'] }
    },
    // Contact columns
    {
      id: 'parent_name',
      name: 'parent_name',
      displayName: 'Parent Name',
      type: 'text',
      required: false,
      category: 'contact',
      description: 'Primary guardian\'s name'
    },
    {
      id: 'parent_phone',
      name: 'parent_phone',
      displayName: 'Parent Phone',
      type: 'phone',
      required: false,
      category: 'contact',
      description: 'Guardian\'s phone number'
    },
    {
      id: 'parent_email',
      name: 'parent_email',
      displayName: 'Parent Email',
      type: 'email',
      required: false,
      category: 'contact',
      description: 'Guardian\'s email address'
    },
    {
      id: 'home_address',
      name: 'home_address',
      displayName: 'Home Address',
      type: 'text',
      required: false,
      category: 'contact',
      description: 'Student\'s home address'
    },
    {
      id: 'emergency_contact',
      name: 'emergency_contact',
      displayName: 'Emergency Contact',
      type: 'text',
      required: false,
      category: 'contact',
      description: 'Alternative contact person'
    },
    // Academic columns
    {
      id: 'admission_date',
      name: 'admission_date',
      displayName: 'Admission Date',
      type: 'date',
      required: false,
      category: 'academic',
      description: 'When student joined the school'
    },
    {
      id: 'academic_year',
      name: 'academic_year',
      displayName: 'Academic Year',
      type: 'text',
      required: false,
      category: 'academic',
      description: 'Current school year'
    },
    {
      id: 'transportation',
      name: 'transportation',
      displayName: 'Transportation',
      type: 'select',
      required: false,
      category: 'academic',
      description: 'How student gets to school',
      validation: { options: ['Bus', 'Car', 'Walk', 'Other'] }
    },
    // Additional columns
    {
      id: 'medical_conditions',
      name: 'medical_conditions',
      displayName: 'Medical Conditions',
      type: 'text',
      required: false,
      category: 'additional',
      description: 'Health information'
    },
    {
      id: 'allergies',
      name: 'allergies',
      displayName: 'Allergies',
      type: 'text',
      required: false,
      category: 'additional',
      description: 'Known allergies'
    },
    {
      id: 'notes',
      name: 'notes',
      displayName: 'Notes',
      type: 'text',
      required: false,
      category: 'additional',
      description: 'General remarks'
    }
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'essential': return <Users className="w-4 h-4" />
      case 'contact': return <Phone className="w-4 h-4" />
      case 'academic': return <GraduationCap className="w-4 h-4" />
      case 'additional': return <FileText className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essential': return 'text-blue-600 bg-blue-100'
      case 'contact': return 'text-green-600 bg-green-100'
      case 'academic': return 'text-purple-600 bg-purple-100'
      case 'additional': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleTemplateSelect = (template: ColumnTemplate) => {
    const templateColumns = template.columns.map(col => col.id)
    setSelectedColumns(templateColumns)
    setSelectedTemplate(template.id)
    setStep('customize')
  }

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId)
      } else {
        return [...prev, columnId]
      }
    })
  }

  const handleContinue = () => {
    onColumnsSelected(selectedColumns)
    onClose()
  }

  const groupedColumns = allColumns.reduce((acc, column) => {
    if (!acc[column.category]) {
      acc[column.category] = []
    }
    acc[column.category].push(column)
    return acc
  }, {} as Record<string, ColumnDefinition[]>)

  if (templatesLoading || configLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading column options...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Choose Import Columns</h2>
              <p className="text-gray-600">Select which student information to import</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'template' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {templates?.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center mb-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          template.school_type === 'basic' ? 'bg-blue-100 text-blue-800' :
                          template.school_type === 'standard' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {template.school_type.toUpperCase()}
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h4>
                      <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                      <div className="text-sm text-gray-500">
                        {template.columns.length} columns included
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'customize' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Customize Your Selection</h3>
                <button
                  onClick={() => setStep('template')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Back to Templates
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedColumns).map(([category, columns]) => (
                  <div key={category} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                        {getCategoryIcon(category)}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 ml-3 capitalize">
                        {category} Information
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {columns.map((column) => (
                        <div
                          key={column.id}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedColumns.includes(column.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleColumnToggle(column.id)}
                        >
                          <div className="flex-shrink-0">
                            {selectedColumns.includes(column.id) ? (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {column.displayName}
                              </span>
                              {column.required && (
                                <span className="ml-2 text-xs text-red-600 font-medium">Required</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{column.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center">
                  <Info className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">
                    Selected {selectedColumns.length} columns
                  </span>
                </div>
                <p className="text-sm text-blue-800 mt-1">
                  You can always modify this selection later in your school settings.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={selectedColumns.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Continue with {selectedColumns.length} columns
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColumnSelector
