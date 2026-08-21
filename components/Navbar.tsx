'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, LogOut, MapPin, User, Menu, X, PlusCircle, Globe, ChevronDown, Bell, Sun, Moon } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'
import { LANGUAGES } from '@/lib/translations'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)

  const { language, setLanguage, t } = useLanguage()
  const selectedLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light'
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

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

  // Notifications fetching
  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch(`/api/notifications?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.is_read).length)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    const userId = user?.id || profile?.id
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    fetchNotifications(userId)

    const interval = setInterval(() => {
      fetchNotifications(userId)
    }, 10000)

    return () => clearInterval(interval)
  }, [user, profile])

  const handleMarkAsRead = async (notifId: string) => {
    const userId = user?.id || profile?.id
    if (!userId) return

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, notification_id: notifId })
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.is_read).length)
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    const userId = user?.id || profile?.id
    if (!userId) return

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, mark_all_read: true })
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

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
    { href: '/reports', label: t('nav.allReports') },
    { href: '/report', label: t('nav.reportIssue'), icon: PlusCircle },
    { href: '/my-reports', label: t('nav.myReports'), citizenOnly: true },
    { href: '/admin', label: t('nav.adminDashboard'), adminOnly: true },
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

        {/* Right side container */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          {mounted ? (
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-all duration-200 focus:outline-none cursor-pointer hover:scale-105"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-purple-400 rotate-0 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-purple-400 rotate-0 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>
          ) : (
            <div className="w-8 h-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
          )}

          {/* Notifications Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex items-center justify-center p-2 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all focus:outline-none cursor-pointer"
                title={t('nav.notifications')}
              >
                <Bell className="w-4 h-4 text-purple-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationsOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-950 border border-zinc-800 p-3 shadow-2xl shadow-black/90 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-850 mb-2">
                      <span className="text-xs font-bold text-zinc-100">{t('nav.notifications')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-extrabold cursor-pointer"
                        >
                          {t('nav.markAllRead')}
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-zinc-500">
                          {t('nav.noNotifications')}
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const targetUrl = profile?.role === 'admin' 
                            ? `/admin/reports/${notif.report_id}`
                            : `/reports/${notif.report_id}`

                          return (
                            <Link
                              key={notif.id}
                              href={targetUrl}
                              onClick={() => {
                                handleMarkAsRead(notif.id)
                                setNotificationsOpen(false)
                              }}
                              className={`block p-2.5 rounded-xl border transition text-left ${
                                !notif.is_read
                                  ? 'bg-purple-600/5 border-purple-500/25 hover:bg-purple-600/10'
                                  : 'bg-transparent border-zinc-900 hover:bg-zinc-900/40 text-zinc-400'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-[11px] font-bold ${!notif.is_read ? 'text-purple-400' : 'text-zinc-400'}`}>
                                  {t(`notification.${notif.type}`)}
                                </span>
                                <span className="text-[9px] text-zinc-500 shrink-0">
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-300 line-clamp-2 mt-1 leading-relaxed">
                                {notif.message}
                              </p>
                            </Link>
                          )
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 text-xs font-semibold transition-all focus:outline-none cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>{selectedLang.nativeLabel}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {langDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setLangDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-zinc-950 border border-zinc-800 p-1.5 shadow-xl shadow-black/80 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setLangDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                        language === lang.code
                          ? 'bg-purple-600/10 text-purple-400 font-bold border border-purple-500/20'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                      }`}
                    >
                      <span>{lang.nativeLabel}</span>
                      <span className="text-[10px] text-zinc-500 font-normal">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

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
                  <span>{profile?.full_name || t('nav.citizen')}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4.5 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 border border-zinc-700/50 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logOut')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-100 transition-colors px-4 py-2"
                >
                  {t('nav.logIn')}
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4.5 py-2 rounded-2xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/35 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-200 md:hidden transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
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

          {/* Mobile Language Section */}
          <div className="pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold px-2 mb-3">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Choose Language</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition text-center border cursor-pointer ${
                    language === lang.code
                      ? 'bg-purple-600/10 text-purple-400 border-purple-500/20 shadow-sm'
                      : 'bg-zinc-900/30 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  {lang.nativeLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Theme Section */}
          {mounted && (
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold px-2 mb-3">
                {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-purple-400" /> : <Sun className="w-3.5 h-3.5 text-purple-400" />}
                <span>Choose Theme</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition text-center border cursor-pointer ${
                    theme === 'light'
                      ? 'bg-purple-600/10 text-purple-400 border-purple-500/20 shadow-sm'
                      : 'bg-zinc-900/30 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  Light Mode
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition text-center border cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-purple-600/10 text-purple-400 border-purple-500/20 shadow-sm'
                      : 'bg-zinc-900/30 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  Dark Mode
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-zinc-300 p-2 text-sm font-medium">
                  {profile?.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-purple-400" />
                  ) : (
                    <User className="w-4 h-4 text-zinc-400" />
                  )}
                  <span>{profile?.full_name || t('nav.citizen')}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logOut')}</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center p-2.5 text-sm font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 rounded-xl"
                >
                  {t('nav.logIn')}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center p-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-600/20"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
