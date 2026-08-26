'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, LogOut, MapPin, User, Menu, X, PlusCircle, Globe, ChevronDown, Bell } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'
import { LANGUAGES } from '@/lib/translations'
import { ThemeToggle } from '@/components/ThemeToggle'

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
  const [queueCount, setQueueCount] = useState(0)

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

    // Listen for SW queue count messages (offline queued reports badge)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'QUEUE_COUNT') {
        setQueueCount(event.data.count ?? 0)
      }
      if (event.data?.type === 'SYNC_COMPLETE') {
        setQueueCount(0)
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleSwMessage)
    // Request current count on mount
    navigator.serviceWorker?.controller?.postMessage({ type: 'GET_QUEUE_COUNT' })

    window.addEventListener('storage', handleStorageChange)
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
        navigator.serviceWorker?.removeEventListener('message', handleSwMessage)
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleStorageChange)
      navigator.serviceWorker?.removeEventListener('message', handleSwMessage)
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
      Promise.resolve().then(() => {
        setNotifications((prev) => (prev.length > 0 ? [] : prev))
        setUnreadCount((prev) => (prev > 0 ? 0 : prev))
      })
      return
    }

    Promise.resolve().then(() => {
      fetchNotifications(userId)
    })

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

  // Get user avatar initials
  const getInitials = () => {
    const name = profile?.full_name || 'New Citizen'
    return name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-canvas/90 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between max-w-[1200px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary font-bold transition-transform duration-300">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="font-display text-title-md font-extrabold text-ink tracking-tight">
            Sheher<span className="text-brand-accent">Care</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href
            const isReportLink = link.href === '/report'
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-nav-link font-medium transition-colors duration-200 flex items-center gap-1.5 relative ${
                  isActive ? 'text-primary font-semibold underline underline-offset-4' : 'text-muted hover:text-ink'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4 text-brand-accent" />}
                <span>{link.label}</span>
                {/* Queued-report sync badge — only on Report Issue link */}
                {isReportLink && queueCount > 0 && (
                  <span
                    title={`${queueCount} report${queueCount !== 1 ? 's' : ''} queued offline`}
                    className="absolute -top-1.5 -right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-warning text-canvas text-[9px] font-bold px-1 leading-none"
                  >
                    {queueCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right side container */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex items-center justify-center p-2 rounded-full hover:bg-surface-soft text-muted hover:text-ink border border-hairline transition-all focus:outline-none cursor-pointer"
                title={t('nav.notifications')}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationsOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 rounded-lg bg-canvas border border-hairline p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-hairline mb-2">
                      <span className="text-title-sm font-bold text-ink">{t('nav.notifications')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-brand-accent hover:underline font-bold cursor-pointer"
                        >
                          {t('nav.markAllRead')}
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1.5">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-body-sm text-muted">
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
                              className={`block p-2.5 rounded-md border transition text-left ${
                                !notif.is_read
                                  ? 'bg-brand-accent/5 border-brand-accent/25 hover:bg-brand-accent/10'
                                  : 'bg-transparent border-hairline-soft hover:bg-surface-soft text-body'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-[11px] font-bold ${!notif.is_read ? 'text-brand-accent' : 'text-muted'}`}>
                                  {t(`notification.${notif.type}`)}
                                </span>
                                <span className="text-[9px] text-muted shrink-0">
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-body line-clamp-2 mt-1 leading-relaxed">
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

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-canvas border border-hairline text-body hover:text-ink text-body-sm font-semibold transition-all focus:outline-none cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-muted" />
              <span>{selectedLang.nativeLabel}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {langDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setLangDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-40 rounded-lg bg-canvas border border-hairline p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setLangDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-body-sm font-medium transition flex items-center justify-between cursor-pointer ${
                        language === lang.code
                          ? 'bg-brand-accent/10 text-brand-accent font-bold border border-brand-accent/20'
                          : 'text-body hover:text-ink hover:bg-surface-soft'
                      }`}
                    >
                      <span>{lang.nativeLabel}</span>
                      <span className="text-[10px] text-muted font-normal">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Desktop Auth and User Info */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                {/* User identity pill — non-interactive, purely informational */}
                <div className="flex items-center gap-2 text-ink bg-surface-soft border border-hairline px-3 py-1.5 rounded-md text-body-sm font-medium">
                  {profile?.role === 'admin' ? (
                    <Shield className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-muted shrink-0" />
                  )}
                  <span>{profile?.full_name || t('nav.citizen')}</span>
                </div>

                {/* Avatar circle showing initials */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-strong border border-hairline text-ink font-bold text-xs select-none shrink-0">
                  {getInitials()}
                </div>

                {/* Explicit logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-canvas hover:bg-surface-soft border border-hairline text-body-sm font-semibold text-muted hover:text-ink transition cursor-pointer h-9"
                  title={t('nav.logOut')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logOut')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-body-sm font-semibold text-muted hover:text-ink transition-colors px-3 py-2"
                >
                  {t('nav.logIn')}
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary flex items-center"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-muted hover:text-ink md:hidden transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-hairline bg-canvas p-4 space-y-4 animate-in fade-in duration-200">
          <nav className="flex flex-col gap-3">
            {filteredLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-body-sm font-semibold p-2.5 rounded-md flex items-center gap-2 ${
                    isActive ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' : 'text-body hover:text-ink hover:bg-surface-soft'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4 text-brand-accent" />}
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Mobile Language Section */}
          <div className="pt-4 border-t border-hairline">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2 text-muted text-caption font-semibold">
                <Globe className="w-3.5 h-3.5 text-brand-accent" />
                <span>Choose Language</span>
              </div>
              <ThemeToggle />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-2 rounded-md text-caption font-semibold transition text-center border cursor-pointer ${
                    language === lang.code
                      ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20 shadow-sm'
                      : 'bg-canvas text-body border-hairline hover:text-ink hover:bg-surface-soft'
                  }`}
                >
                  {lang.nativeLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-hairline flex flex-col gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-ink p-2 text-body-sm font-medium">
                  {profile?.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-brand-accent" />
                  ) : (
                    <User className="w-4 h-4 text-muted" />
                  )}
                  <span>{profile?.full_name || t('nav.citizen')}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-md bg-canvas hover:bg-surface-soft text-body border border-hairline text-body-sm font-semibold transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-muted" />
                  <span>{t('nav.logOut')}</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center p-2.5 text-body-sm font-bold text-muted hover:text-ink hover:bg-surface-soft rounded-md"
                >
                  {t('nav.logIn')}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center p-2.5 text-body-sm font-bold text-on-primary bg-primary hover:bg-primary-active rounded-md"
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
