'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Upload, Database, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export type LeadGenTab = 'dashboard' | 'leads' | 'import' | 'enrichment' | 'settings'

interface SidebarItem {
  id: LeadGenTab
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  href: string
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'leads', label: 'Leads', icon: Users, href: '/leads' },
  { id: 'import', label: 'Import', icon: Upload, href: '/import' },
  { id: 'enrichment', label: 'Enrichment', icon: Database, href: '/enrichment' },
]

const settingsItem: SidebarItem = { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' }

export function LeadGenSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuthStore()

  // Don't show sidebar on auth page or when not logged in
  if (pathname === '/auth' || (!loading && !user)) {
    return null
  }

  const getActiveTab = (): LeadGenTab => {
    if (pathname === '/') return 'dashboard'
    if (pathname.startsWith('/leads')) return 'leads'
    if (pathname === '/import') return 'import'
    if (pathname === '/enrichment') return 'enrichment'
    if (pathname === '/settings') return 'settings'
    return 'dashboard'
  }

  const activeTab = getActiveTab()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="w-60 flex-shrink-0 flex flex-col h-full border-r border-fl-border bg-fl-bg-elevated">
      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-fl-primary text-white'
                    : 'text-fl-text-secondary hover:text-fl-text-primary hover:bg-fl-bg-surface'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Separator */}
        <div className="my-4 border-t border-fl-border" />

        {/* Settings */}
        <button
          onClick={() => handleNavigation(settingsItem.href)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === settingsItem.id
              ? 'bg-fl-primary text-white'
              : 'text-fl-text-secondary hover:text-fl-text-primary hover:bg-fl-bg-surface'
          }`}
        >
          <settingsItem.icon className="w-5 h-5" />
          <span>{settingsItem.label}</span>
        </button>
      </nav>
    </div>
  )
}
