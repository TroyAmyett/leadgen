'use client'

import { Globe } from 'lucide-react'

export function Footer() {
  return (
    <footer
      style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '14px',
        }}
      >
        {/* Left: Funnelists branding */}
        <a
          href="https://funnelists.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
        >
          Funnelists
        </a>

        {/* Right: Built with Claude Code + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.5)' }}>
            <Globe style={{ width: '16px', height: '16px', color: '#34d399' }} />
            <span>Built with Claude Code</span>
          </div>

          <a
            href="https://calendly.com/funnelists"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(14, 165, 233, 0.2)',
              color: '#0ea5e9',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
          >
            Build your AI app
          </a>
        </div>
      </div>
    </footer>
  )
}
