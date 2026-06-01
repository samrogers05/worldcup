import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          password: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          password?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          password?: string | null
        }
        Relationships: []
      }
      games: {
        Row: {
          id: string
          stage: 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'F'
          group_name: string | null
          home_team: string
          away_team: string
          kickoff_time: string | null
          actual_home: number | null
          actual_away: number | null
          match_number: number | null
          created_at: string
        }
        Insert: {
          id?: string
          stage: 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'F'
          group_name?: string | null
          home_team: string
          away_team: string
          kickoff_time?: string | null
          actual_home?: number | null
          actual_away?: number | null
          match_number?: number | null
          created_at?: string
        }
        Update: {
          stage?: 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'F'
          group_name?: string | null
          home_team?: string
          away_team?: string
          kickoff_time?: string | null
          actual_home?: number | null
          actual_away?: number | null
          match_number?: number | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          game_id: string
          predicted_home: number
          predicted_away: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          predicted_home: number
          predicted_away: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          predicted_home?: number
          predicted_away?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          value?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ----------------------------------------------------------------
// Browser client (singleton, safe to call in Client Components)
// ----------------------------------------------------------------

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return browserClient
}

// ----------------------------------------------------------------
// Server client — anon key (for Server Components / Route Handlers)
// Uses the service role key is NOT used here; use getSupabaseAdminClient
// for admin-only operations.
// ----------------------------------------------------------------

export function getSupabaseServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ----------------------------------------------------------------
// Admin client — service role key (server-side only, never expose)
// Bypasses RLS. Use only in Server Actions behind the admin password gate.
// ----------------------------------------------------------------

export function getSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}
