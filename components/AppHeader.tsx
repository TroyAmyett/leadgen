'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Users,
  Bot,
  StickyNote,
  Palette,
  Settings,
  LogOut,
  User,
  Radio,
} from 'lucide-react'

// Helper to get app URLs based on environment
function getAppUrl(app: string): string {
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  const devPorts: Record<string, number> = {
    agentpm: 3000,
    radar: 3001,
    notetaker: 3000,
    canvas: 3003,
    leadgen: 3004,
  }

  const prodDomains: Record<string, string> = {
    agentpm: 'agentpm.funnelists.com',
    radar: 'radar.funnelists.com',
    notetaker: 'notetaker.funnelists.com',
    canvas: 'canvas.funnelists.com',
    leadgen: 'leadgen.funnelists.com',
  }

  if (isDev) {
    return `http://localhost:${devPorts[app] || 3000}`
  }

  return `https://${prodDomains[app] || 'funnelists.com'}`
}
import { useAuthStore } from '@/stores/authStore'

interface Tool {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  href?: string
  comingSoon?: boolean
}

const tools: Tool[] = [
  {
    id: 'agentpm',
    name: 'AgentPM',
    icon: <Bot size={18} />,
    description: 'AI project management',
    href: getAppUrl('agentpm'),
  },
  {
    id: 'radar',
    name: 'Radar',
    icon: <Radio size={18} />,
    description: 'Intelligence feed',
    href: getAppUrl('radar'),
  },
  {
    id: 'notetaker',
    name: 'NoteTaker',
    icon: <StickyNote size={18} />,
    description: 'Brainstorming & ideation',
    href: getAppUrl('notetaker'),
  },
  {
    id: 'canvas',
    name: 'Canvas',
    icon: <Palette size={18} />,
    description: 'AI design & visuals',
    href: getAppUrl('canvas'),
    comingSoon: true,
  },
  {
    id: 'leadgen',
    name: 'LeadGen',
    icon: <Users size={18} />,
    description: 'Lead generation & enrichment',
  },
]

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()

  const [toolsOpen, setToolsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const toolsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentTool = tools.find((t) => t.id === 'leadgen')

  const handleToolSelect = (tool: Tool) => {
    if (tool.comingSoon) return
    if (tool.href) {
      window.location.href = tool.href
    }
    setToolsOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  // Don't show header on auth page
  if (pathname === '/auth') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 border-b border-fl-border bg-fl-bg-base/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Tool Switcher */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <button
              onClick={() => router.push('/')}
              className="text-lg font-semibold text-fl-text-primary hover:text-fl-primary transition-colors"
            >
              Funnelists
            </button>

            {/* Tool Switcher */}
            <div className="relative" ref={toolsRef}>
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fl-bg-elevated border border-fl-border hover:border-fl-border-strong transition-colors"
              >
                {currentTool?.icon}
                <span className="text-sm font-medium text-fl-text-primary">
                  {currentTool?.name}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-fl-text-muted transition-transform ${
                    toolsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {toolsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-64 py-2 rounded-xl bg-fl-bg-elevated border border-fl-border shadow-xl"
                  >
                    {tools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool)}
                        disabled={tool.comingSoon}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          tool.id === 'leadgen'
                            ? 'bg-fl-primary/10 text-fl-primary'
                            : tool.comingSoon
                            ? 'text-fl-text-muted cursor-not-allowed'
                            : 'text-fl-text-primary hover:bg-fl-bg-surface'
                        }`}
                      >
                        <span className={tool.id === 'leadgen' ? 'text-fl-primary' : ''}>
                          {tool.icon}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{tool.name}</span>
                            {tool.comingSoon && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-fl-bg-surface text-fl-text-muted">
                                Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-fl-text-muted">{tool.description}</p>
                        </div>
                      </button>
                    ))}

                    <div className="border-t border-fl-border mt-2 pt-2">
                      <button
                        onClick={() => {
                          router.push('/settings')
                          setToolsOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-fl-text-secondary hover:bg-fl-bg-surface transition-colors"
                      >
                        <Settings size={18} />
                        <span className="text-sm">Settings</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            {/* User Menu */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-fl-bg-elevated transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-fl-primary/20 flex items-center justify-center">
                    <User size={16} className="text-fl-primary" />
                  </div>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-56 py-2 rounded-xl bg-fl-bg-elevated border border-fl-border shadow-xl"
                    >
                      <div className="px-4 py-2 border-b border-fl-border">
                        <p className="text-sm font-medium text-fl-text-primary truncate">
                          {user.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          router.push('/settings')
                          setUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-fl-text-secondary hover:bg-fl-bg-surface transition-colors"
                      >
                        <Settings size={16} />
                        <span className="text-sm">Settings</span>
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-fl-error hover:bg-fl-error/10 transition-colors"
                      >
                        <LogOut size={16} />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

