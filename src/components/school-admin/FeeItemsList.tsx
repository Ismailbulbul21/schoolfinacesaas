import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  DollarSign,
  Calendar
} from 'lucide-react'

interface FeeItem {
  id: string
  name: string
  amount: number
  school_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

// Somalia-specific common fee items
const PREFILLED_FEE_ITEMS = [
  { 
    name: 'Lacagta Waxbarashada (Monthly Tuition)', 
    amount: 50, 
    description: 'Lacagta bilka ah ee waxbarashada',
    category: 'Basic',
    icon: '📚'
  },
  { 
    name: 'Lacagta Imtixaanka (Exam Fee)', 
    amount: 20, 
    description: 'Lacagta imtixaanka iyo tijaabada',
    category: 'Academic',
    icon: '📝'
  },
  { 
    name: 'Lacagta Buugga (Book & Materials)', 
    amount: 30, 
    description: 'Lacagta buugga iyo qalabka waxbarashada',
    category: 'Academic',
    icon: '📖'
  },
  { 
    name: 'Lacagta Dugsiga (School Development)', 
    amount: 25, 
    description: 'Lacagta horumarinta dugsiga',
    category: 'Infrastructure',
    icon: '🏫'
  },
  { 
    name: 'Lacagta Maktabadda (Library Access)', 
    amount: 10, 
    description: 'Lacagta maktabadda iyo buugga',
    category: 'Academic',
    icon: '📚'
  },
  { 
    name: 'Lacagta Qalabka (Equipment & Lab)', 
    amount: 20, 
    description: 'Lacagta qalabka iyo labaratoriga',
    category: 'Infrastructure',
    icon: '🔬'
  },
  { 
    name: 'Lacagta Xannaanada (Health & Medical)', 
    amount: 15, 
    description: 'Lacagta xannaanada iyo caafimaadka',
    category: 'Health',
    icon: '🏥'
  },
  { 
    name: 'Lacagta Technology (Computer & Internet)', 
    amount: 25, 
    description: 'Lacagta kombuyuutarka iyo internetka',
    category: 'Technology',
    icon: '💻'
  },
  { 
    name: 'Lacagta Fasalka (Classroom Materials)', 
    amount: 15, 
    description: 'Lacagta qalabka fasalka',
    category: 'Academic',
    icon: '✏️'
  },
  { 
    name: 'Lacagta Dhaqanka (Cultural Activities)', 
    amount: 12, 
    description: 'Lacagta dhaqanka iyo dhaqdhaqaaqa',
    category: 'Cultural',
    icon: '🎭'
  }
]

const FeeItemsList: React.FC = () => {
  const { schoolId } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPrefilledOptions, setShowPrefilledOptions] = useState(false)
  const [editingFeeItem, setEditingFeeItem] = useState<FeeItem | null>(null)
  const [newFeeItem, setNewFeeItem] = useState({ name: '', amount: '' })
  const queryClient = useQueryClient()

  const { data: feeItems, isLoading, error } = useQuery({
    queryKey: ['fee-items', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('fee_items')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FeeItem[]
    },
    enabled: !!schoolId,
  })

  const addFeeItemMutation = useMutation({
    mutationFn: async (feeItemData: { name: string; amount: number }) => {
      if (!schoolId) throw new Error('No school ID')
      const { data, error } = await supabase
        .from('fee_items')
        .insert({
          name: feeItemData.name,
          amount: feeItemData.amount,
          school_id: schoolId,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-items', schoolId] })
      setNewFeeItem({ name: '', amount: '' })
      setShowAddForm(false)
    },
  })

  const updateFeeItemMutation = useMutation({
    mutationFn: async ({ id, name, amount }: { id: string; name: string; amount: number }) => {
      const { data, error } = await supabase
        .from('fee_items')
        .update({ name, amount })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-items', schoolId] })
      setEditingFeeItem(null)
    },
  })

  const deleteFeeItemMutation = useMutation({
    mutationFn: async (feeItemId: string) => {
      const { error } = await supabase
        .from('fee_items')
        .update({ is_active: false })
        .eq('id', feeItemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-items', schoolId] })
    },
  })

  const filteredFeeItems = feeItems?.filter(feeItem =>
    feeItem.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleAddFeeItem = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(newFeeItem.amount)
    if (newFeeItem.name.trim() && !isNaN(amount) && amount > 0) {
      addFeeItemMutation.mutate({ name: newFeeItem.name, amount })
    }
  }

  const handleUpdateFeeItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingFeeItem && editingFeeItem.name.trim() && editingFeeItem.amount > 0) {
      updateFeeItemMutation.mutate({
        id: editingFeeItem.id,
        name: editingFeeItem.name,
        amount: editingFeeItem.amount,
      })
    }
  }

  const handleDeleteFeeItem = async (feeItemId: string, feeItemName: string) => {
    if (window.confirm(`Are you sure you want to remove ${feeItemName}?`)) {
      try {
        await deleteFeeItemMutation.mutateAsync(feeItemId)
      } catch (error) {
        console.error('Error deleting fee item:', error)
      }
    }
  }

  const handleAddPrefilledFeeItem = (prefilledItem: { name: string; amount: number }) => {
    setNewFeeItem({ name: prefilledItem.name, amount: prefilledItem.amount.toString() })
    setShowPrefilledOptions(false)
    setShowAddForm(true)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading fee items
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Fee Items (Noocyada Lacagta)</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage fee types and amounts for your school - Maamul noocyada lacagta iyo qadarka dugsigaaga
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            onClick={() => setShowPrefilledOptions(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Choose Common Fees (Dooro Lacagta Caadiga)
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Fee (Samee Lacag Cusub)
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search fee items... (Raadi noocyada lacagta...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Prefilled Fee Items Modal */}
      {showPrefilledOptions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-0 w-11/12 max-w-6xl shadow-2xl rounded-2xl bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Choose Common Fees (Dooro Lacagta Caadiga)
                  </h3>
                  <p className="text-blue-100 mt-1">
                    Select from Somalia-specific school fees - Dooro lacagta caadiga ah ee dugsiga Soomaaliyeed
                  </p>
                </div>
                <button
                  onClick={() => setShowPrefilledOptions(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Fee Categories (Qaybaha Lacagta)</h4>
                <div className="flex flex-wrap gap-2">
                  {['Basic', 'Academic', 'Infrastructure', 'Health', 'Technology', 'Cultural'].map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Fee Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {PREFILLED_FEE_ITEMS.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleAddPrefilledFeeItem(item)}
                    className="group border border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-200 bg-white hover:bg-blue-50/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{item.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700">
                            {item.name}
                          </h4>
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mt-1">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">${item.amount}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium group-hover:text-blue-700">
                        Click to add (Guji si aad u darto)
                      </span>
                      <div className="w-2 h-2 bg-green-500 rounded-full group-hover:bg-green-600"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <p>💡 <strong>Tip:</strong> These fees are common in Somali schools. You can customize amounts after adding.</p>
                    <p className="mt-1">💡 <strong>Tilmaam:</strong> Lacagtan waa caadiga ah dugsiga Soomaaliyeed. Waxaad beddeli kartaa qadarka kadib.</p>
                  </div>
                  <button
                    onClick={() => setShowPrefilledOptions(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Close (Xidh)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Fee Item Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add New Fee Item (Darto Lacag Cusub)
          </h3>
          <form onSubmit={handleAddFeeItem} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Fee Name (Magaca Lacagta)
                </label>
                <input
                  type="text"
                  id="name"
                  value={newFeeItem.name}
                  onChange={(e) => setNewFeeItem({ ...newFeeItem, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Monthly Tuition, Exam Fee (Tusaale: Lacagta Waxbarashada, Lacagta Imtixaanka)"
                  required
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount ($) - Qadarka ($)
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  value={newFeeItem.amount}
                  onChange={(e) => setNewFeeItem({ ...newFeeItem, amount: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel (Jooji)
              </button>
              <button
                type="submit"
                disabled={addFeeItemMutation.isPending}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addFeeItemMutation.isPending ? 'Adding... (Dartay...)' : 'Add Fee Item (Darto Lacag)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fee Items List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredFeeItems.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No fee items (Ma jiraan lacag)
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'No fee items match your search. (Ma jiraan lacag ku haboon raadintaada.)' 
                : 'Get started by adding your first fee item. (Bilaabi adoo darta lacagtaada ugu horeysa.)'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6 space-x-3">
                <button
                  onClick={() => setShowPrefilledOptions(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Choose Common Fees (Dooro Lacagta Caadiga)
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Fee (Samee Lacag Cusub)
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredFeeItems.map((feeItem) => (
              <li key={feeItem.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {feeItem.name}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <div className="flex items-center mr-4">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ${feeItem.amount}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(feeItem.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingFeeItem(feeItem)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Fee Item"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeeItem(feeItem.id, feeItem.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Remove Fee Item"
                        disabled={deleteFeeItemMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Fee Item Modal */}
      {editingFeeItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Fee Item (Wax ka beddel Lacag)
            </h3>
            <form onSubmit={handleUpdateFeeItem} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                  Fee Name (Magaca Lacagta)
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editingFeeItem.name}
                  onChange={(e) => setEditingFeeItem({ ...editingFeeItem, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700">
                  Amount ($) - Qadarka ($)
                </label>
                <input
                  type="number"
                  id="edit-amount"
                  step="0.01"
                  min="0"
                  value={editingFeeItem.amount}
                  onChange={(e) => setEditingFeeItem({ ...editingFeeItem, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingFeeItem(null)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel (Jooji)
                </button>
                <button
                  type="submit"
                  disabled={updateFeeItemMutation.isPending}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateFeeItemMutation.isPending ? 'Updating... (Wax ka beddelaya...)' : 'Update Fee Item (Wax ka beddel Lacag)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeeItemsList
