import React from 'react'
import { Printer, Download } from 'lucide-react'

interface PrintUtilsProps {
  title: string
  data: any[]
  columns: Array<{
    key: string
    label: string
    render?: (value: any, item: any) => React.ReactNode
  }>
  className?: string
}

export const PrintUtils: React.FC<PrintUtilsProps> = ({ 
  title, 
  data, 
  columns, 
  className = '' 
}) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #1f2937;
              margin: 0;
              font-size: 24px;
            }
            .header p {
              color: #6b7280;
              margin: 5px 0 0 0;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 12px 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
              color: #374151;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  ${columns.map(col => {
                    const value = col.render ? col.render(item[col.key], item) : item[col.key]
                    return `<td>${value || ''}</td>`
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total Records: ${data.length}</p>
            <p>School Finance Management System</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const handleExportPDF = () => {
    // This would require a PDF library like jsPDF
    // For now, we'll just trigger the print dialog
    handlePrint()
  }

  if (data.length === 0) {
    return null
  }

  return (
    <div className={`flex space-x-2 ${className}`}>
      <button
        onClick={handlePrint}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print
      </button>
      
      <button
        onClick={handleExportPDF}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Download className="w-4 h-4 mr-2" />
        Export PDF
      </button>
    </div>
  )
}

// Student-specific print component
interface StudentPrintProps {
  students: Array<{
    id: string
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
  }>
  className?: string
}

export const StudentPrint: React.FC<StudentPrintProps> = ({ students, className }) => {
  const columns = [
    { key: 'name', label: 'Student Name' },
    { key: 'class_name', label: 'Class' },
    { key: 'student_id', label: 'Student ID' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'date_of_birth', label: 'Date of Birth', render: (value: string) => value ? new Date(value).toLocaleDateString() : '' },
    { key: 'gender', label: 'Gender' },
    { key: 'parent_name', label: 'Parent Name' },
    { key: 'parent_phone', label: 'Parent Phone' },
    { key: 'parent_email', label: 'Parent Email' },
    { key: 'home_address', label: 'Address' },
    { key: 'emergency_contact', label: 'Emergency Contact' },
    { key: 'admission_date', label: 'Admission Date', render: (value: string) => value ? new Date(value).toLocaleDateString() : '' },
    { key: 'academic_year', label: 'Academic Year' },
    { key: 'transportation', label: 'Transportation' },
    { key: 'medical_conditions', label: 'Medical Conditions' },
    { key: 'allergies', label: 'Allergies' },
    { key: 'notes', label: 'Notes' }
  ]

  return (
    <PrintUtils
      title="Student Directory"
      data={students}
      columns={columns}
      className={className}
    />
  )
}

// Invoice-specific print component
interface InvoicePrintProps {
  invoices: Array<{
    id: string
    student: { name: string; class_name: string }
    fee_item: { name: string }
    amount: number
    status: string
    due_date?: string
    paid_date?: string
  }>
  className?: string
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({ invoices, className }) => {
  const columns = [
    { key: 'student.name', label: 'Student Name' },
    { key: 'student.class_name', label: 'Class' },
    { key: 'fee_item.name', label: 'Fee Item' },
    { key: 'amount', label: 'Amount', render: (value: number) => `$${value.toFixed(2)}` },
    { key: 'status', label: 'Status', render: (value: string) => value === 'paid' ? '✅ Paid' : '❌ Unpaid' },
    { key: 'due_date', label: 'Due Date', render: (value: string) => value ? new Date(value).toLocaleDateString() : '' },
    { key: 'paid_date', label: 'Paid Date', render: (value: string) => value ? new Date(value).toLocaleDateString() : '' }
  ]

  return (
    <PrintUtils
      title="Invoice Report"
      data={invoices}
      columns={columns}
      className={className}
    />
  )
}
