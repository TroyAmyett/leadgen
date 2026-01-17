'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

type AuthMode = 'signin' | 'signup' | 'reset'

export default function AuthPage() {
  const router = useRouter()
  const { user, loading, error, signIn, signUp, resetPassword, clearError } = useAuthStore()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    clearError()

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password)
        if (!result.error) {
          router.push('/')
        }
      } else if (mode === 'signup') {
        const result = await signUp(email, password)
        if (!result.error) {
          router.push('/')
        }
      } else if (mode === 'reset') {
        const result = await resetPassword(email)
        if (!result.error) {
          setResetSent(true)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    clearError()
    setResetSent(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fl-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-fl-primary/20 mb-4">
            <Users className="w-8 h-8 text-fl-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-fl-text-primary">LeadGen</h1>
          <p className="text-fl-text-secondary mt-1">Lead generation & enrichment</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-medium text-fl-text-primary mb-6">
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset' && 'Reset your password'}
          </h2>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-fl-error/20 border border-fl-error/30"
            >
              <AlertCircle className="w-4 h-4 text-fl-error flex-shrink-0" />
              <p className="text-sm text-fl-error">{error}</p>
            </motion.div>
          )}

          {/* Reset Sent Message */}
          {resetSent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-lg bg-fl-success/20 border border-fl-success/30"
            >
              <p className="text-sm text-fl-success">
                Check your email for a password reset link.
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fl-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password (not shown for reset mode) */}
            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fl-text-muted" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fl-text-muted hover:text-fl-text-secondary"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-sm text-fl-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {mode === 'signin' && 'Signing in...'}
                  {mode === 'signup' && 'Creating account...'}
                  {mode === 'reset' && 'Sending reset link...'}
                </span>
              ) : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Link'}
                </>
              )}
            </button>
          </form>

          {/* Mode Switch */}
          <div className="mt-6 text-center text-sm text-fl-text-secondary">
            {mode === 'signin' && (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-fl-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="text-fl-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'reset' && (
              <button
                onClick={() => switchMode('signin')}
                className="text-fl-primary hover:underline font-medium"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-fl-text-muted mt-6">
          Part of the Funnelists suite of tools
        </p>
      </motion.div>
    </div>
  )
}
