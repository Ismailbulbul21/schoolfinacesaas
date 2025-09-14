import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

type User = {
  id: string
  email?: string
  phone?: string
  created_at: string
  updated_at?: string
  aud: string
  role?: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  identities?: any[]
  factors?: any[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  schoolId: string | null
  userRole: string | null
  userDbId: string | null
  clearSession: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any }>
  createSuperAdmin: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  session: any
  refreshSessionIfNeeded: () => Promise<void>
  forceRoleRefresh: () => Promise<void>
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
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userDbId, setUserDbId] = useState<string | null>(null)

  const saveSessionData = useCallback((role: string, schoolId: string, email: string) => {
    const sessionData = {
      role,
      schoolId,
      email,
      timestamp: Date.now()
    }
    localStorage.setItem('sessionData', JSON.stringify(sessionData))
    // Session data saved
  }, [])

  const loadPersistedSession = useCallback(async (email: string) => {
    try {
      const sessionData = localStorage.getItem('sessionData')
      if (sessionData) {
        const { role, schoolId: persistedSchoolId, email: persistedEmail } = JSON.parse(sessionData)
        
        // Check if session is recent (within 24 hours)
        const isRecent = Date.now() - JSON.parse(sessionData).timestamp < 24 * 60 * 60 * 1000
        
        if (persistedEmail === email && isRecent) {
          // Loading persisted session
          setUserRole(role)
          setSchoolId(persistedSchoolId)
          setLoading(false)
          return true
        }
      }
    } catch (error) {
      console.error('Error loading persisted session:', error)
    }
    return false
  }, [])



  const determineUserRole = useCallback(async (email: string) => {
      // Determining user role
      console.log('Determining user role for:', email)
    
    try {
      // Check if user is a school admin
      // Checking school_admins table
      console.log('Checking school_admins table for:', email)
      const { data: schoolAdminData, error: schoolAdminError } = await supabase
        .from('school_admins')
        .select('id, school_id')
        .eq('email', email)
        .limit(1)
      
      console.log('School admin query result:', { schoolAdminData, schoolAdminError })
      
      if (schoolAdminError) {
        console.error('Error checking school admin:', schoolAdminError)
        throw schoolAdminError
      }

      if (schoolAdminData && schoolAdminData.length > 0) {
        // Found school admin
        console.log('Found school admin:', schoolAdminData[0])
        setUserRole('school_admin')
        setSchoolId(schoolAdminData[0].school_id)
        setUserDbId(schoolAdminData[0].id)
        saveSessionData('school_admin', schoolAdminData[0].school_id, email)
        setLoading(false)
        return
      }

      // Check if user is a super admin
      // Checking super_admins table
      console.log('Checking super_admins table for:', email)
      const { data: superAdminData, error: superAdminError } = await supabase
        .from('super_admins')
        .select('id')
        .eq('email', email)
        .limit(1)
      
      console.log('Super admin query result:', { superAdminData, superAdminError })
      
      if (superAdminError) {
        console.error('Error checking super admin:', superAdminError)
        throw superAdminError
      }

      if (superAdminData && superAdminData.length > 0) {
        // Found super admin
        console.log('Found super admin:', superAdminData[0])
        setUserRole('super_admin')
        setSchoolId(null)
        setUserDbId(superAdminData[0].id)
        saveSessionData('super_admin', '', email)
        setLoading(false)
        return
      }

      // Check if user is finance staff
      // Checking finance_staff table
      const { data: financeStaffData, error: financeStaffError } = await supabase
        .from('finance_staff')
        .select('id, school_id')
        .eq('email', email)
        .limit(1)
      
      if (financeStaffError) {
        console.error('Error checking finance staff:', financeStaffError)
        throw financeStaffError
      }

      if (financeStaffData && financeStaffData.length > 0) {
        // Found finance staff
        console.log('Found finance staff:', financeStaffData[0])
        setUserRole('finance_staff')
        setSchoolId(financeStaffData[0].school_id)
        setUserDbId(financeStaffData[0].id)
        saveSessionData('finance_staff', financeStaffData[0].school_id, email)
        setLoading(false)
        return
      }

      // No role found
      console.log('No role found for user:', email)
      setUserRole(null)
      setSchoolId(null)
      setUserDbId(null)
      setLoading(false)
      
    } catch (error) {
      console.error('Error determining user role:', error)
      setUserRole(null)
      setSchoolId(null)
      setUserDbId(null)
      setLoading(false)
    }
  }, [saveSessionData])

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('Sign in called for:', email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }
      
      console.log('Sign in successful:', data)
      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }, [])

  const signOut = useCallback(async () => {
    console.log('Manual sign out called')
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserRole(null)
      setSchoolId(null)
      setUserDbId(null)
      localStorage.removeItem('sessionData')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  const clearSession = useCallback(() => {
    console.log('Clearing session data')
    localStorage.removeItem('sessionData')
    setUserRole(null)
    setSchoolId(null)
    setUserDbId(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    console.log('Initializing authentication...')
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Initial session:', session)
          setUser(session.user)
          
          // Try to load persisted session first
          const persistedLoaded = await loadPersistedSession(session.user.email!)
          if (persistedLoaded) {
            console.log('Using persisted session, loading immediately')
            return
          }
          
          // If no persisted session, determine role
          console.log('Determining role for user:', session.user.email)
          await determineUserRole(session.user.email!)
        } else {
          console.log('No initial session found')
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', { event, session })
      console.log('Event type:', event)
      console.log('Session exists:', !!session)
      console.log('User exists:', !!session?.user)
      
      if (session?.user) {
        console.log('Setting user and determining role for:', session.user.email)
        setUser(session.user)
        
        // Check if we already have a persisted role for this user
        const sessionData = localStorage.getItem('sessionData')
        if (sessionData) {
          const { email: persistedEmail } = JSON.parse(sessionData)
          if (persistedEmail === session.user.email) {
            console.log('User already has persisted role, skipping role determination')
            return
          }
        }
        
        console.log('User authenticated, determining role')
        await determineUserRole(session.user.email!)
      } else {
        console.log('User signed out, clearing state')
        setUser(null)
        setUserRole(null)
        setSchoolId(null)
        setUserDbId(null)
        localStorage.removeItem('sessionData')
      }
    })

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Auth timeout - forcing loading to false')
      setLoading(false)
    }, 30000) // 30 second timeout

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [determineUserRole, loadPersistedSession])

  const value = {
    user,
    loading,
    signIn,
    signOut,
    schoolId,
    userRole,
    userDbId,
    clearSession,
    changePassword: async (_currentPassword: string, newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      return { error }
    },
    createSuperAdmin: async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: fullName }
      })
      if (error) return { error }
      
      // Add to super_admins table
      const { error: insertError } = await supabase
        .from('super_admins')
        .insert([{ email, full_name: fullName }])
      
      return { error: insertError }
    },
    session: null,
    refreshSessionIfNeeded: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { error } = await supabase.auth.refreshSession()
        if (error) console.error('Error refreshing session:', error)
      }
    },
    forceRoleRefresh: async () => {
      if (user?.email) {
        setLoading(true)
        await determineUserRole(user.email)
      }
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}