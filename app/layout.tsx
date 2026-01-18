import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { AppHeader } from '@/components/AppHeader'
import { LeadGenSidebar } from '@/components/LeadGenSidebar'

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
            <div className="flex-1 flex">
              <LeadGenSidebar />
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
