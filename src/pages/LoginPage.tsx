import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, School, AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react'
import FullLogo from '../components/FullLogo'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, clearSession, forceRoleRefresh } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await signIn(data.email, data.password)
      
      if (error) {
        setError(error.message)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Background Circles */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Chart-like Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/10 rounded-lg rotate-12 animate-bounce delay-700"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border border-white/10 rounded-full animate-bounce delay-300"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 border border-white/10 rounded-lg -rotate-12 animate-bounce delay-1000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-300/50 rounded-full animate-ping delay-500"></div>
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-indigo-300/50 rounded-full animate-ping delay-1000"></div>
        
        {/* Data Visualization Elements */}
        <div className="absolute top-32 right-20 space-y-2">
          <div className="w-16 h-2 bg-gradient-to-r from-blue-400/30 to-transparent rounded"></div>
          <div className="w-12 h-2 bg-gradient-to-r from-indigo-400/30 to-transparent rounded"></div>
          <div className="w-20 h-2 bg-gradient-to-r from-purple-400/30 to-transparent rounded"></div>
        </div>
        
        <div className="absolute bottom-40 left-20 space-y-3">
          <div className="flex space-x-1">
            <div className="w-1 h-8 bg-blue-400/20 rounded"></div>
            <div className="w-1 h-12 bg-indigo-400/20 rounded"></div>
            <div className="w-1 h-6 bg-purple-400/20 rounded"></div>
            <div className="w-1 h-10 bg-blue-400/20 rounded"></div>
          </div>
        </div>
        
        {/* Finance-themed Icons */}
        <div className="absolute top-1/3 right-1/3 text-white/10">
          <School className="w-16 h-16 animate-pulse" />
        </div>
        <div className="absolute bottom-1/3 left-1/3 text-white/10">
          <Lock className="w-12 h-12 animate-pulse delay-700" />
        </div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-8 border border-white/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <FullLogo className="w-64 h-20" />
            </div>
            <p className="mt-2 text-gray-600 font-medium">
              School Finance Management System
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Debug Buttons - Remove after fixing */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">Debug Tools (Temporary):</p>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => {
                  clearSession()
                  window.location.reload()
                }}
                className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Clear Session & Reload
              </button>
              <button
                type="button"
                onClick={forceRoleRefresh}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Force Role Refresh
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/70 font-medium">
            Secure school finance management system
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
