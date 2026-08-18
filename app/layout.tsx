import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { PwaRegister } from '@/components/PwaRegister'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'CivicReporter — Report & Track Municipal Issues',
  description: 'Report potholes, broken streetlights, water leaks, and drainage issues in your neighborhood. Track resolution in real time.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 bg-grid-pattern relative">
        <PwaRegister />
        {/* Subtle glow background */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none z-[-1]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none z-[-1]" />

        <Navbar />
        
        <main className="flex-grow flex flex-col">{children}</main>

        <footer className="w-full border-t border-zinc-900 bg-zinc-950/80 backdrop-blur py-8 mt-auto text-zinc-500 text-xs">
          <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} CivicReporter Project. All rights reserved.</p>
            <div className="flex items-center gap-4 font-semibold text-zinc-400">
              <a href="#" className="hover:text-zinc-200 transition">Terms</a>
              <a href="#" className="hover:text-zinc-200 transition">Privacy</a>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-500 font-medium">Free Tier Viva Build</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
