'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuthStore()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fl-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Placeholder stats - will be replaced with real data from Supabase
  const stats = {
    total: 0,
    enriched: 0,
    pending: 0,
    errors: 0,
    enrichmentRate: 0,
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-fl-text-primary">Dashboard</h1>
        <p className="text-fl-text-secondary mt-1">Overview of your lead generation activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-fl-primary/20">
              <Users className="w-5 h-5 text-fl-primary" />
            </div>
            <div>
              <p className="stats-card-label">Total Leads</p>
              <p className="stats-card-value">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-fl-success/20">
              <CheckCircle className="w-5 h-5 text-fl-success" />
            </div>
            <div>
              <p className="stats-card-label">Enriched</p>
              <p className="stats-card-value">
                {stats.enriched}
                {stats.total > 0 && (
                  <span className="text-sm text-fl-text-muted ml-2">
                    ({stats.enrichmentRate}%)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-fl-warning/20">
              <Clock className="w-5 h-5 text-fl-warning" />
            </div>
            <div>
              <p className="stats-card-label">Pending</p>
              <p className="stats-card-value">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stats.errors > 0 ? 'bg-fl-error/20' : 'bg-fl-bg-surface'}`}>
              <AlertCircle className={`w-5 h-5 ${stats.errors > 0 ? 'text-fl-error' : 'text-fl-text-muted'}`} />
            </div>
            <div>
              <p className="stats-card-label">Errors</p>
              <p className={`stats-card-value ${stats.errors > 0 ? 'text-fl-error' : ''}`}>
                {stats.errors}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-medium text-fl-text-primary mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push('/leads')}
            className="btn-primary"
          >
            View Leads
          </button>
          <button
            onClick={() => router.push('/import')}
            className="btn-secondary"
          >
            Import CSV
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="btn-secondary"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
