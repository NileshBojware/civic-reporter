import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'
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

            <footer className="w-full bg-slate-50 dark:bg-[#070a12] text-slate-600 dark:text-slate-400 py-16 mt-auto text-body-sm border-t border-slate-200/90 dark:border-slate-800">
              <div className="container mx-auto px-4 md:px-6 max-w-[1240px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 font-display text-title-md font-bold tracking-tight">
                      <img src="/logo.png" alt="SheherCare Logo" className="w-7 h-7 rounded-full object-cover border border-slate-200/90 dark:border-slate-800" />
                      <span className="shehercare-brand-shadow"><span className="text-[#00bf63]">Sheher</span><span className="text-[#177f95] dark:text-[#269eb8]">Care</span></span>
                    </div>
                    <p className="text-body-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                      Empowering local communities with clean, transparent, and direct civic reporting infrastructure.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-slate-900 dark:text-white text-title-sm font-semibold mb-4">Platform</h4>
                    <ul className="space-y-2">
                      <li><a href="/report" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">Report an Issue</a></li>
                      <li><a href="/reports" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">Browse Reports</a></li>
                      <li><a href="/reports?view=map" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">Interactive Map</a></li>
                      <li><a href="#" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">How It Works</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-slate-900 dark:text-white text-title-sm font-semibold mb-4">For Citizens</h4>
                    <ul className="space-y-2">
                      <li><a href="/my-reports" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">My Reports Dashboard</a></li>
                      <li><a href="/login" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">Sign In</a></li>
                      <li><a href="/signup" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">Create Account</a></li>
                      <li><a href="#" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">Ward Boundaries</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-slate-900 dark:text-white text-title-sm font-semibold mb-4">For Administrators</h4>
                    <ul className="space-y-2">
                      <li><a href="/admin" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">Admin Triage Board</a></li>
                      <li><a href="#" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">Department Portal</a></li>
                      <li><a href="#" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">SLA Benchmarks</a></li>
                      <li><a href="#" className="hover:text-[#177f95] dark:hover:text-[#269eb8] transition">Developer API</a></li>
                    </ul>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
                  <p className="text-caption text-slate-500 dark:text-slate-500">&copy; {new Date().getFullYear()} SheherCare Project. All rights reserved.</p>
                  <div className="flex items-center gap-6 font-medium text-caption">
                    <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">Terms</a>
                    <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">Privacy</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-slate-500 dark:text-slate-500">Municipal GovTech Initiative</span>
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
