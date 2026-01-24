'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, signOut } = useAuthStore()

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const toggleMenu = () => {
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
    setMenuOpen(!menuOpen)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Update position on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (menuOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setMenuPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        })
      }
    }

    if (menuOpen) {
      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)
    }

    return () => {
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [menuOpen])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    router.push('/auth')
  }

  // Don't show header on auth page or when not logged in
  if (pathname === '/auth' || (!loading && !user)) {
    return null
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-end h-14 px-4"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Right: User Menu */}
      {user && (
        <div className="flex-shrink-0">
          <button
            ref={buttonRef}
            onClick={toggleMenu}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(14, 165, 233, 0.2)' }}
          >
            <User className="w-5 h-5" style={{ color: '#0ea5e9' }} />
          </button>

          {menuOpen && typeof document !== 'undefined' && createPortal(
            <div
              ref={menuRef}
              className="fixed w-48 py-2 rounded-lg shadow-2xl"
              style={{
                top: menuPosition.top,
                right: menuPosition.right,
                zIndex: 99999,
                background: '#111118',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {user.email && (
                <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <p className="text-sm truncate" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{user.email}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>,
            document.body
          )}
        </div>
      )}
    </header>
  )
}

