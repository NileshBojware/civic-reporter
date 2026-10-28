'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { PlusCircle, Info, Calendar, MapPin, ArrowRight, Clipboard, CloudOff, RefreshCw, AlertCircle } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { StatusBadge, SyncStatusBadge } from '@/components/StatusBadge'
import { useLanguage } from '@/lib/LanguageContext'
import { getCategoryStyles } from '@/lib/categories'
import { getLocalizedReport } from '@/lib/contentTranslator'
import { getOfflineReports, syncOfflineReport, OfflineReport } from '@/lib/offlineStorage'

export default function MyReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [offlineReports, setOfflineReports] = useState<OfflineReport[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const { t, language } = useLanguage()

  const loadData = useCallback(async (currentUser: any) => {
    if (!currentUser) return

    // 1. Load offline reports from IndexedDB
    try {
      const local = await getOfflineReports(currentUser.id)
      setOfflineReports(local)
    } catch (e) {
      console.warn('Failed to load local offline reports:', e)
    }

    // 2. Fetch server reports
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const allReports = await res.json()
        const myReports = allReports.filter((r: any) => r.user_id === currentUser.id)
        setReports(myReports)
      }
    } catch (err) {
      console.warn('Could not fetch server reports (possibly offline):', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      const on = () => setIsOnline(true)
      const off = () => setIsOnline(false)
      window.addEventListener('online', on)
      window.addEventListener('offline', off)
      return () => {
        window.removeEventListener('online', on)
        window.removeEventListener('offline', off)
      }
    }
  }, [])

  useEffect(() => {
    const fetchMyReports = async () => {
      let currentUser: any = null

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession()
          currentUser = data.session?.user || null
        } catch {
          // offline fallback
        }
      } else {
        const mockUser = localStorage.getItem('civic_reporter_user')
        if (mockUser) {
          currentUser = JSON.parse(mockUser)
        }
      }

      setUser(currentUser)

      if (!currentUser) {
        setLoading(false)
        return
      }

      await loadData(currentUser)
    }

    fetchMyReports()

    // Listen to sync changes to refresh list in real-time
    const handleSyncChange = () => {
      if (user) {
        loadData(user)
      }
    }

    window.addEventListener('shehercare:sync_status_changed', handleSyncChange)
    return () => {
      window.removeEventListener('shehercare:sync_status_changed', handleSyncChange)
    }
  }, [loadData, user])

  // Retry sync for an individual offline report
  const handleRetrySync = async (report: OfflineReport) => {
    if (!navigator.onLine) {
      alert('You are currently offline. Please reconnect to the internet to sync reports.')
      return
    }

    setSyncingId(report.id)
    try {
      const res = await syncOfflineReport(report)
      if (res.success) {
        if (user) await loadData(user)
      } else {
        alert(res.error || 'Failed to sync report. Please try again.')
        if (user) await loadData(user)
      }
    } catch (err: any) {
      alert(err?.message || 'Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-16 bg-canvas">
        <div className="w-full max-w-md p-8 rounded-lg border border-hairline bg-canvas text-center shadow-md">
          <Info className="w-12 h-12 text-brand-accent mx-auto mb-4" />
          <h2 className="text-title-lg font-bold text-ink mb-2">Sign In Required</h2>
          <p className="text-body-sm text-body mb-6 leading-relaxed">
            Please log in to view your logged civic issue reports.
          </p>
          <Link
            href="/login"
            className="btn-primary w-full flex items-center justify-center"
          >
            Log In
          </Link>
        </div>
      </div>
    )
  }

  // Filter offline reports that are pending, syncing, or failed
  // (or synced reports that are not yet in the remote reports list)
  const pendingOffline = offlineReports.filter((off) => {
    if (off.sync_status !== 'synced') return true
    // If synced, only show if not already present in server reports list
    return !reports.some((r) => r.id === off.supabase_id)
  })

  const hasAnyReports = reports.length > 0 || pendingOffline.length > 0

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16 bg-canvas text-body">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-display-md text-ink mb-1">{t('myreports.title')}</h1>
          <p className="text-body-sm text-body">{t('myreports.subtitle')}</p>
        </div>
        <Link
          href="/report"
          className="btn-primary flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('myreports.btnReportNow')}</span>
        </Link>
      </div>

      {!hasAnyReports ? (
        <div className="text-center py-20 border border-dashed border-hairline bg-canvas rounded-lg space-y-4">
          <Clipboard className="w-12 h-12 text-muted mx-auto" />
          <p className="text-body-sm text-muted">{t('myreports.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ----------------------------------------------------------- */}
          {/* 1. Offline Reports Section (Pending, Syncing, Failed)       */}
          {/* ----------------------------------------------------------- */}
          {pendingOffline.map((offReport) => {
            const isItemSyncing = syncingId === offReport.id || offReport.sync_status === 'syncing'

            return (
              <div
                key={offReport.id}
                className="p-5 md:p-6 rounded-lg bg-surface border border-amber-500/30 dark:border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs relative overflow-hidden"
              >
                {/* Visual accent left border */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

                <div className="flex gap-4 items-start md:items-center min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={offReport.image_url}
                    alt={offReport.title}
                    className="w-16 h-16 rounded-md object-cover border border-hairline shrink-0 bg-surface-card"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-body-md font-bold text-ink leading-snug line-clamp-1">
                        {offReport.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                        <CloudOff className="w-2.5 h-2.5" />
                        Stored Offline
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption text-muted">
                      <span className={`inline-flex px-2 py-0.5 rounded-pill text-[11px] font-semibold border ${getCategoryStyles(offReport.category)}`}>
                        {t('category.' + offReport.category)}
                      </span>
                      <span className="text-hairline-soft hidden sm:inline">|</span>
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-[200px]">{offReport.address}</span>
                      </span>
                      <span className="text-hairline-soft hidden sm:inline">|</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{new Date(offReport.created_at).toLocaleDateString(language === 'en' ? 'en-US' : language)}</span>
                      </span>
                    </div>

                    {offReport.sync_error && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{offReport.sync_error}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-4 md:pt-0 border-t border-hairline-soft md:border-0 shrink-0">
                  <SyncStatusBadge status={offReport.sync_status} />

                  {/* Sync / Retry button */}
                  {(offReport.sync_status === 'failed' || offReport.sync_status === 'pending') && (
                    <button
                      onClick={() => handleRetrySync(offReport)}
                      disabled={isItemSyncing}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-caption font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isItemSyncing ? 'animate-spin' : ''}`} />
                      <span>{isItemSyncing ? 'Syncing...' : offReport.sync_status === 'failed' ? 'Retry' : 'Sync Now'}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* ----------------------------------------------------------- */}
          {/* 2. Synced Server Reports List                               */}
          {/* ----------------------------------------------------------- */}
          {reports.map((report) => {
            const localized = getLocalizedReport(report, language)
            return (
              <div
                key={report.id}
                className="p-5 md:p-6 rounded-lg bg-canvas border border-hairline flex flex-col md:flex-row md:items-center justify-between gap-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200"
              >
                <div className="flex gap-4 items-start md:items-center min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.image_url}
                    alt={localized.title}
                    className="w-16 h-16 rounded-md object-cover border border-hairline shrink-0 bg-surface-card"
                  />
                  <div className="min-w-0">
                    <h3 className="text-body-md font-bold text-ink mb-1.5 leading-snug line-clamp-1">
                      {localized.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption text-muted">
                      <span className={`inline-flex px-2 py-0.5 rounded-pill text-[11px] font-semibold border ${getCategoryStyles(report.category)}`}>
                        {t('category.' + report.category)}
                      </span>
                      <span className="text-hairline-soft hidden sm:inline">|</span>
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-[200px]">{localized.address}</span>
                      </span>
                      <span className="text-hairline-soft hidden sm:inline">|</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{new Date(report.created_at).toLocaleDateString(language === 'en' ? 'en-US' : language)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t border-hairline-soft md:border-0 shrink-0">
                  <StatusBadge status={report.status} />
                  <Link
                    href={`/reports/${report.id}`}
                    className="inline-flex items-center gap-1 text-caption font-semibold text-ink hover:underline cursor-pointer"
                  >
                    <span>{t('card.details')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-accent" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
