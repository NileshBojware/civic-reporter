'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, LogOut, MapPin, User, Menu, X, PlusCircle } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Listen to auth changes
  useEffect(() => {
    const fetchUser = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession()
        setUser(data.session?.user || null)
        if (data.session?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .maybeSingle()
          setProfile(prof)
        }
      } else {
        // Mock mode auth read
        const mockUserStr = localStorage.getItem('civic_reporter_user')
        if (mockUserStr) {
          const mockUser = JSON.parse(mockUserStr)
          setUser(mockUser)
          setProfile(mockUser)
        }
      }
    }

    fetchUser()

    // Add storage listener for mock mode changes across tabs
    const handleStorageChange = () => {
      const mockUserStr = localStorage.getItem('civic_reporter_user')
      if (mockUserStr) {
        const mockUser = JSON.parse(mockUserStr)
        setUser(mockUser)
        setProfile(mockUser)
      } else {
        setUser(null)
        setProfile(null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    // Custom event dispatch for local auth state changes in the same window
    window.addEventListener('auth-change', handleStorageChange)

    if (isSupabaseConfigured && supabase) {
      const client = supabase
      const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          const { data: prof } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          setProfile(prof)
        } else {
          setProfile(null)
        }
      })
      return () => {
        subscription.unsubscribe()
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('auth-change', handleStorageChange)
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleStorageChange)
    }
  }, [])

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem('civic_reporter_user')
      window.dispatchEvent(new Event('auth-change'))
    }
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/reports', label: 'All Reports' },
    { href: '/report', label: 'Report Issue', icon: PlusCircle },
    { href: '/my-reports', label: 'My Reports', citizenOnly: true },
    { href: '/admin', label: 'Admin Dashboard', adminOnly: true },
  ]

  const filteredLinks = navLinks.filter((link) => {
    if (link.adminOnly && profile?.role !== 'admin') return false
    if (link.citizenOnly && !user) return false
    return true
  })

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Civic<span className="text-purple-400">Reporter</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 ${
                  isActive ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Desktop Auth and User Info */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/60 border border-zinc-800 px-3.5 py-1.5 rounded-2xl text-xs font-semibold">
                {profile?.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{profile?.full_name || 'Citizen'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/50 text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-bold text-zinc-400 hover:text-zinc-100 transition-colors px-4 py-2"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4.5 py-2 rounded-2xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/35 hover:-translate-y-0.5 transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -mr-2 text-zinc-400 hover:text-zinc-200 md:hidden transition"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 p-4 space-y-4 animate-in fade-in duration-200">
          <nav className="flex flex-col gap-3">
            {filteredLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-semibold p-2.5 rounded-xl flex items-center gap-2 ${
                    isActive ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-zinc-300 p-2 text-sm font-medium">
                  {profile?.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-purple-400" />
                  ) : (
                    <User className="w-4 h-4 text-zinc-400" />
                  )}
                  <span>{profile?.full_name || 'Citizen'}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center p-2.5 text-sm font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center p-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-600/20"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
