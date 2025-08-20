import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_type: 'free' | 'professional' | 'team'
  usage_count: number
  usage_limit: number
  expires_at?: string
  created_at: string
}

export interface AIAgent {
  id: string
  name: string
  description?: string
  avatar_url?: string
  dify_api_endpoint: string
  api_key: string
  required_plan: 'free' | 'professional' | 'team'
  is_active: boolean
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  agent_id: string
  title?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  subscription_id?: string
  order_number: string
  amount: number
  payment_method: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  created_at: string
}