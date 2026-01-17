import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  accountId: string | null
  loading: boolean
  error: string | null
  initialized: boolean

  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  accountId: null,
  loading: true,
  error: null,
  initialized: false,

  initialize: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      set({ loading: false, initialized: true })
      return
    }

    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth initialization error:', error)
        set({ loading: false, initialized: true, error: error.message })
        return
      }

      if (session?.user) {
        // Fetch user's account
        const { data: userAccount } = await supabase
          .from('user_accounts')
          .select('account_id')
          .eq('user_id', session.user.id)
          .single()

        set({
          user: session.user,
          session,
          accountId: userAccount?.account_id || null,
          loading: false,
          initialized: true,
        })
      } else {
        set({ loading: false, initialized: true })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user && supabase) {
          const { data: userAccount } = await supabase
            .from('user_accounts')
            .select('account_id')
            .eq('user_id', session.user.id)
            .single()

          set({
            user: session.user,
            session,
            accountId: userAccount?.account_id || null,
          })
        } else {
          set({
            user: null,
            session: null,
            accountId: null,
          })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false, initialized: true })
    }
  },

  signUp: async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Supabase not configured' }
    }

    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        set({ loading: false, error: error.message })
        return { error: error.message }
      }

      if (data.user) {
        // Create account for new user
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .insert({ name: `${email}'s Account` })
          .select()
          .single()

        if (account && !accountError) {
          await supabase
            .from('user_accounts')
            .insert({
              user_id: data.user.id,
              account_id: account.id,
              role: 'owner',
            })

          set({ accountId: account.id })
        }

        set({
          user: data.user,
          session: data.session,
          loading: false,
        })
      }

      return {}
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed'
      set({ loading: false, error: message })
      return { error: message }
    }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Supabase not configured' }
    }

    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        set({ loading: false, error: error.message })
        return { error: error.message }
      }

      if (data.user) {
        // Fetch user's account
        const { data: userAccount } = await supabase
          .from('user_accounts')
          .select('account_id')
          .eq('user_id', data.user.id)
          .single()

        // If no account exists, create one
        if (!userAccount) {
          const { data: account } = await supabase
            .from('accounts')
            .insert({ name: `${email}'s Account` })
            .select()
            .single()

          if (account) {
            await supabase
              .from('user_accounts')
              .insert({
                user_id: data.user.id,
                account_id: account.id,
                role: 'owner',
              })

            set({ accountId: account.id })
          }
        } else {
          set({ accountId: userAccount.account_id })
        }

        set({
          user: data.user,
          session: data.session,
          loading: false,
        })
      }

      return {}
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      set({ loading: false, error: message })
      return { error: message }
    }
  },

  signOut: async () => {
    if (!supabase) return

    set({ loading: true })
    await supabase.auth.signOut()
    set({
      user: null,
      session: null,
      accountId: null,
      loading: false,
    })
  },

  resetPassword: async (email: string) => {
    if (!supabase) {
      return { error: 'Supabase not configured' }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed'
      return { error: message }
    }
  },

  clearError: () => set({ error: null }),
}))
