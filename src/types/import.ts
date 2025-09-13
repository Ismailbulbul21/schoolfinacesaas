// Import system types and interfaces

export interface ColumnDefinition {
  id: string
  name: string
  displayName: string
  type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'select'
  required: boolean
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    options?: string[]
  }
  category: 'essential' | 'contact' | 'academic' | 'additional'
  description: string
}

export interface ColumnMapping {
  fileColumn: string
  systemColumn: string
  isMapped: boolean
  isRequired: boolean
  validation: {
    isValid: boolean
    errors: string[]
  }
}

export interface ImportConfig {
  selectedColumns: string[]
  columnMappings: ColumnMapping[]
  validationRules: Record<string, any>
  idGeneration: {
    enabled: boolean
    pattern: string
    startFrom: number
  }
}

export interface SchoolColumnConfig {
  column_name: string
  is_enabled: boolean
  is_required: boolean
  display_name: string
  validation_rules: any
}

export interface ColumnTemplate {
  id: string
  name: string
  description: string
  columns: ColumnDefinition[]
  school_type: 'basic' | 'standard' | 'premium'
}

export interface StudentData {
  name: string
  class_name: string
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

export interface ParsedData {
  headers: string[]
  rows: string[][]
  mappedData: StudentData[]
  errors: string[]
}

export interface ImportResult {
  success: number
  errors: string[]
  inserted_count?: number
  error_count?: number
}

export interface ValidationError {
  row: number
  column: string
  value: any
  error: string
  severity: 'warning' | 'error'
}