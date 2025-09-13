import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Download, 
  FileText, 
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  Search
} from 'lucide-react'

interface Invoice {
  id: string
  student_id: string
  fee_item_id: string
  amount: number
  status: 'paid' | 'unpaid'
  due_date: string
  paid_date?: string
  school_id: string
  created_at: string
  updated_at: string
  student: {
    name: string
    class_name: string
  }
  fee_item: {
    name: string
  }
}

const Reports: React.FC = () => {
  const { schoolId } = useAuth()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [feeItemFilter, setFeeItemFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [customPaymentDate, setCustomPaymentDate] = useState<string>('')

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['school-stats', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase.rpc('get_school_stats', {
        p_school_id: schoolId
      })
      if (error) throw error
      return data[0]
    },
    enabled: !!schoolId,
  })

  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ['invoices', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          student:students(name, class_name),
          fee_item:fee_items(name)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Invoice[]
    },
    enabled: !!schoolId,
  })

  const { data: _students, isLoading: _studentsLoading } = useQuery({
    queryKey: ['students', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('students')
        .select('class_name')
        .eq('school_id', schoolId)
        .eq('is_active', true)
      if (error) throw error
      return data
    },
    enabled: !!schoolId,
  })

  const filteredInvoices = invoices?.filter(invoice => {
    const statusMatch = statusFilter === 'all' || invoice.status === statusFilter
    const classMatch = classFilter === 'all' || invoice.student.class_name === classFilter
    const feeItemMatch = feeItemFilter === 'all' || invoice.fee_item.name === feeItemFilter
    const searchMatch = searchTerm === '' || 
      invoice.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.fee_item.name.toLowerCase().includes(searchTerm.toLowerCase())
    return statusMatch && classMatch && feeItemMatch && searchMatch
  }) || []

  // Get unique classes and fee items from invoices data
  const uniqueClasses = Array.from(new Set(invoices?.map(invoice => invoice.student.class_name) || []))
  const uniqueFeeItems = Array.from(new Set(invoices?.map(invoice => invoice.fee_item.name) || []))

  // Payment mutation for marking single invoice as paid
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentDate }: { invoiceId: string; paymentDate: string }) => {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid', 
          paid_date: paymentDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('school_id', schoolId)
      
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoices', schoolId] })
      queryClient.invalidateQueries({ queryKey: ['school-stats', schoolId] })
      setShowPaymentModal(false)
      setSelectedInvoice(null)
      setCustomPaymentDate('')
    },
    onError: (error) => {
      console.error('Error marking invoice as paid:', error)
    }
  })

  // Bulk payment mutation
  const bulkMarkAsPaidMutation = useMutation({
    mutationFn: async ({ invoiceIds, paymentDate }: { invoiceIds: string[]; paymentDate: string }) => {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid', 
          paid_date: paymentDate,
          updated_at: new Date().toISOString()
        })
        .in('id', invoiceIds)
        .eq('school_id', schoolId)
      
      if (error) throw error
      return { success: true, count: invoiceIds.length }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoices', schoolId] })
      queryClient.invalidateQueries({ queryKey: ['school-stats', schoolId] })
      setSelectedInvoices([])
    },
    onError: (error) => {
      console.error('Error marking invoices as paid:', error)
    }
  })

  // Handle single invoice payment
  const handleMarkAsPaid = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setCustomPaymentDate(new Date().toISOString().split('T')[0])
    setShowPaymentModal(true)
  }

  // Handle bulk payment
  const handleBulkMarkAsPaid = () => {
    if (selectedInvoices.length === 0) return
    
    const paymentDate = new Date().toISOString().split('T')[0]
    bulkMarkAsPaidMutation.mutate({ 
      invoiceIds: selectedInvoices, 
      paymentDate 
    })
  }

  // Handle custom payment date confirmation
  const handleConfirmPayment = () => {
    if (!selectedInvoice || !customPaymentDate) return
    
    markAsPaidMutation.mutate({ 
      invoiceId: selectedInvoice.id, 
      paymentDate: customPaymentDate 
    })
  }

  // Handle invoice selection for bulk operations
  const handleInvoiceSelection = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId])
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId))
    }
  }

  // Handle select all invoices
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unpaidInvoiceIds = filteredInvoices
        .filter(invoice => invoice.status === 'unpaid')
        .map(invoice => invoice.id)
      setSelectedInvoices(unpaidInvoiceIds)
    } else {
      setSelectedInvoices([])
    }
  }

  const exportToCSV = () => {
    if (!filteredInvoices.length) return

    const headers = ['Student Name', 'Class', 'Fee Item', 'Amount', 'Status', 'Due Date', 'Paid Date']
    const csvContent = [
      headers.join(','),
      ...filteredInvoices.map(invoice => [
        `"${invoice.student.name}"`,
        `"${invoice.student.class_name}"`,
        `"${invoice.fee_item.name}"`,
        invoice.amount,
        invoice.status,
        invoice.due_date,
        invoice.paid_date || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (statsLoading || invoicesLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (statsError || invoicesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading reports
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {statsError?.message || invoicesError?.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Students',
      value: stats?.total_students || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Paid Invoices',
      value: stats?.total_paid_invoices || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Unpaid Invoices',
      value: stats?.total_unpaid_invoices || 0,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'Amount Collected',
      value: `$${stats?.total_amount_collected || 0}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Payment status and financial reports</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedInvoices.length > 0 && (
            <button
              onClick={handleBulkMarkAsPaid}
              disabled={bulkMarkAsPaidMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-sm font-medium text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {bulkMarkAsPaidMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid ({selectedInvoices.length})
                </>
              )}
            </button>
          )}
          <button
            onClick={exportToCSV}
            disabled={!filteredInvoices.length}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSelectAll(true)}
              disabled={filteredInvoices.filter(i => i.status === 'unpaid').length === 0}
              className="text-sm px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Select All Unpaid
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Clear Selection
            </button>
            {selectedInvoices.length > 0 && (
              <span className="text-sm text-gray-500">
                {selectedInvoices.length} selected
              </span>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search students, classes, or fee items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              id="class-filter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fee-item-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Fee Item
            </label>
            <select
              id="fee-item-filter"
              value={feeItemFilter}
              onChange={(e) => setFeeItemFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Fee Items</option>
              {uniqueFeeItems.map((feeItemName) => (
                <option key={feeItemName} value={feeItemName}>
                  {feeItemName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Invoices ({filteredInvoices.length})
          </h3>
        </div>
        
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No invoices match your current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.filter(i => i.status === 'unpaid').length && filteredInvoices.filter(i => i.status === 'unpaid').length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Item
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className={selectedInvoices.includes(invoice.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {invoice.status === 'unpaid' && (
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={(e) => handleInvoiceSelection(invoice.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.student.name}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {invoice.student.class_name}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {invoice.fee_item.name}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${invoice.amount}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {invoice.status === 'unpaid' ? (
                        <button
                          onClick={() => handleMarkAsPaid(invoice)}
                          disabled={markAsPaidMutation.isPending}
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-xs font-medium text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {markAsPaidMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark as Paid
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Date Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Mark Invoice as Paid
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Invoice Details</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Student:</strong> {selectedInvoice.student.name}</p>
                <p><strong>Class:</strong> {selectedInvoice.student.class_name}</p>
                <p><strong>Fee Item:</strong> {selectedInvoice.fee_item.name}</p>
                <p><strong>Amount:</strong> ${selectedInvoice.amount}</p>
                <p><strong>Due Date:</strong> {new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="payment-date" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="payment-date"
                  value={customPaymentDate}
                  onChange={(e) => setCustomPaymentDate(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
                  required
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCustomPaymentDate(new Date().toISOString().split('T')[0])}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)
                    setCustomPaymentDate(yesterday.toISOString().split('T')[0])
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Yesterday
                </button>
              </div>
              {customPaymentDate && (
                <p className="mt-2 text-xs text-gray-500">
                  Payment received: {new Date(customPaymentDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={!customPaymentDate || markAsPaidMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markAsPaidMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 inline-block" />
                    Mark as Paid
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
