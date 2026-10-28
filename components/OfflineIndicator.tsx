'use client'

import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle, CloudCheck } from 'lucide-react'
import { useOfflineSync } from '@/lib/syncManager'

/**
 * OfflineIndicator
 *
 * Displays:
 * 1. Offline banner when disconnected from internet with count of pending offline submissions.
 * 2. Real-time syncing indicator when synchronizing reports back to Supabase.
 * 3. Sync success toast when sync completes.
 * 4. Sync failure warning with a one-click "Retry" button.
 */
export function OfflineIndicator() {
  const { isOnline, stats, isSyncing, lastSyncResult, triggerSync } = useOfflineSync()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'info'>('success')

  // Trigger toast on successful sync
  useEffect(() => {
    if (lastSyncResult && lastSyncResult.synced > 0) {
      setToastMessage(
        lastSyncResult.synced === 1
          ? '1 offline report synced successfully!'
          : `${lastSyncResult.synced} offline reports synced successfully!`
      )
      setToastType('success')
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 4500)
      return () => clearTimeout(timer)
    }
  }, [lastSyncResult])

  const pendingCount = stats.pending + (stats.failed > 0 ? stats.failed : 0)

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* 1. Offline Banner — Fixed at top below navbar                      */}
      {/* ------------------------------------------------------------------ */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-0 right-0 z-40 flex items-center justify-center gap-2.5 px-4 py-2.5 bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/25 text-amber-700 dark:text-amber-300 text-caption font-semibold shadow-sm backdrop-blur-sm"
        >
          <WifiOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{"You're offline — reports will be saved locally and sent when you reconnect."}</span>

          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 ml-1 px-2.5 py-0.5 rounded-pill bg-amber-500 text-white text-[11px] font-bold shrink-0 shadow-xs">
              <RefreshCw className="w-2.5 h-2.5" />
              {pendingCount} queued
            </span>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. Active Sync Banner (when online and actively syncing)           */}
      {/* ------------------------------------------------------------------ */}
      {isOnline && isSyncing && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-0 right-0 z-40 flex items-center justify-center gap-2 px-4 py-2 bg-sky-500/10 dark:bg-sky-500/15 border-b border-sky-500/25 text-sky-700 dark:text-sky-300 text-caption font-semibold shadow-sm backdrop-blur-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin text-sky-600 dark:text-sky-400" />
          <span>Syncing pending offline reports with server...</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. Sync Failed Alert Banner with Retry action                      */}
      {/* ------------------------------------------------------------------ */}
      {isOnline && !isSyncing && stats.failed > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-0 right-0 z-40 flex items-center justify-center gap-3 px-4 py-2 bg-rose-500/10 dark:bg-rose-500/15 border-b border-rose-500/25 text-rose-700 dark:text-rose-300 text-caption font-semibold shadow-sm backdrop-blur-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{`${stats.failed} offline report(s) failed to sync.`}</span>
          <button
            onClick={() => triggerSync()}
            className="px-2.5 py-0.5 rounded-pill bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer transition shadow-xs"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. Sync Complete Toast — bottom-right notification                 */}
      {/* ------------------------------------------------------------------ */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-surface border border-emerald-500/30 dark:border-emerald-500/40 shadow-lg text-emerald-700 dark:text-emerald-300 text-caption font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  )
}
