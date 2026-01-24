'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Upload, Settings, Bot } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export type LeadGenTab = 'dashboard' | 'leads' | 'import' | 'settings'

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
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
]

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
    if (pathname === '/settings') return 'settings'
    return 'dashboard'
  }

  const activeTab = getActiveTab()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <aside
      style={{
        width: '256px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '16px',
      }}
    >
      {/* App Logo/Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', marginBottom: '24px' }}>
        <Users style={{ width: '24px', height: '24px', color: '#0ea5e9' }} />
        <span style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>LeadGen</span>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                border: isActive ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isActive ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                color: isActive ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Upsell to AgentPM */}
      <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <a
          href="https://agentpm.funnelists.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            textDecoration: 'none',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Bot style={{ width: '20px', height: '20px', color: '#0ea5e9' }} />
            <span style={{ fontWeight: 600, color: 'white' }}>Try AgentPM</span>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            AI planning, agentic project management and more.
          </p>
        </a>
      </div>
    </aside>
  )
}
