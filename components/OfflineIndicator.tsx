'use client'

import React, { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'

/**
 * OfflineIndicator
 *
 * Renders two distinct UI states:
 *  1. Offline banner  — shown whenever navigator.onLine is false.
 *     Includes a queued-report count badge when there are pending submissions.
 *  2. Sync-complete toast — briefly shown after the SW successfully replays
 *     queued reports on reconnect.
 *
 * This component mounts globally in PwaRegister and is zero-height when online
 * and no queue — it never occupies layout space when inactive.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [showSyncToast, setShowSyncToast] = useState(false)

  useEffect(() => {
    // Initialise from current browser state
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen to service worker messages for queue updates and sync completion
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'QUEUE_COUNT') {
        setQueueCount(event.data.count ?? 0)
      }
      if (event.data?.type === 'SYNC_COMPLETE') {
        setQueueCount(0)
        setShowSyncToast(true)
        setTimeout(() => setShowSyncToast(false), 4000)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleSwMessage)

    // Ask the SW for the current queue count on mount (handles page refresh while offline)
    navigator.serviceWorker?.controller?.postMessage({ type: 'GET_QUEUE_COUNT' })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleSwMessage)
    }
  }, [])

  // Nothing to render when fully online and no pending sync toast
  if (isOnline && !showSyncToast) return null

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Offline banner — fixed at top, pushes below the 64px nav           */}
      {/* ------------------------------------------------------------------ */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-0 right-0 z-40 flex items-center justify-center gap-2.5 px-4 py-2.5 bg-warning/10 border-b border-warning/25 text-warning text-caption font-semibold"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>You're offline — reports will be saved and sent when you reconnect.</span>

          {queueCount > 0 && (
            <span className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-pill bg-warning text-canvas text-[10px] font-bold shrink-0">
              <RefreshCw className="w-2.5 h-2.5" />
              {queueCount} queued
            </span>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Sync-complete toast — bottom-right, auto-dismisses after 4 s       */}
      {/* ------------------------------------------------------------------ */}
      {showSyncToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-canvas border border-success/25 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-success text-caption font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Offline reports synced successfully.</span>
        </div>
      )}
    </>
  )
}
