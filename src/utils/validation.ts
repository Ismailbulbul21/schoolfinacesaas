// Validation utilities for different data types

export interface ValidationError {
  row: number
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  validData: any[]
}

// Student data validation
export const validateStudentData = (data: any[]): ValidationResult => {
  const errors: ValidationError[] = []
  const validData: any[] = []
  const requiredFields = ['name', 'class_name']

  data.forEach((row, index) => {
    const rowErrors: ValidationError[] = []
    const rowNumber = index + 1

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        rowErrors.push({
          row: rowNumber,
          field,
          message: `${field} is required`,
          value: row[field]
        })
      }
    })

    // Validate name
    if (row.name && row.name.toString().trim().length < 2) {
      rowErrors.push({
        row: rowNumber,
        field: 'name',
        message: 'Name must be at least 2 characters long',
        value: row.name
      })
    }

    // Validate class name
    if (row.class_name && row.class_name.toString().trim().length < 1) {
      rowErrors.push({
        row: rowNumber,
        field: 'class_name',
        message: 'Class name cannot be empty',
        value: row.class_name
      })
    }

    // Check for duplicate names in the same class
    const duplicateIndex = validData.findIndex(
      existing => 
        existing.name?.toString().toLowerCase().trim() === row.name?.toString().toLowerCase().trim() &&
        existing.class_name?.toString().toLowerCase().trim() === row.class_name?.toString().toLowerCase().trim()
    )
    
    if (duplicateIndex !== -1) {
      rowErrors.push({
        row: rowNumber,
        field: 'name',
        message: `Duplicate student name in the same class (also found in row ${duplicateIndex + 1})`,
        value: row.name
      })
    }

    if (rowErrors.length === 0) {
      validData.push({
        name: row.name.toString().trim(),
        class_name: row.class_name.toString().trim()
      })
    } else {
      errors.push(...rowErrors)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    validData
  }
}

// Payment data validation
export const validatePaymentData = (data: any[]): ValidationResult => {
  const errors: ValidationError[] = []
  const validData: any[] = []
  const requiredFields = ['student_name', 'class_name', 'fee_item', 'status']

  data.forEach((row, index) => {
    const rowErrors: ValidationError[] = []
    const rowNumber = index + 1

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        rowErrors.push({
          row: rowNumber,
          field,
          message: `${field} is required`,
          value: row[field]
        })
      }
    })

    // Validate status
    if (row.status) {
      const status = row.status.toString().toLowerCase().trim()
      if (!['paid', 'unpaid'].includes(status)) {
        rowErrors.push({
          row: rowNumber,
          field: 'status',
          message: 'Status must be either "paid" or "unpaid"',
          value: row.status
        })
      }
    }

    // Validate amount if provided
    if (row.amount) {
      const amount = parseFloat(row.amount)
      if (isNaN(amount) || amount < 0) {
        rowErrors.push({
          row: rowNumber,
          field: 'amount',
          message: 'Amount must be a valid positive number',
          value: row.amount
        })
      }
    }

    // Validate date if provided
    if (row.date) {
      const date = new Date(row.date)
      if (isNaN(date.getTime())) {
        rowErrors.push({
          row: rowNumber,
          field: 'date',
          message: 'Date must be in a valid format (YYYY-MM-DD)',
          value: row.date
        })
      }
    }

    if (rowErrors.length === 0) {
      validData.push({
        student_name: row.student_name.toString().trim(),
        class_name: row.class_name.toString().trim(),
        fee_item: row.fee_item.toString().trim(),
        status: row.status.toString().toLowerCase().trim(),
        amount: row.amount ? parseFloat(row.amount) : null,
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : null
      })
    } else {
      errors.push(...rowErrors)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    validData
  }
}

// Fee item validation
export const validateFeeItemData = (data: any[]): ValidationResult => {
  const errors: ValidationError[] = []
  const validData: any[] = []
  const requiredFields = ['name', 'amount']

  data.forEach((row, index) => {
    const rowErrors: ValidationError[] = []
    const rowNumber = index + 1

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        rowErrors.push({
          row: rowNumber,
          field,
          message: `${field} is required`,
          value: row[field]
        })
      }
    })

    // Validate name
    if (row.name && row.name.toString().trim().length < 2) {
      rowErrors.push({
        row: rowNumber,
        field: 'name',
        message: 'Fee item name must be at least 2 characters long',
        value: row.name
      })
    }

    // Validate amount
    if (row.amount) {
      const amount = parseFloat(row.amount)
      if (isNaN(amount) || amount < 0) {
        rowErrors.push({
          row: rowNumber,
          field: 'amount',
          message: 'Amount must be a valid positive number',
          value: row.amount
        })
      }
    }

    // Check for duplicate names
    const duplicateIndex = validData.findIndex(
      existing => 
        existing.name?.toString().toLowerCase().trim() === row.name?.toString().toLowerCase().trim()
    )
    
    if (duplicateIndex !== -1) {
      rowErrors.push({
        row: rowNumber,
        field: 'name',
        message: `Duplicate fee item name (also found in row ${duplicateIndex + 1})`,
        value: row.name
      })
    }

    if (rowErrors.length === 0) {
      validData.push({
        name: row.name.toString().trim(),
        amount: parseFloat(row.amount)
      })
    } else {
      errors.push(...rowErrors)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    validData
  }
}

// Generic validation for any data type
export const validateData = (data: any[], type: 'students' | 'payments' | 'fee_items'): ValidationResult => {
  switch (type) {
    case 'students':
      return validateStudentData(data)
    case 'payments':
      return validatePaymentData(data)
    case 'fee_items':
      return validateFeeItemData(data)
    default:
      return {
        isValid: false,
        errors: [{
          row: 0,
          field: 'type',
          message: 'Unknown validation type',
          value: type
        }],
        validData: []
      }
  }
}
