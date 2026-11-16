import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const configured = Boolean(url && key)
export const SUPABASE_URL = url
export const SUPABASE_KEY = key
export const supabase = configured ? createClient(url!, key!) : null
