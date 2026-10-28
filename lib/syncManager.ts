'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getOfflineStats,
  syncAllPendingReports,
  syncOfflineReport,
  OfflineReport,
  getOfflineReports,
} from './offlineStorage'

/**
 * Register Background Sync with Service Worker if supported by the browser
 */
export async function registerServiceWorkerSync(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    if ('sync' in registration) {
      // @ts-ignore - Background Sync API type
      await registration.sync.register('sync-civic-reports')
      return true
    }
  } catch (err) {
    console.warn('Background sync registration failed, will use online listener fallback:', err)
  }

  return false
}

/**
 * Hook to monitor online/offline status, pending offline report counts,
 * and trigger automatic or manual synchronization.
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine
    }
    return true
  })

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
  })

  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number
    failed: number
    timestamp: number
  } | null>(null)

  // Refresh stats from IndexedDB
  const refreshStats = useCallback(async () => {
    try {
      const s = await getOfflineStats()
      setStats(s)
    } catch {
      // ignore
    }
  }, [])

  // Trigger sync of all pending/failed reports
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return

    setIsSyncing(true)
    try {
      // If service worker is available, ask it to sync, or run client sync fallback
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' })
      }

      const result = await syncAllPendingReports()
      setLastSyncResult({
        synced: result.synced,
        failed: result.failed,
        timestamp: Date.now(),
      })
      await refreshStats()
    } catch (err) {
      console.error('Manual sync failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, refreshStats])

  useEffect(() => {
    refreshStats()

    const handleOnline = () => {
      setIsOnline(true)
      // Automatic Synchronization fallback for all browsers when connection returns
      triggerSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      refreshStats()
    }

    const handleCustomSyncChange = () => {
      refreshStats()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        refreshStats()
        // If there are pending items, attempt sync
        triggerSync()
      }
    }

    // Service Worker messages
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE' || event.data?.type === 'SYNC_STATUS_UPDATE') {
        refreshStats()
        if (event.data?.type === 'SYNC_COMPLETE' && event.data?.count !== undefined) {
          setLastSyncResult({
            synced: event.data.count,
            failed: 0,
            timestamp: Date.now(),
          })
        }
      }
      if (event.data?.type === 'QUEUE_COUNT') {
        refreshStats()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('shehercare:sync_status_changed', handleCustomSyncChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    navigator.serviceWorker?.addEventListener('message', handleSwMessage)

    // Initial check for background sync or immediate upload if back online
    registerServiceWorkerSync()
    if (navigator.onLine) {
      triggerSync()
    }

    // Periodic check every 30 seconds if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        refreshStats()
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('shehercare:sync_status_changed', handleCustomSyncChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      navigator.serviceWorker?.removeEventListener('message', handleSwMessage)
      clearInterval(interval)
    }
  }, [refreshStats, triggerSync])

  return {
    isOnline,
    stats,
    isSyncing,
    lastSyncResult,
    triggerSync,
    refreshStats,
  }
}
