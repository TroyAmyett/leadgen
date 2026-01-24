'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Upload, Settings, Bot, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export type LeadGenTab = 'dashboard' | 'leads' | 'import' | 'settings'

interface SidebarItem {
  id: LeadGenTab
  label: string
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
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
  const [collapsed, setCollapsed] = useState(false)

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
        width: collapsed ? '64px' : '256px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: collapsed ? '16px 8px' : '16px',
        transition: 'width 0.2s ease, padding 0.2s ease',
      }}
    >
      {/* App Logo/Name + Collapse Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '8px 0' : '8px 12px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users style={{ width: '24px', height: '24px', color: '#0ea5e9', flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>LeadGen</span>}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              transition: 'color 0.2s',
            }}
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            transition: 'color 0.2s, background 0.2s',
            marginBottom: '8px',
          }}
          title="Expand sidebar"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* Navigation Items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: collapsed ? '10px 0' : '10px 12px',
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
              <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
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
          title={collapsed ? 'Try AgentPM' : undefined}
          style={{
            display: 'flex',
            flexDirection: collapsed ? 'column' : 'row',
            alignItems: collapsed ? 'center' : 'flex-start',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '12px 8px' : '16px',
            borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textDecoration: 'none',
            transition: 'border-color 0.2s ease',
          }}
        >
          {collapsed ? (
            <Bot style={{ width: '20px', height: '20px', color: '#0ea5e9' }} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Bot style={{ width: '20px', height: '20px', color: '#0ea5e9' }} />
                <span style={{ fontWeight: 600, color: 'white' }}>Try AgentPM</span>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                AI planning, agentic project management and more.
              </p>
            </>
          )}
        </a>
      </div>
    </aside>
  )
}
