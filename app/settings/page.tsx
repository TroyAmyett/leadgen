'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Key, Sparkles, Shield, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

type SettingsTab = 'general' | 'enrichment' | 'api-keys' | 'security'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthStore()

  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [defaultProvider, setDefaultProvider] = useState('local')
  const [autoEnrich, setAutoEnrich] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      // TODO: Save to Supabase
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSaveMessage('Settings saved successfully')
    } catch (error) {
      setSaveMessage('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fl-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'enrichment', label: 'Enrichment', icon: Sparkles },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-fl-text-primary">Settings</h1>
        <p className="text-fl-text-secondary mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-fl-primary/10 text-fl-primary'
                    : 'text-fl-text-secondary hover:text-fl-text-primary hover:bg-fl-bg-elevated'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="glass-card p-6">
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-medium text-fl-text-primary">
                    General Settings
                  </h2>
                  <p className="text-sm text-fl-text-secondary">
                    Basic account preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="input bg-fl-bg-surface cursor-not-allowed"
                    />
                    <p className="text-xs text-fl-text-muted mt-1">
                      Contact support to change your email
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'enrichment' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-medium text-fl-text-primary">
                    Enrichment Settings
                  </h2>
                  <p className="text-sm text-fl-text-secondary">
                    Configure how leads are enriched
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Default Provider</label>
                    <select
                      value={defaultProvider}
                      onChange={(e) => setDefaultProvider(e.target.value)}
                      className="input"
                    >
                      <option value="local">Local Scraper (Free)</option>
                      <option value="apify">Apify</option>
                      <option value="mock">Mock (Testing)</option>
                    </select>
                    <p className="text-xs text-fl-text-muted mt-1">
                      The default enrichment provider for new leads
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-fl-bg-surface">
                    <div>
                      <p className="font-medium text-fl-text-primary">
                        Auto-enrich on import
                      </p>
                      <p className="text-sm text-fl-text-muted">
                        Automatically enrich leads when importing CSV
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoEnrich(!autoEnrich)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoEnrich ? 'bg-fl-primary' : 'bg-fl-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoEnrich ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {saveMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      saveMessage.includes('Failed')
                        ? 'bg-fl-error/20 text-fl-error'
                        : 'bg-fl-success/20 text-fl-success'
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </motion.div>
            )}

            {activeTab === 'api-keys' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-medium text-fl-text-primary">
                    API Keys
                  </h2>
                  <p className="text-sm text-fl-text-secondary">
                    Manage your API keys for enrichment providers
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-fl-bg-surface text-center">
                  <Key size={32} className="mx-auto text-fl-text-muted mb-3" />
                  <p className="text-fl-text-secondary">
                    API key management coming soon
                  </p>
                  <p className="text-sm text-fl-text-muted mt-1">
                    You&apos;ll be able to add keys for Apify and other providers
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-medium text-fl-text-primary">
                    Security
                  </h2>
                  <p className="text-sm text-fl-text-secondary">
                    Manage your account security
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-fl-bg-surface">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-fl-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-fl-text-primary">
                          Change Password
                        </p>
                        <p className="text-sm text-fl-text-muted mt-1">
                          Use the &quot;Forgot Password&quot; option on the login page to reset your password
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
