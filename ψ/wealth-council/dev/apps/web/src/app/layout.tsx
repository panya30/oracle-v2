import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { MobileNav } from '@/components/MobileNav'
import { ExplainPopup } from '@/components/ExplainPopup'

export const metadata: Metadata = {
  title: 'Panya Wealth Council',
  description: 'AI-Powered Investment Intelligence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        {/* Mobile Navigation */}
        <MobileNav />

        <div className="flex h-screen overflow-hidden">
          {/* Sidebar - Hidden on mobile */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header - Hidden on mobile */}
            <Header />

            {/* Page Content - Extra top padding on mobile for fixed header */}
            <main className="flex-1 overflow-auto p-4 lg:p-6 pt-[72px] lg:pt-6 bg-palantir-bg">
              <div className="max-w-[1800px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* Global Explain Popup */}
        <ExplainPopup />
      </body>
    </html>
  )
}
