'use client'

import { useEffect, useState } from 'react'

export type PushPermission = 'default' | 'granted' | 'denied'

interface UsePushNotificationsReturn {
  permission: PushPermission
  isSubscribed: boolean
  isLoading: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications(userId: string | null): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Sync permission state and check existing subscription on mount / userId change
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    setPermission(Notification.permission as PushPermission)

    if (!userId || !('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return

    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      setIsSubscribed(!!existing)
    })
  }, [userId])

  const subscribe = async () => {
    if (!userId) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }
    if (!VAPID_PUBLIC_KEY) {
      console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.')
      return
    }

    setIsLoading(true)
    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission()
      setPermission(result as PushPermission)
      if (result !== 'granted') return

      // 2. Get the active service worker registration
      const reg = await navigator.serviceWorker.ready

      // 3. Unsubscribe any stale subscription first
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      // 4. Subscribe with VAPID public key
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      })

      // 5. Save to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, subscription: subscription.toJSON() }),
      })

      setIsSubscribed(true)
    } catch (err) {
      console.error('Push subscribe failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, endpoint: existing.endpoint }),
        })
        await existing.unsubscribe()
      }
      setIsSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe }
}
