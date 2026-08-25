const CACHE_NAME = 'shehercare-cache-v2'
const QUEUE_STORE = 'shehercare-report-queue'
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
]

// ---------------------------------------------------------------------------
// Helpers: lightweight IndexedDB queue (no workbox dependency)
// ---------------------------------------------------------------------------

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_STORE, 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

async function enqueueRequest(serialized) {
  const db = await openQueueDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite')
    tx.objectStore('queue').add(serialized)
    tx.oncomplete = resolve
    tx.onerror = (e) => reject(e.target.error)
  })
}

async function dequeueAll() {
  const db = await openQueueDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite')
    const store = tx.objectStore('queue')
    const items = []
    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result
      if (cursor) {
        items.push(cursor.value)
        cursor.delete()
        cursor.continue()
      } else {
        resolve(items)
      }
    }
    tx.onerror = (e) => reject(e.target.error)
  })
}

async function getQueueCount() {
  const db = await openQueueDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly')
    const req = tx.objectStore('queue').count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

// Broadcast queue count to all open tabs so the UI badge can update
async function broadcastQueueCount() {
  const count = await getQueueCount()
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach((client) =>
    client.postMessage({ type: 'QUEUE_COUNT', count })
  )
}

// ---------------------------------------------------------------------------
// Install — pre-cache static shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  )
})

// ---------------------------------------------------------------------------
// Activate — clean stale caches
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
// Fetch — network-first for navigation, cache-first for assets,
//          offline queue for POST /api/reports
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    // Queue failed POST /api/reports submissions for background sync
    if (
      event.request.method === 'POST' &&
      event.request.url.includes('/api/reports') &&
      !event.request.url.includes('/upvote')
    ) {
      event.respondWith(
        fetch(event.request.clone()).catch(async () => {
          // Network unavailable — serialize and queue the request body
          try {
            const body = await event.request.clone().text()
            await enqueueRequest({
              url: event.request.url,
              body,
              timestamp: Date.now(),
            })
            await broadcastQueueCount()
            // Register for background sync if supported
            if ('sync' in self.registration) {
              await self.registration.sync.register('sync-reports')
            }
          } catch (err) {
            console.error('[SW] Failed to queue report:', err)
          }
          // Return a synthetic queued response so the page doesn't hard-error
          return new Response(
            JSON.stringify({ queued: true, message: 'Report saved offline. Will sync when online.' }),
            { status: 202, headers: { 'Content-Type': 'application/json' } }
          )
        })
      )
    }
    return
  }

  // Network-first for HTML navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          return response
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/'))
        )
    )
    return
  }

  // Cache-first for static assets and Leaflet CDN
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})

// ---------------------------------------------------------------------------
// Background Sync — replay queued reports when network returns
// ---------------------------------------------------------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(replayQueuedReports())
  }
})

async function replayQueuedReports() {
  const queued = await dequeueAll()
  if (queued.length === 0) return

  await Promise.allSettled(
    queued.map(async (item) => {
      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: item.body,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } catch (err) {
        // Re-queue on failure so it isn't lost
        await enqueueRequest(item)
        throw err
      }
    })
  )

  await broadcastQueueCount()

  // Notify open tabs that sync completed
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach((client) =>
    client.postMessage({ type: 'SYNC_COMPLETE' })
  )
}

// ---------------------------------------------------------------------------
// Message handler — allow pages to request the current queue count
// ---------------------------------------------------------------------------
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'GET_QUEUE_COUNT') {
    const count = await getQueueCount()
    event.source.postMessage({ type: 'QUEUE_COUNT', count })
  }
})
