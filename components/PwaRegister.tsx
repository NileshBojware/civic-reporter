'use client'

import { useEffect } from 'react'
import { OfflineIndicator } from './OfflineIndicator'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SheherCare PWA Service Worker registered with scope:', registration.scope)
        })
        .catch((error) => {
          console.error('SheherCare PWA Service Worker registration failed:', error)
        })
    }
  }, [])

  // OfflineIndicator is rendered here so it's globally available on every page
  // without touching the layout tree. It returns null when online with no queue.
  return <OfflineIndicator />
}
