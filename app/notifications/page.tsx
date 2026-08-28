'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, BellOff, CheckCheck, RefreshCw, ArrowRight,
  AlertCircle, CheckCircle2, Loader2, BellRing,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { usePushNotifications } from '@/lib/usePushNotifications'
import { useLanguage } from '@/lib/LanguageContext'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  status_change: {
    label: 'Status Update',
    color: 'text-brand-accent',
    icon: <RefreshCw className="w-4 h-4" />,
  },
  new_report: {
    label: 'New Report',
    color: 'text-status-reported',
    icon: <AlertCircle className="w-4 h-4" />,
  },
}

export default function NotificationsPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const userId = user?.id || profile?.id
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } =
    usePushNotifications(userId ?? null)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession()
        const sessionUser = data.session?.user ?? null
        if (!sessionUser) { router.replace('/login'); return }
        setUser(sessionUser)
        const { data: prof } = await supabase
          .from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()
        setProfile(prof)
      } else {
        const raw = localStorage.getItem('civic_reporter_user')
        if (!raw) { router.replace('/login'); return }
        const mock = JSON.parse(raw)
        setUser(mock)
        setProfile(mock)
      }
    }
    init()
  }, [router])

  // ── Fetch notifications ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    fetchNotifications()
    // Supabase Realtime subscription
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => {
            setNotifications((prev) => [payload.new as any, ...prev])
          }
        )
        .subscribe()
      return () => { supabase!.removeChannel(channel) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchNotifications = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?user_id=${userId}`)
      if (res.ok) setNotifications(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (notifId: string) => {
    if (!userId) return
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, notification_id: notifId }),
    })
    if (res.ok) setNotifications(await res.json())
  }

  const markAllRead = async () => {
    if (!userId) return
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, mark_all_read: true }),
      })
      if (res.ok) setNotifications(await res.json())
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const isAdmin = profile?.role === 'admin'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-display-sm font-bold text-ink flex items-center gap-2">
              <Bell className="w-6 h-6 text-brand-accent" />
              Notifications
            </h1>
            <p className="text-body-sm text-muted mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="btn-secondary h-9 px-4 text-caption flex items-center gap-1.5"
            >
              {markingAll
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCheck className="w-3.5 h-3.5" />}
              Mark all read
            </button>
          )}
        </div>

        {/* Push notification opt-in card */}
        {'Notification' in (typeof window !== 'undefined' ? window : {}) && (
          <div className="p-4 rounded-lg border border-hairline bg-surface-card flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-brand-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-ink">
                {isSubscribed ? 'Push notifications are enabled' : 'Enable push notifications'}
              </p>
              <p className="text-caption text-muted mt-0.5 leading-relaxed">
                {isSubscribed
                  ? 'You\'ll receive alerts even when the browser is closed.'
                  : 'Get notified about your report status updates even when the app is closed.'}
              </p>
              {permission === 'denied' && (
                <p className="text-caption text-error mt-1 font-semibold">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              )}
            </div>
            {permission !== 'denied' && (
              <button
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={pushLoading}
                className={`shrink-0 h-9 px-4 text-caption rounded-md font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  isSubscribed
                    ? 'bg-canvas border-hairline text-muted hover:text-error hover:border-error/30'
                    : 'btn-primary'
                }`}
              >
                {pushLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isSubscribed ? (
                  <><BellOff className="w-3.5 h-3.5" /> Disable</>
                ) : (
                  <><Bell className="w-3.5 h-3.5" /> Enable</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Notification list */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center">
                <Bell className="w-7 h-7 text-muted" />
              </div>
              <p className="text-body-sm text-muted text-center">
                No notifications yet.<br />
                We'll let you know when your report status changes.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const meta = TYPE_META[notif.type] ?? TYPE_META.status_change
              const targetUrl = isAdmin
                ? `/admin/reports/${notif.report_id}`
                : `/reports/${notif.report_id}`

              return (
                <div
                  key={notif.id}
                  className={`relative rounded-lg border transition ${
                    !notif.is_read
                      ? 'bg-brand-accent/5 border-brand-accent/20'
                      : 'bg-canvas border-hairline'
                  }`}
                >
                  {/* Unread dot */}
                  {!notif.is_read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-accent" />
                  )}

                  <div className="p-4 flex gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 mt-0.5 ${meta.color}`}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-caption font-bold ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-muted">{timeAgo(notif.created_at)}</span>
                      </div>
                      <p className="text-body-sm text-body leading-relaxed">{notif.message}</p>

                      {/* Actions row */}
                      <div className="flex items-center gap-4 mt-3">
                        <Link
                          href={targetUrl}
                          onClick={() => markRead(notif.id)}
                          className="text-caption font-semibold text-brand-accent hover:underline flex items-center gap-1"
                        >
                          View report <ArrowRight className="w-3 h-3" />
                        </Link>
                        {!notif.is_read && (
                          <button
                            onClick={() => markRead(notif.id)}
                            className="text-caption text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
