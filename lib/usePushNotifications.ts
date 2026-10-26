'use client'

import { useEffect, useState, useCallback } from 'react'

export type PushPermission = 'default' | 'granted' | 'denied'

interface UsePushNotificationsReturn {
  permission: PushPermission
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  statusMessage: string | null
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  sendTestNotification: () => Promise<void>
}

// Fallback to the generated VAPID key in case process.env was not bundled
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BBxo4xbT3QZvArFLs5fA4QKfuUdoms_C-eHuQeZ4A-JAiPJwixxLvc0CStPSBYK3qGWJkgDk9PwSZG5EoWw31Us'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications(userId: string | null): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as PushPermission
    }
    return 'default'
  })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Check subscription status on mount and changes
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (!('serviceWorker' in navigator)) return

    let isMounted = true

    const checkSubscription = async () => {
      try {
        let reg = await navigator.serviceWorker.getRegistration()
        if (!reg && 'serviceWorker' in navigator) {
          reg = await navigator.serviceWorker.register('/sw.js').catch(() => undefined)
        }
        if (reg && isMounted) {
          const existing = await reg.pushManager.getSubscription().catch(() => null)
          setIsSubscribed(!!existing)
        }
      } catch (err) {
        console.warn('[Push] Error checking subscription:', err)
      }
    }

    checkSubscription()

    return () => {
      isMounted = false
    }
  }, [userId])

  const subscribe = useCallback(async (): Promise<boolean> => {
    setError(null)
    setStatusMessage(null)

    if (typeof window === 'undefined' || !('Notification' in window)) {
      const msg = 'Push notifications are not supported in this browser.'
      setError(msg)
      alert(msg)
      return false
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      const msg = 'Service Workers or Push messaging is not supported in this browser.'
      setError(msg)
      alert(msg)
      return false
    }

    if (!VAPID_PUBLIC_KEY) {
      const msg = 'VAPID public key is missing.'
      setError(msg)
      return false
    }

    setIsLoading(true)
    try {
      // 1. Request notification permission
      let perm = Notification.permission
      if (perm !== 'granted') {
        perm = await Notification.requestPermission()
      }
      setPermission(perm as PushPermission)

      if (perm !== 'granted') {
        if (perm === 'denied') {
          setError('Notifications are blocked in your browser settings. Please click the site settings / lock icon in your address bar and allow notifications.')
        } else {
          setError('Notification permission request was dismissed.')
        }
        return false
      }

      // 2. Ensure service worker is registered
      let reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js')
      }

      // Wait for registration to become active (with timeout fallback)
      if (!reg.active) {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ])
      }

      // 3. Unsubscribe any existing or stale subscription first
      try {
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          await existing.unsubscribe()
        }
      } catch (e) {
        console.warn('[Push] Clean existing subscription notice:', e)
      }

      // 4. Subscribe to PushManager
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as BufferSource,
      })

      // 5. Save to server backend
      const effectiveId = userId || 'device-' + Math.random().toString(36).substring(2, 10)
      try {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: effectiveId, subscription: subscription.toJSON() }),
        })
      } catch (fetchErr) {
        console.warn('[Push] Server sync failed (offline or local):', fetchErr)
      }

      setIsSubscribed(true)
      setStatusMessage('Push notifications successfully enabled!')

      return true
    } catch (err: unknown) {
      console.error('Push subscribe failed:', err)
      const message = err instanceof Error ? err.message : 'Failed to enable push notifications.'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setError(null)
    setStatusMessage(null)
    setIsLoading(true)

    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          const effectiveId = userId || 'device'
          try {
            await fetch('/api/push/subscribe', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: effectiveId, endpoint: existing.endpoint }),
            })
          } catch (e) {
            console.warn('[Push] Server unsubscribe notice:', e)
          }
          await existing.unsubscribe()
        }
      }
      setIsSubscribed(false)
      setStatusMessage('Push notifications disabled.')
      return true
    } catch (err: unknown) {
      console.error('Push unsubscribe failed:', err)
      const message = err instanceof Error ? err.message : 'Failed to disable push notifications.'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const sendTestNotification = useCallback(async () => {
    setError(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg && reg.showNotification) {
        await reg.showNotification('SheherCare Test Alert 🔔', {
          body: 'Push notifications are working perfectly on this device!',
          icon: '/logo.png',
          badge: '/logo.png',
        })
        setStatusMessage('Test notification sent!')
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('SheherCare Test Alert 🔔', {
          body: 'Push notifications are working perfectly on this device!',
          icon: '/logo.png',
        })
        setStatusMessage('Test notification sent!')
      } else {
        setError('Please enable push notifications first to receive alerts.')
      }
    } catch (err: unknown) {
      console.error('Failed to send test notification:', err)
      const message = err instanceof Error ? err.message : 'Could not show test notification.'
      setError(message)
    }
  }, [])

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    statusMessage,
    subscribe,
    unsubscribe,
    sendTestNotification,
  }
}
