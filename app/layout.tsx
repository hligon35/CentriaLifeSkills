import './globals.css'
import { ReactNode } from 'react'
import Header from '@/components/Header'
import { headers } from 'next/headers'

export const metadata = {
  title: 'BuddyBoard', // Insert school name
  description: 'Secure communication platform for ABA Therapy school'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const h = headers()
  const path = h.get('x-invoke-path') || ''
  const hideHeader = path.startsWith('/therapist') || path.startsWith('/parent')
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
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white px-3 py-2 rounded border shadow">Skip to content</a>
        {!hideHeader && <Header />}
        <main id="main" className={`pb-20 ${hideHeader ? '' : 'md:pt-14'}`}>{children}</main>
        <footer className="mt-10 py-6 text-center text-xs text-gray-500">
          {/* Insert privacy policy link here for GDPR/FERPA */}
          © {new Date().getFullYear()} BuddyBoard
        </footer>
      </body>
    </html>
  )
}
