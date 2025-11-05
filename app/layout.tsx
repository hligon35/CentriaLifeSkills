import './globals.css'
import { ReactNode } from 'react'
import Header from '@/components/Header'
import TourProvider from '@/components/tour/TourProvider'
import { headers } from 'next/headers'
// Use the provided BuddyBoard icon for app icons (favicon, etc.)
// Next supports importing static images and using them in metadata icons
// The file resides at project root: BuddyBoardicon.png
// We import from here so Next bundles/serves it correctly.
import BuddyIcon from '../BuddyBoardicon.png'

export const metadata = {
  title: 'BuddyBoard', // Insert school name
  description: 'Secure communication platform for ABA Therapy school',
  icons: {
    icon: [
      { url: (BuddyIcon as any).src || (BuddyIcon as unknown as string), type: 'image/png', sizes: 'any' }
    ],
    apple: [
      { url: (BuddyIcon as any).src || (BuddyIcon as unknown as string), sizes: '180x180' }
    ]
  }
} satisfies any

export default function RootLayout({ children }: { children: ReactNode }) {
  // Show the desktop header uniformly across all sections (admin/parent/therapist)
  // Role-gated section layouts remain in their respective layout files.
  const h = headers()
  const path = h.get('x-invoke-path') || ''
  const isLogin = path.startsWith('/login')
  const hideHeader = isLogin
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {!isLogin && (
          <link
            rel="preload"
            as="fetch"
            href="/api/session/context"
            crossOrigin="anonymous"
          />
        )}
      </head>
  <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white px-3 py-2 rounded border shadow">Skip to content</a>
        <TourProvider>
          {!hideHeader && <Header />}
          <main id="main" className={`flex-1 ${isLogin ? 'pb-0' : 'pb-10'}`}>{children}</main>
        </TourProvider>
        {!isLogin && (
          <footer className={`mt-4 py-6 text-center text-xs text-gray-500`}>
            {/* Insert privacy policy link here for GDPR/FERPA */}
            © {new Date().getFullYear()} BuddyBoard
          </footer>
        )}
      </body>
    </html>
  )
}
