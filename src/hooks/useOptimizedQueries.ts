import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Optimized query configurations
const QUERY_CONFIGS = {
  // Cache for 10 minutes, stale for 5 minutes
  shortTerm: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  // Cache for 30 minutes, stale for 15 minutes
  mediumTerm: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  // Cache for 2 hours, stale for 1 hour
  longTerm: {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  }
}

// Hook for optimized school data queries
export const useOptimizedSchools = () => {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data
    },
    enabled: userRole === 'super_admin',
    ...QUERY_CONFIGS.mediumTerm
  })
}

// Hook for optimized user role queries
export const useOptimizedUserRole = (email: string) => {
  return useQuery({
    queryKey: ['userRole', email],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_role', {
        user_email: email
      })
      
      if (error) throw error
      return data?.[0] || null
    },
    enabled: !!email,
    ...QUERY_CONFIGS.longTerm
  })
}

// Hook for optimized students queries
export const useOptimizedStudents = (schoolId: string) => {
  const { userRole, schoolId: userSchoolId } = useAuth()
  
  return useQuery({
    queryKey: ['students', schoolId || userSchoolId],
    queryFn: async () => {
      const targetSchoolId = schoolId || userSchoolId
      if (!targetSchoolId) return []
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', targetSchoolId)
        .order('name')
      
      if (error) throw error
      return data
    },
    enabled: !!schoolId || !!userSchoolId,
    ...QUERY_CONFIGS.mediumTerm
  })
}

// Hook for optimized fee items queries
export const useOptimizedFeeItems = (schoolId: string) => {
  const { userRole, schoolId: userSchoolId } = useAuth()
  
  return useQuery({
    queryKey: ['feeItems', schoolId || userSchoolId],
    queryFn: async () => {
      const targetSchoolId = schoolId || userSchoolId
      if (!targetSchoolId) return []
      
      const { data, error } = await supabase
        .from('fee_items')
        .select('*')
        .eq('school_id', targetSchoolId)
        .order('name')
      
      if (error) throw error
      return data
    },
    enabled: !!schoolId || !!userSchoolId,
    ...QUERY_CONFIGS.mediumTerm
  })
}

// Hook for optimized invoices queries
export const useOptimizedInvoices = (schoolId: string, filters?: { status?: string, class_name?: string }) => {
  const { userRole, schoolId: userSchoolId } = useAuth()
  
  return useQuery({
    queryKey: ['invoices', schoolId || userSchoolId, filters],
    queryFn: async () => {
      const targetSchoolId = schoolId || userSchoolId
      if (!targetSchoolId) return []
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          students(name, class_name),
          fee_items(name, amount)
        `)
        .eq('school_id', targetSchoolId)
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters?.class_name) {
        query = query.eq('students.class_name', filters.class_name)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!schoolId || !!userSchoolId,
    ...QUERY_CONFIGS.shortTerm
  })
}

// Hook to prefetch common data
export const usePrefetchData = () => {
  const queryClient = useQueryClient()
  const { userRole, schoolId } = useAuth()
  
  const prefetchCommonData = async () => {
    if (userRole === 'super_admin') {
      await queryClient.prefetchQuery({
        queryKey: ['schools'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('schools')
            .select('*')
            .order('name')
          
          if (error) throw error
          return data
        },
        ...QUERY_CONFIGS.mediumTerm
      })
    }
    
    if (schoolId) {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['students', schoolId],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('students')
              .select('*')
              .eq('school_id', schoolId)
              .order('name')
            
            if (error) throw error
            return data
          },
          ...QUERY_CONFIGS.mediumTerm
        }),
        queryClient.prefetchQuery({
          queryKey: ['feeItems', schoolId],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('fee_items')
              .select('*')
              .eq('school_id', schoolId)
              .order('name')
            
            if (error) throw error
            return data
          },
          ...QUERY_CONFIGS.mediumTerm
        })
      ])
    }
  }
  
  return { prefetchCommonData }
}
