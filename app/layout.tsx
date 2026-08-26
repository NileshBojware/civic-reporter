import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { PwaRegister } from '@/components/PwaRegister'
import { LanguageProvider } from '@/lib/LanguageContext'
import { ThemeProvider } from '@/lib/ThemeContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const display = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'SheherCare — Report & Track Municipal Issues',
  description: 'Report potholes, broken streetlights, water leaks, and drainage issues in your neighborhood. Track resolution in real time.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} h-full overflow-x-hidden`}>
      <head />
      <body className="min-h-full flex flex-col bg-canvas text-body font-sans bg-grid-pattern relative overflow-x-hidden">
        <LanguageProvider>
          <ThemeProvider>
            <div className="w-full min-h-full flex flex-col relative overflow-x-hidden">
            <PwaRegister />
            
            <Navbar />

            <main className="flex-grow flex flex-col w-full overflow-x-hidden">{children}</main>

            <footer className="w-full bg-surface-dark text-on-dark-soft py-16 mt-auto text-body-sm">
              <div className="container mx-auto px-4 md:px-6 max-w-[1200px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-on-dark font-display text-title-md font-bold">
                      <span className="w-6 h-6 rounded-md bg-canvas text-surface-dark flex items-center justify-center font-extrabold">S</span>
                      SheherCare
                    </div>
                    <p className="text-body-sm text-on-dark-soft max-w-xs leading-relaxed">
                      Empowering local communities with clean, transparent, and direct civic reporting infrastructure.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-on-dark text-title-sm font-semibold mb-4">Platform</h4>
                    <ul className="space-y-2">
                      <li><a href="/report" className="hover:text-on-dark transition">Report an Issue</a></li>
                      <li><a href="/reports" className="hover:text-on-dark transition">Browse Reports</a></li>
                      <li><a href="/reports?view=map" className="hover:text-on-dark transition">Interactive Map</a></li>
                      <li><a href="#" className="hover:text-on-dark transition">How It Works</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-on-dark text-title-sm font-semibold mb-4">For Citizens</h4>
                    <ul className="space-y-2">
                      <li><a href="/my-reports" className="hover:text-on-dark transition">My Reports Dashboard</a></li>
                      <li><a href="/login" className="hover:text-on-dark transition">Sign In</a></li>
                      <li><a href="/signup" className="hover:text-on-dark transition">Create Account</a></li>
                      <li><a href="#" className="hover:text-on-dark transition">Ward Boundaries</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-on-dark text-title-sm font-semibold mb-4">For Administrators</h4>
                    <ul className="space-y-2">
                      <li><a href="/admin" className="hover:text-on-dark transition">Admin Triage Board</a></li>
                      <li><a href="#" className="hover:text-on-dark transition">Department Portal</a></li>
                      <li><a href="#" className="hover:text-on-dark transition">SLA Benchmarks</a></li>
                      <li><a href="#" className="hover:text-on-dark transition">Developer API</a></li>
                    </ul>
                  </div>
                </div>

                <div className="pt-8 border-t border-surface-dark-elevated flex flex-col md:flex-row items-center justify-between gap-4 text-on-dark-soft">
                  <p className="text-caption text-muted-soft">&copy; {new Date().getFullYear()} SheherCare Project. All rights reserved.</p>
                  <div className="flex items-center gap-6 font-medium text-caption">
                    <a href="#" className="hover:text-on-dark transition">Terms</a>
                    <a href="#" className="hover:text-on-dark transition">Privacy</a>
                    <span className="text-surface-dark-elevated">|</span>
                    <span className="text-muted-soft">Municipal GovTech Initiative</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
