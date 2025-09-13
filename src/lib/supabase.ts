import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface School {
  id: string
  name: string
  address?: string
  phone?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface SuperAdmin {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
}

export interface SchoolAdmin {
  id: string
  name: string
  email: string
  phone?: string
  school_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface FinanceStaff {
  id: string
  name: string
  email: string
  phone?: string
  school_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Student {
  id: string
  name: string
  class_name: string
  school_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface FeeItem {
  id: string
  name: string
  amount: number
  school_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Invoice {
  id: string
  student_id: string
  fee_item_id: string
  amount: number
  status: 'paid' | 'unpaid'
  due_date?: string
  paid_date?: string
  school_id: string
  created_at: string
  updated_at: string
}

export type UserRole = 'super_admin' | 'school_admin' | 'finance_staff' | 'sub_admin'
export type PaymentStatus = 'paid' | 'unpaid'

// Permission system types
export interface Permissions {
  students?: {
    view?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
    bulk_import?: boolean
  }
  invoices?: {
    view?: boolean
    create?: boolean
    edit?: boolean
    mark_paid?: boolean
    bulk_update?: boolean
  }
  reports?: {
    view?: boolean
    export?: boolean
  }
  fee_items?: {
    view?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
  }
  users?: {
    view?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
  }
  all?: boolean // For super_admin and school_admin
}

