import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { AppHeader } from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'LeadGen - Funnelists',
  description: 'Lead generation and enrichment tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
