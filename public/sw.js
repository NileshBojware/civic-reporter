const CACHE_NAME = 'shehercare-cache-v3'
const DB_NAME = 'shehercare-offline-db'
const STORE_NAME = 'reports'

const ESSENTIAL_ASSETS = [
  '/',
  '/report',
  '/my-reports',
  '/reports',
  '/login',
  '/manifest.json',
  '/logo.png',
  '/icon.png',
  '/favicon.ico',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
]

// ---------------------------------------------------------------------------
// IndexedDB access within Service Worker
// ---------------------------------------------------------------------------
function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('sync_status', 'sync_status', { unique: false })
        store.createIndex('user_id', 'user_id', { unique: false })
        store.createIndex('created_at', 'created_at', { unique: false })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

async function getPendingQueueCount() {
  try {
    const db = await openOfflineDb()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => {
        const all = req.result || []
        const pendingCount = all.filter(
          (r) => r.sync_status === 'pending' || r.sync_status === 'failed'
        ).length
        resolve(pendingCount)
      }
      req.onerror = () => resolve(0)
    })
  } catch {
    return 0
  }
}

async function broadcastQueueCount() {
  const count = await getPendingQueueCount()
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach((client) => {
    client.postMessage({ type: 'QUEUE_COUNT', count })
    client.postMessage({ type: 'SYNC_STATUS_UPDATE' })
  })
}

// ---------------------------------------------------------------------------
// Install — precache essential shell and assets
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        ESSENTIAL_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Could not precache:', url, err)
          })
        )
      )
    })
  )
})

// ---------------------------------------------------------------------------
// Activate — delete obsolete caches & claim clients
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// ---------------------------------------------------------------------------
// Fetch Handler: Network-first for navigation, Cache-first for assets,
//                 Network-first for GET /api/reports, Offline fallback
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 1. Navigation (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          // Fall back to pre-cached home page shell
          const rootCached = await caches.match('/')
          return rootCached || Response.error()
        })
    )
    return
  }

  // 2. GET API reports — cache for offline browsing
  if (request.method === 'GET' && url.pathname === '/api/reports') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        })
    )
    return
  }

  // 3. Static assets: _next/static, css, js, fonts, images, unpkg
  if (
    request.method === 'GET' &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.json') ||
      url.hostname.includes('unpkg.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com'))
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return response
          })
          .catch(() => cached || Response.error())
      })
    )
    return
  }

  // 4. Default fetch
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    )
  }
})

// ---------------------------------------------------------------------------
// Background Sync — automatically replay pending reports when online
// ---------------------------------------------------------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports' || event.tag === 'sync-civic-reports') {
    event.waitUntil(replayOfflineReports())
  }
})

async function replayOfflineReports() {
  try {
    const db = await openOfflineDb()
    const pendingReports = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => {
        const all = req.result || []
        const pending = all.filter(
          (r) => r.sync_status === 'pending' || r.sync_status === 'failed'
        )
        resolve(pending)
      }
      req.onerror = () => resolve([])
    })

    if (pendingReports.length === 0) {
      await broadcastQueueCount()
      return
    }

    let successCount = 0

    for (const report of pendingReports) {
      // Mark report as syncing
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const updated = { ...report, sync_status: 'syncing', updated_at: new Date().toISOString() }
        store.put(updated)
        tx.oncomplete = resolve
      })

      try {
        const payload = {
          title: report.title,
          description: report.description,
          category: report.category,
          latitude: report.latitude,
          longitude: report.longitude,
          address: report.address,
          user_id: report.user_id,
          client_id: report.id,
          image_url: report.image_url,
        }

        if (report.image_base64) {
          payload.image_data = {
            base64: report.image_base64,
            contentType: report.image_contentType || 'image/jpeg',
            fileName: report.image_fileName || `offline_${Date.now()}.jpg`,
          }
        }

        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`)
        }

        const data = await res.json()

        // Update report status in IndexedDB to synced
        await new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          const store = tx.objectStore(STORE_NAME)
          const updated = {
            ...report,
            sync_status: 'synced',
            supabase_id: data.id,
            image_url: data.image_url || report.image_url,
            sync_error: null,
            updated_at: new Date().toISOString(),
          }
          store.put(updated)
          tx.oncomplete = resolve
        })

        successCount++
      } catch (err) {
        // Mark as failed so it can be retried
        await new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          const store = tx.objectStore(STORE_NAME)
          const updated = {
            ...report,
            sync_status: 'failed',
            sync_error: err?.message || 'Upload failed',
            retry_count: (report.retry_count || 0) + 1,
            updated_at: new Date().toISOString(),
          }
          store.put(updated)
          tx.oncomplete = resolve
        })
      }
    }

    await broadcastQueueCount()

    // Notify clients that sync finished
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_COMPLETE', count: successCount })
      client.postMessage({ type: 'SYNC_STATUS_UPDATE' })
    })
  } catch (err) {
    console.error('[SW] Replay offline reports failed:', err)
  }
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'GET_QUEUE_COUNT') {
    const count = await getPendingQueueCount()
    if (event.source) {
      event.source.postMessage({ type: 'QUEUE_COUNT', count })
    }
  }

  if (event.data?.type === 'QUEUE_OFFLINE_REPORT') {
    await broadcastQueueCount()
    if ('sync' in self.registration) {
      try {
        await self.registration.sync.register('sync-civic-reports')
      } catch (e) {
        console.warn('[SW] Could not register sync tag:', e)
      }
    }
  }

  if (event.data?.type === 'SYNC_NOW') {
    await replayOfflineReports()
  }

  if (event.data?.type === 'SHOW_TEST_NOTIFICATION') {
    self.registration.showNotification(event.data.title || 'SheherCare', {
      body: event.data.body || 'Push notifications are enabled and working properly!',
      icon: event.data.icon || '/logo.png',
      badge: event.data.badge || '/logo.png',
      data: { url: event.data.url || '/notifications' },
      vibrate: [200, 100, 200],
      tag: 'shehercare-test-notification',
      renotify: true,
    })
  }
})

// ---------------------------------------------------------------------------
// Push Notifications
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'SheherCare', body: event.data.text() }
  }

  const title = payload.title || 'SheherCare'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/logo.png',
    data: { url: payload.url || '/' },
    vibrate: [200, 100, 200],
    tag: payload.tag || 'shehercare-notification',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ---------------------------------------------------------------------------
// Notification Click
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
