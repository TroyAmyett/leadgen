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
    <html lang="en" className="dark">
      <body className="antialiased bg-fl-bg-base text-fl-text-primary min-h-screen">
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-fl-bg-base">
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
