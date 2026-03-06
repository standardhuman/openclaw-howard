import { createClient } from '@supabase/supabase-js'

let _supabase = null

export function getSupabase() {
  if (!_supabase) {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL || 'https://aaxnoeirtjlizdhnbqbr.supabase.co'
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheG5vZWlydGpsaXpkaG5icWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODM5MzYsImV4cCI6MjA3ODM1OTkzNn0.VNi_UCqEiUAM8AoAtH1QrPJUocJILq28a3RV-W1qyII'
      _supabase = createClient(url, key)
    } catch (e) {
      console.error('Failed to init Supabase:', e)
      return null
    }
  }
  return _supabase
}

// Backward compat
export const supabase = null
