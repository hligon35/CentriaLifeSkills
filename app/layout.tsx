import './globals.css'
import { ReactNode } from 'react'
import Header from '@/components/Header'
import { headers } from 'next/headers'

export const metadata = {
  title: 'BuddyBoard', // Insert school name
  description: 'Secure communication platform for ABA Therapy school'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  // Show the desktop header uniformly across all sections (admin/parent/therapist)
  // Role-gated section layouts remain in their respective layout files.
  const h = headers()
  const path = h.get('x-invoke-path') || ''
  const hideHeader = false
  const isLogin = path.startsWith('/login')
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="fetch"
          href="/api/session/context"
          crossOrigin="anonymous"
        />
      </head>
  <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white px-3 py-2 rounded border shadow">Skip to content</a>
        {!hideHeader && <Header />}
        <main id="main" className={`flex-1 ${isLogin ? 'pb-6' : 'pb-10'}`}>{children}</main>
        <footer className={`${isLogin ? 'mt-2' : 'mt-4'} py-6 text-center text-xs text-gray-500`}>
          {/* Insert privacy policy link here for GDPR/FERPA */}
          © {new Date().getFullYear()} BuddyBoard
        </footer>
      </body>
    </html>
  )
}
