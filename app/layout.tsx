import './globals.css'
import { ReactNode } from 'react'
import Header from '@/components/Header'

export const metadata = {
  title: 'BuddyBoard', // Insert school name
  description: 'Secure communication platform for ABA Therapy school'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
  <div className="pt-2 pb-20 sm:pb-0">{children}</div>
        <footer className="mt-10 py-6 text-center text-xs text-gray-500">
          {/* Insert privacy policy link here for GDPR/FERPA */}
          © {new Date().getFullYear()} BuddyBoard
        </footer>
      </body>
    </html>
  )
}
