import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserRole } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  schoolId: string | null
  loading: boolean
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  createSuperAdmin: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>
  changePassword: (newPassword: string) => Promise<{ error: AuthError | null }>
  refreshSessionIfNeeded: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}


// Helper function to detect network errors
const isNetworkError = (error: any) => {
  return error?.message?.includes('Failed to load resource') ||
         error?.message?.includes('404') ||
         error?.message?.includes('Network Error') ||
         error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
         error?.message?.includes('Invalid Refresh Token')
}

// Helper function to retry queries with exponential backoff
const retryQuery = async <T,>(
  queryFn: () => Promise<T>, 
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn()
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1
      const isRetryableError = error?.message?.includes('406') || 
                              error?.message?.includes('timeout') ||
                              error?.message?.includes('Network Error') ||
                              isNetworkError(error)
      
      if (isLastAttempt || !isRetryableError) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`🔄 Query failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// Simplified query to get user role and school_id
const getUserRoleAndSchool = async (email: string): Promise<{ role: UserRole; schoolId: string | null } | null> => {
  try {
    console.log('🔍 Fetching user role for:', email)
    
    // Check if we're in production and add timeout
    const isProduction = typeof window !== 'undefined' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1'
    
    const timeout = isProduction ? 10000 : 5000 // 10s for production, 5s for local
    
    // Create a timeout promise
    const timeoutPromise = new Promise<{ role: UserRole; schoolId: string | null }>((_, reject) => {
      setTimeout(() => reject(new Error('Role detection timeout')), timeout)
    })
    
    // Race between role detection and timeout
    const roleDetection = async (): Promise<{ role: UserRole; schoolId: string | null }> => {
      // Try super_admin first
      try {
        console.log('👑 Checking super admin...')
        const startTime = Date.now()
        const result = await retryQuery(async () => {
          return await supabase
            .from('super_admins')
            .select('email')
            .eq('email', email)
            .single()
        })
        const { data, error } = result as { data: any; error: any }
        console.log(`⏱️ Super admin query took: ${Date.now() - startTime}ms`)
        
        if (data && !error) {
          console.log('✅ Found super admin')
          // Cache the role for production
          if (isProduction) {
            try {
              localStorage.setItem(`role_${email}`, 'super_admin')
              localStorage.setItem(`schoolId_${email}`, 'null')
            } catch (cacheError) {
              console.log('⚠️ Failed to cache role:', cacheError)
            }
          }
          return { role: 'super_admin', schoolId: null }
        }
      } catch (error) {
        console.log('⚠️ Super admin query failed:', error)
      }

      // Try school_admin
      try {
        console.log('🏫 Checking school admin...')
        const startTime = Date.now()
        const result = await retryQuery(async () => {
          return await supabase
            .from('school_admins')
            .select('email, school_id')
            .eq('email', email)
            .eq('is_active', true)
            .single()
        })
        const { data, error } = result as { data: any; error: any }
        console.log(`⏱️ School admin query took: ${Date.now() - startTime}ms`)
        
        if (data && !error) {
          console.log('✅ Found school admin, school_id:', data.school_id)
          // Cache the role for production
          if (isProduction) {
            try {
              localStorage.setItem(`role_${email}`, 'school_admin')
              localStorage.setItem(`schoolId_${email}`, data.school_id)
            } catch (cacheError) {
              console.log('⚠️ Failed to cache role:', cacheError)
            }
          }
          return { role: 'school_admin', schoolId: data.school_id }
        }
      } catch (error) {
        console.log('⚠️ School admin query failed:', error)
      }

      // Try finance_staff
      try {
        console.log('💰 Checking finance staff...')
        const startTime = Date.now()
        const result = await retryQuery(async () => {
          return await supabase
            .from('finance_staff')
            .select('email, school_id')
            .eq('email', email)
            .eq('is_active', true)
            .single()
        })
        const { data, error } = result as { data: any; error: any }
        console.log(`⏱️ Finance staff query took: ${Date.now() - startTime}ms`)
        
        if (data && !error) {
          console.log('✅ Found finance staff, school_id:', data.school_id)
          // Cache the role for production
          if (isProduction) {
            try {
              localStorage.setItem(`role_${email}`, 'finance_staff')
              localStorage.setItem(`schoolId_${email}`, data.school_id)
            } catch (cacheError) {
              console.log('⚠️ Failed to cache role:', cacheError)
            }
          }
          return { role: 'finance_staff', schoolId: data.school_id }
        }
      } catch (error) {
        console.log('⚠️ Finance staff query failed:', error)
      }

      console.log('⚠️ No role found for user')
      return { role: 'sub_admin' as UserRole, schoolId: null }
    }
    
    try {
      const result = await Promise.race([roleDetection(), timeoutPromise])
      return result
    } catch (timeoutError) {
      console.error('⏰ Role detection timed out, using fallback')
      // Fallback: if it's the known super admin email, return super_admin
      if (email === 'ismailbulbul381@gmail.com') {
        console.log('🔄 Fallback: Setting as super admin')
        return { role: 'super_admin', schoolId: null }
      }
      
      // For production, try to get school admin role from localStorage as fallback
      if (isProduction) {
        try {
          const cachedRole = localStorage.getItem(`role_${email}`)
          const cachedSchoolId = localStorage.getItem(`schoolId_${email}`)
          if (cachedRole && cachedSchoolId) {
            console.log('🔄 Using cached role from localStorage:', cachedRole)
            const validRoles: UserRole[] = ['super_admin', 'school_admin', 'finance_staff', 'sub_admin']
            if (validRoles.includes(cachedRole as UserRole)) {
              return { 
                role: cachedRole as UserRole, 
                schoolId: cachedSchoolId === 'null' ? null : cachedSchoolId as string 
              }
            }
          }
        } catch (cacheError) {
          console.log('⚠️ Failed to read from localStorage:', cacheError)
        }
      }
      
      // Otherwise, set as sub_admin as fallback
      console.log('🔄 Fallback: Setting as sub_admin')
      return { role: 'sub_admin', schoolId: null }
    }
  } catch (error) {
    console.error('❌ Exception in getUserRoleAndSchool:', error)
    // Fallback: if it's the known super admin email, return super_admin
    if (email === 'ismailbulbul381@gmail.com') {
      console.log('🔄 Exception fallback: Setting as super admin')
      return { role: 'super_admin', schoolId: null }
    }
    // Otherwise, set as sub_admin as fallback
    console.log('🔄 Exception fallback: Setting as sub_admin')
    return { role: 'sub_admin', schoolId: null }
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  // Ref to prevent multiple simultaneous role fetches
  const fetchingRoleRef = useRef(false)

  // Check if running in production
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1'

  // Optimized function to fetch user role and school
  const fetchUserRole = async (user: User) => {
    if (fetchingRoleRef.current) {
      console.log('⏳ Role fetch already in progress, skipping...')
      return
    }

    fetchingRoleRef.current = true
    setLoading(true)

    try {
      console.log('🚀 Starting role fetch for:', user.email)
      
      const result = await getUserRoleAndSchool(user.email || '')
      
      if (result) {
        setUserRole(result.role)
        setSchoolId(result.schoolId)
        console.log('✅ Role set:', result.role, 'School ID:', result.schoolId)
      } else {
        // No role found - set as sub_admin (fallback)
        setUserRole('sub_admin')
        setSchoolId(null)
        console.log('⚠️ No role found, set as sub_admin')
      }
    } catch (error) {
      console.error('❌ Error in fetchUserRole:', error)
      setUserRole('sub_admin')
      setSchoolId(null)
    } finally {
      setLoading(false)
      // Use setTimeout to ensure the ref is reset after state updates
      setTimeout(() => {
        fetchingRoleRef.current = false
      }, 100)
      console.log('🏁 Role fetch completed')
    }
  }

  // Initialize authentication
  useEffect(() => {
    let mounted = true

    // Clear session if domain changed
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : ''
    const storedDomain = typeof window !== 'undefined' ? localStorage.getItem('auth_domain') : null
    
    if (storedDomain && storedDomain !== currentDomain) {
      console.log('🌐 Domain changed, clearing session')
      supabase.auth.signOut()
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_domain', currentDomain)
    }

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error getting session:', error)
          // Clear invalid session
          if (isNetworkError(error)) {
            console.log('🧹 Clearing invalid session due to network error')
            await supabase.auth.signOut()
          }
          if (mounted) setLoading(false)
          return
        }

        if (session?.user && mounted) {
          console.log('👤 User found in session:', session.user.email)
          setUser(session.user)
          setSession(session)
          await fetchUserRole(session.user)
        } else if (mounted) {
          console.log('🚫 No user in session')
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
        // Clear invalid session on error
        if (isNetworkError(error)) {
          console.log('🧹 Clearing invalid session due to error')
          await supabase.auth.signOut()
        }
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          setSession(session)
          // Add small delay to prevent race conditions
          setTimeout(() => {
            if (mounted) {
              fetchUserRole(session.user)
            }
          }, 100)
        } else {
          setUser(null)
          setUserRole(null)
          setSchoolId(null)
          setSession(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && user) {
        console.warn('⏰ Loading timeout - forcing loading to false')
        setLoading(false)
        fetchingRoleRef.current = false
      }
    }, 3000) // 3 second timeout (reduced from 5)

    return () => clearTimeout(timeout)
  }, [loading, user])

  // Handle page unload and clear sensitive data
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear sensitive data when leaving the page
      if (isProduction) {
        console.log('🧹 Clearing sensitive data on page unload')
        localStorage.removeItem('supabase.auth.token')
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isProduction) {
        console.log('👁️ Page hidden, clearing sensitive data')
        localStorage.removeItem('supabase.auth.token')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isProduction])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Attempting sign in for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        return { error }
      }

      if (data.user) {
        console.log('✅ Sign in successful')
        setUser(data.user)
        setSession(data.session)
        await fetchUserRole(data.user)
      }

      return { error: null }
    } catch (error) {
      console.error('❌ Sign in exception:', error)
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...')
      await supabase.auth.signOut()
      setUser(null)
      setUserRole(null)
      setSchoolId(null)
      setSession(null)
      
      // Clear cached roles
      if (typeof window !== 'undefined') {
        try {
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.startsWith('role_') || key.startsWith('schoolId_')) {
              localStorage.removeItem(key)
            }
          })
          console.log('🧹 Cleared cached roles')
        } catch (cacheError) {
          console.log('⚠️ Failed to clear cache:', cacheError)
        }
      }
      
      console.log('✅ Sign out successful')
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }

  const createSuperAdmin = async (email: string, password: string, fullName: string) => {
    try {
      console.log('👑 Creating super admin:', email)
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        console.error('❌ Auth user creation error:', authError)
        return { error: authError }
      }

      if (!authData.user) {
        console.error('❌ No user returned from signup')
        return { error: { message: 'Failed to create user' } as AuthError }
      }

      // Create super admin record
      const { error: dbError } = await supabase
        .from('super_admins')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
        })

      if (dbError) {
        console.error('❌ Database insert error:', dbError)
        // Clean up auth user if database insert fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        return { error: { message: dbError.message, status: 400 } as AuthError }
      }

      console.log('✅ Super admin created successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Create super admin exception:', error)
      return { error: error as AuthError }
    }
  }

  const changePassword = async (newPassword: string) => {
    try {
      console.log('🔒 Changing password...')
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('❌ Password change error:', error)
        return { error }
      }

      console.log('✅ Password changed successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Password change exception:', error)
      return { error: error as AuthError }
    }
  }

  const refreshSessionIfNeeded = async () => {
    try {
      console.log('🔄 Refreshing session...')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('❌ Session refresh error:', error)
        // Clear invalid session
        if (isNetworkError(error) || error.message?.includes('Invalid Refresh Token')) {
          console.log('🧹 Clearing invalid session due to refresh token error')
          await supabase.auth.signOut()
          setUser(null)
          setUserRole(null)
          setSchoolId(null)
          setSession(null)
        }
        return
      }

      if (data.session) {
        setSession(data.session)
        if (data.user) {
          setUser(data.user)
          await fetchUserRole(data.user)
        }
        console.log('✅ Session refreshed successfully')
      }
    } catch (error) {
      console.error('❌ Session refresh exception:', error)
      // Clear invalid session on exception
      if (isNetworkError(error)) {
        console.log('🧹 Clearing invalid session due to refresh exception')
        await supabase.auth.signOut()
        setUser(null)
        setUserRole(null)
        setSchoolId(null)
        setSession(null)
      }
    }
  }

  const value: AuthContextType = {
    user,
    userRole,
    schoolId,
    loading,
    session,
    signIn,
    signOut,
    createSuperAdmin,
    changePassword,
    refreshSessionIfNeeded,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}