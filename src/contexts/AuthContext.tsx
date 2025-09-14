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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  // Add a ref to track if fetchUserDetails is already running
  const fetchingRef = useRef(false)

  // Fetch user role and school ID based on user type
  const fetchUserDetails = async (user: User) => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      console.log('fetchUserDetails already running, skipping...')
      return
    }
    
    fetchingRef.current = true
    console.log('=== fetchUserDetails START ===')
    console.log('Fetching user details for:', user.email)
    
    // Immediate fallback for known super admin
    if (user.email === 'ismailbulbul381@gmail.com') {
      console.log('Immediate fallback: Setting as super admin based on known email')
      setUserRole('super_admin')
      setSchoolId(null)
      setLoading(false)
      console.log('=== fetchUserDetails END (fallback) ===')
      fetchingRef.current = false
      return
    }
    
    try {
      console.log('Attempting database queries...')
      
      // Check current session state
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      console.log('Current session:', currentSession)
      
      // Simple approach - check each table one by one with proper error handling
      console.log('Checking super admin...')
      const { data: superAdmin, error: superAdminError } = await supabase
        .from('super_admins')
        .select('id')
        .eq('email', user.email)
        .maybeSingle()

      console.log('Super admin query result:', { superAdmin, superAdminError })

      if (superAdmin && !superAdminError) {
        console.log('User is super admin')
        setUserRole('super_admin')
        setSchoolId(null)
        setLoading(false)
        console.log('=== fetchUserDetails END (super admin) ===')
        fetchingRef.current = false
        return
      }

      console.log('Checking school admin...')
      const { data: schoolAdmin, error: schoolAdminError } = await supabase
        .from('school_admins')
        .select('id, school_id')
        .eq('email', user.email)
        .maybeSingle()

      console.log('School admin query result:', { schoolAdmin, schoolAdminError })

      if (schoolAdmin && !schoolAdminError) {
        console.log('User is school admin for school:', schoolAdmin.school_id)
        setUserRole('school_admin')
        setSchoolId(schoolAdmin.school_id)
        setLoading(false)
        console.log('=== fetchUserDetails END (school admin) ===')
        fetchingRef.current = false
        return
      }

      console.log('Checking finance staff...')
      const { data: financeStaff, error: financeStaffError } = await supabase
        .from('finance_staff')
        .select('id, school_id')
        .eq('email', user.email)
        .maybeSingle()

      console.log('Finance staff query result:', { financeStaff, financeStaffError })

      if (financeStaff && !financeStaffError) {
        console.log('User is finance staff for school:', financeStaff.school_id)
        setUserRole('finance_staff')
        setSchoolId(financeStaff.school_id)
        setLoading(false)
        console.log('=== fetchUserDetails END (finance staff) ===')
        fetchingRef.current = false
        return
      }

      // If no role found, set as sub_admin (fallback)
      console.log('No specific role found, setting as sub_admin')
      setUserRole('sub_admin')
      setSchoolId(null)
      setLoading(false)
      console.log('=== fetchUserDetails END (sub admin) ===')
      fetchingRef.current = false
    } catch (error) {
      console.error('Error fetching user details:', error)
      
      // Fallback: Check if this is a known super admin email even in error case
      if (user.email === 'ismailbulbul381@gmail.com') {
        console.log('Error fallback: Setting as super admin based on known email')
        setUserRole('super_admin')
        setSchoolId(null)
        setLoading(false)
        console.log('=== fetchUserDetails END (error fallback) ===')
        fetchingRef.current = false
        return
      }
      
      setUserRole(null)
      setSchoolId(null)
      setLoading(false)
      console.log('=== fetchUserDetails END (error) ===')
    } finally {
      // Reset the fetching flag
      fetchingRef.current = false
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          setSession(session)
          await fetchUserDetails(session.user)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
          setSession(session)
          // Use setTimeout to ensure the state updates are processed first
          setTimeout(async () => {
            await fetchUserDetails(session.user)
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

    return () => subscription.unsubscribe()
  }, [])

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && user) {
        console.warn('Loading timeout - setting loading to false')
        setLoading(false)
      }
    }, 3000) // 3 second timeout

    return () => clearTimeout(timeout)
  }, [loading, user])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      if (data.user) {
        setUser(data.user)
        setSession(data.session)
        await fetchUserDetails(data.user)
      }

      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserRole(null)
      setSchoolId(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const createSuperAdmin = async (email: string, password: string, fullName: string) => {
    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        return { error: authError }
      }

      if (!authData.user) {
        return { error: { message: 'Failed to create user' } as AuthError }
      }

      // Then create the super admin record
      const { error: dbError } = await supabase
        .from('super_admins')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
        })

      if (dbError) {
        // If database insert fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id)
        return { error: { message: dbError.message, status: 400 } as AuthError }
      }

      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const refreshSessionIfNeeded = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        return
      }

      if (data.session) {
        setSession(data.session)
        if (data.user) {
          setUser(data.user)
          await fetchUserDetails(data.user)
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
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
