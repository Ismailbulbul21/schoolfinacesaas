import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, AlertCircle, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const createSchoolSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminPhone: z.string().optional(),
})

type CreateSchoolForm = z.infer<typeof createSchoolSchema>

const CreateSchool: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateSchoolForm>({
    resolver: zodResolver(createSchoolSchema),
  })

  const createSchoolMutation = useMutation({
    mutationFn: async (data: CreateSchoolForm) => {
      // Create school first
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: data.name,
          address: data.address,
          phone: data.phone,
        })
        .select()
        .single()

      if (schoolError) throw schoolError

      // Create Supabase Auth user for school admin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: data.adminPassword,
      })

      if (authError) {
        // If auth user creation fails, clean up the school record
        await supabase.from('schools').delete().eq('id', school.id)
        throw authError
      }

      // Create school admin record
      const { error: adminError } = await supabase
        .from('school_admins')
        .insert({
          name: data.adminName,
          email: data.adminEmail,
          phone: data.adminPhone,
          school_id: school.id,
        })

      if (adminError) {
        // If admin record creation fails, clean up auth user and school
        await supabase.auth.admin.deleteUser(authData.user?.id || '')
        await supabase.from('schools').delete().eq('id', school.id)
        throw adminError
      }

      return school
    },
    onSuccess: (school) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      setSuccess(`School "${school.name}" and admin account created successfully!`)
      reset()
      // Don't navigate away - let super admin stay in dashboard
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create school')
    },
  })

  const onSubmit = async (data: CreateSchoolForm) => {
    setError(null)
    setSuccess(null)
    try {
      await createSchoolMutation.mutateAsync(data)
    } catch (error) {
      console.error('Error creating school:', error)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            to="/super-admin/schools"
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New School</h1>
            <p className="mt-1 text-sm text-gray-500">
              Add a new school and create the first admin account
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {success}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* School Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">School Information</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  School Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter school name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="+252-61-123-4567"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter school address"
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>
          </div>

          {/* Admin Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">School Admin Account</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  {...register('adminName')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter admin full name"
                />
                {errors.adminName && (
                  <p className="mt-1 text-sm text-red-600">{errors.adminName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('adminEmail')}
                    type="email"
                    className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="admin@school.edu"
                  />
                </div>
                {errors.adminEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.adminEmail.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  {...register('adminPassword')}
                  type="password"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter password"
                />
                {errors.adminPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.adminPassword.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="adminPhone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('adminPhone')}
                    type="tel"
                    className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="+252-61-123-4567"
                  />
                </div>
                {errors.adminPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.adminPhone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              to="/super-admin/schools"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createSchoolMutation.isPending}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createSchoolMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Create School'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateSchool
