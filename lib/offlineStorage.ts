/**
 * SheherCare Offline Storage & Sync Engine
 * Built with native IndexedDB for maximum browser compatibility and data safety.
 * Handles offline report storage, image preservation, de-duplication, and automatic synchronization.
 */

export type OfflineSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export interface OfflineReport {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  latitude: number
  longitude: number
  address: string
  image_url: string // Data URL for offline display
  image_base64?: string // Pure base64 payload
  image_contentType?: string
  image_fileName?: string
  status: 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected'
  sync_status: OfflineSyncStatus
  sync_error?: string | null
  retry_count: number
  supabase_id?: string | null
  created_at: string
  updated_at: string
}

export interface SaveOfflineReportParams {
  user_id: string
  title: string
  description?: string
  category: string
  latitude: number
  longitude: number
  address: string
  photoUrl: string // base64 or blob URL
  photoFile?: File | Blob | null
}

const DB_NAME = 'shehercare-offline-db'
const DB_VERSION = 1
const STORE_NAME = 'reports'

// Open and initialize IndexedDB
export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB is not supported in this environment'))
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('sync_status', 'sync_status', { unique: false })
        store.createIndex('user_id', 'user_id', { unique: false })
        store.createIndex('created_at', 'created_at', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Dispatch event to notify UI components across the app
export function notifySyncStateChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shehercare:sync_status_changed'))
  }
}

// Convert File / Blob / dataUrl to pure base64 components
export async function extractBase64Data(
  photoUrl: string,
  photoFile?: File | Blob | null
): Promise<{ base64: string; contentType: string; fileName: string }> {
  let contentType = 'image/jpeg'
  let fileName = `evidence_${Date.now()}.jpg`
  let base64 = ''

  if (photoFile) {
    contentType = photoFile.type || 'image/jpeg'
    if ('name' in photoFile && photoFile.name) {
      fileName = photoFile.name
    }
    const buffer = await photoFile.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    base64 = btoa(binary)
  } else if (photoUrl && photoUrl.startsWith('data:')) {
    const parts = photoUrl.split(',')
    const match = parts[0].match(/:(.*?);/)
    if (match) contentType = match[1]
    base64 = parts[1] || ''
  }

  return { base64, contentType, fileName }
}

// Save a report offline in IndexedDB
export async function saveOfflineReport(params: SaveOfflineReportParams): Promise<OfflineReport> {
  const db = await openOfflineDb()
  const { base64, contentType, fileName } = await extractBase64Data(params.photoUrl, params.photoFile)

  const timestamp = new Date().toISOString()
  const reportId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const report: OfflineReport = {
    id: reportId,
    user_id: params.user_id || 'anonymous',
    title: params.title,
    description: params.description || '',
    category: params.category,
    latitude: params.latitude,
    longitude: params.longitude,
    address: params.address,
    image_url: params.photoUrl,
    image_base64: base64,
    image_contentType: contentType,
    image_fileName: fileName,
    status: 'pending',
    sync_status: 'pending',
    sync_error: null,
    retry_count: 0,
    supabase_id: null,
    created_at: timestamp,
    updated_at: timestamp,
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(report)

    request.onsuccess = () => {
      notifySyncStateChanged()

      // Ask Service Worker to register Background Sync if supported
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'QUEUE_OFFLINE_REPORT',
          reportId: report.id,
        })
      }

      resolve(report)
    }

    request.onerror = () => reject(request.error)
  })
}

// Retrieve all offline reports (optionally filtered by user_id)
export async function getOfflineReports(userId?: string): Promise<OfflineReport[]> {
  try {
    const db = await openOfflineDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        let reports: OfflineReport[] = request.result || []
        if (userId) {
          reports = reports.filter((r) => r.user_id === userId)
        }
        // Sort descending by created_at
        reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        resolve(reports)
      }

      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('Failed to get offline reports:', err)
    return []
  }
}

// Get single offline report by ID
export async function getOfflineReportById(id: string): Promise<OfflineReport | null> {
  try {
    const db = await openOfflineDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

// Update an offline report (e.g. sync_status, error, retry_count)
export async function updateOfflineReport(
  id: string,
  updates: Partial<OfflineReport>
): Promise<OfflineReport> {
  const db = await openOfflineDb()
  const existing = await getOfflineReportById(id)
  if (!existing) {
    throw new Error(`Offline report with id ${id} not found`)
  }

  const updated: OfflineReport = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(updated)

    request.onsuccess = () => {
      notifySyncStateChanged()
      resolve(updated)
    }

    request.onerror = () => reject(request.error)
  })
}

// Delete an offline report
export async function deleteOfflineReport(id: string): Promise<void> {
  try {
    const db = await openOfflineDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        notifySyncStateChanged()
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error(`Failed to delete offline report ${id}:`, err)
  }
}

// Get pending reports that need synchronization
export async function getPendingOfflineReports(): Promise<OfflineReport[]> {
  const all = await getOfflineReports()
  const now = Date.now()

  return all.filter((r) => {
    if (r.sync_status === 'pending' || r.sync_status === 'failed') {
      return true
    }
    // If stuck in 'syncing' for more than 45 seconds, allow retry
    if (r.sync_status === 'syncing') {
      const updatedTime = new Date(r.updated_at).getTime()
      if (now - updatedTime > 45000) {
        return true
      }
    }
    return false
  })
}

// Get offline statistics
export async function getOfflineStats(): Promise<{
  total: number
  pending: number
  syncing: number
  synced: number
  failed: number
}> {
  const all = await getOfflineReports()
  return {
    total: all.length,
    pending: all.filter((r) => r.sync_status === 'pending').length,
    syncing: all.filter((r) => r.sync_status === 'syncing').length,
    synced: all.filter((r) => r.sync_status === 'synced').length,
    failed: all.filter((r) => r.sync_status === 'failed').length,
  }
}

// Synchronization lock to prevent race conditions
let isSyncInProgress = false

// Sync a single offline report to the server
export async function syncOfflineReport(
  reportOrId: OfflineReport | string
): Promise<{ success: boolean; data?: any; error?: string }> {
  let report: OfflineReport | null = null

  if (typeof reportOrId === 'string') {
    report = await getOfflineReportById(reportOrId)
  } else {
    report = reportOrId
  }

  if (!report) {
    return { success: false, error: 'Report not found' }
  }

  // Already synced
  if (report.sync_status === 'synced' && report.supabase_id) {
    return { success: true, data: { id: report.supabase_id } }
  }

  // Mark as syncing in IndexedDB
  await updateOfflineReport(report.id, {
    sync_status: 'syncing',
    sync_error: null,
  })

  try {
    const payload: any = {
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

    // Attach base64 image data if present so server can upload to Supabase storage
    if (report.image_base64) {
      payload.image_data = {
        base64: report.image_base64,
        contentType: report.image_contentType || 'image/jpeg',
        fileName: report.image_fileName || `evidence_${Date.now()}.jpg`,
      }
    }

    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let errText = 'Server returned error ' + response.status
      try {
        const errJson = await response.json()
        if (errJson.error) errText = errJson.error
      } catch {
        // use default status text
      }
      throw new Error(errText)
    }

    const savedData = await response.json()

    // Successfully uploaded to Supabase / server
    await updateOfflineReport(report.id, {
      sync_status: 'synced',
      supabase_id: savedData.id,
      image_url: savedData.image_url || report.image_url,
      sync_error: null,
    })

    return { success: true, data: savedData }
  } catch (err: any) {
    const errorMessage = err?.message || 'Network request failed'
    await updateOfflineReport(report.id, {
      sync_status: 'failed',
      sync_error: errorMessage,
      retry_count: (report.retry_count || 0) + 1,
    })

    return { success: false, error: errorMessage }
  }
}

// Sync all pending and failed offline reports
export async function syncAllPendingReports(): Promise<{
  total: number
  synced: number
  failed: number
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { total: 0, synced: 0, failed: 0 }
  }

  if (isSyncInProgress) {
    return { total: 0, synced: 0, failed: 0 }
  }

  isSyncInProgress = true

  try {
    const pending = await getPendingOfflineReports()
    if (pending.length === 0) {
      return { total: 0, synced: 0, failed: 0 }
    }

    let synced = 0
    let failed = 0

    for (const report of pending) {
      // Abort early if user lost internet mid-sync
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        break
      }

      const res = await syncOfflineReport(report)
      if (res.success) {
        synced++
      } else {
        failed++
      }
    }

    notifySyncStateChanged()
    return { total: pending.length, synced, failed }
  } finally {
    isSyncInProgress = false
  }
}
