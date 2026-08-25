'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register the service worker
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

  return null
}
