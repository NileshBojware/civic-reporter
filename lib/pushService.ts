import webpush from 'web-push'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'
import { readMockDb, writeMockDb, MockPushSubscription } from '@/lib/mockDb'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidMailto = process.env.VAPID_MAILTO || 'mailto:admin@shehercare.app'

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey)
  } catch (e) {
    console.error('[PushService] VAPID initialization error:', e)
  }
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
}

/**
 * Save a push subscription in both mock_db and Supabase (if available).
 */
export async function savePushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<boolean> {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return false
  }

  // 1. Always save in mock_db.json
  try {
    const db = readMockDb()
    if (!db.push_subscriptions) db.push_subscriptions = []

    const existingIndex = db.push_subscriptions.findIndex((s) => s.endpoint === subscription.endpoint)
    const record: MockPushSubscription = {
      id: existingIndex >= 0 ? db.push_subscriptions[existingIndex].id : `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      created_at: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      db.push_subscriptions[existingIndex] = record
    } else {
      db.push_subscriptions.push(record)
    }

    writeMockDb(db)
    console.log(`[PushService] Saved subscription for user ${userId} to mock_db (total active: ${db.push_subscriptions.length})`)
  } catch (err) {
    console.error('[PushService] Error saving to mock_db:', err)
  }

  // 2. Also save to Supabase if configured & valid UUID
  if (isSupabaseServerConfigured && supabaseServer) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(userId)) {
      try {
        await supabaseServer
          .from('push_subscriptions')
          .upsert(
            {
              user_id: userId,
              endpoint: subscription.endpoint,
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
            { onConflict: 'endpoint' }
          )
      } catch (err) {
        console.warn('[PushService] Supabase upsert non-critical warning:', err)
      }
    }
  }

  return true
}

/**
 * Remove a push subscription.
 */
export async function deletePushSubscription(endpoint: string, _userId?: string) {
  // Remove from mock_db
  try {
    const db = readMockDb()
    if (db.push_subscriptions) {
      db.push_subscriptions = db.push_subscriptions.filter((s) => s.endpoint !== endpoint)
      writeMockDb(db)
    }
  } catch (err) {
    console.error('[PushService] Error deleting from mock_db:', err)
  }

  // Remove from Supabase
  if (isSupabaseServerConfigured && supabaseServer) {
    try {
      await supabaseServer.from('push_subscriptions').delete().eq('endpoint', endpoint)
    } catch (err) {
      console.warn('[PushService] Supabase delete warning:', err)
    }
  }
}

/**
 * Send web push notification to a specific user, or fallback to all active devices in local test mode.
 */
export async function sendPushNotification(
  payload: PushPayload,
  targetUserId?: string | null
): Promise<{ sent: number; total: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[PushService] VAPID keys not configured, cannot send push.')
    return { sent: 0, total: 0 }
  }

  const candidateSubs: Array<{ endpoint: string; p256dh: string; auth: string; user_id?: string }> = []

  // 1. Read from mock_db
  try {
    const db = readMockDb()
    const allMockSubs = db.push_subscriptions || []
    if (targetUserId) {
      const userSubs = allMockSubs.filter((s) => s.user_id === targetUserId)
      if (userSubs.length > 0) {
        candidateSubs.push(...userSubs)
      } else {
        // Fallback: in development / test environment, notify active subscriptions so the developer gets the notification!
        candidateSubs.push(...allMockSubs)
      }
    } else {
      candidateSubs.push(...allMockSubs)
    }
  } catch (err) {
    console.error('[PushService] Error querying mock_db subscriptions:', err)
  }

  // 2. Read from Supabase if configured
  if (isSupabaseServerConfigured && supabaseServer) {
    try {
      let query = supabaseServer.from('push_subscriptions').select('endpoint, p256dh, auth, user_id')
      if (targetUserId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(targetUserId)) {
          query = query.eq('user_id', targetUserId)
        }
      }
      const { data: supaSubs } = await query
      if (supaSubs && supaSubs.length > 0) {
        candidateSubs.push(...supaSubs)
      }
    } catch (err) {
      console.warn('[PushService] Supabase query warning:', err)
    }
  }

  // Deduplicate by endpoint
  const uniqueSubsMap = new Map<string, { endpoint: string; p256dh: string; auth: string }>()
  for (const s of candidateSubs) {
    if (s.endpoint && s.p256dh && s.auth) {
      uniqueSubsMap.set(s.endpoint, { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })
    }
  }

  const uniqueSubs = Array.from(uniqueSubsMap.values())
  if (uniqueSubs.length === 0) {
    console.log('[PushService] No active push subscriptions found to notify.')
    return { sent: 0, total: 0 }
  }

  console.log(`[PushService] Dispatching push "${payload.title}" to ${uniqueSubs.length} device(s)...`)

  let sentCount = 0
  for (const sub of uniqueSubs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload),
        {
          urgency: 'high',
          TTL: 86400,
        }
      )
      sentCount++
    } catch (err: any) {
      console.warn('[PushService] Failed sending to endpoint:', sub.endpoint.substring(0, 45) + '...', err?.message || err)
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await deletePushSubscription(sub.endpoint)
      }
    }
  }

  console.log(`[PushService] Delivered push to ${sentCount}/${uniqueSubs.length} device(s).`)
  return { sent: sentCount, total: uniqueSubs.length }
}

/**
 * Dispatch real-time push notification when an issue report changes status.
 */
export async function sendReportStatusPushNotification(
  report: { id: string; title: string; user_id?: string | null },
  newStatus: string,
  extraDetails?: { note?: string | null; rejectionReason?: string | null }
) {
  let title = 'SheherCare — Issue Status Updated'
  let body = `Your report "${report.title}" status has changed to ${newStatus.replace('_', ' ')}.`

  switch (newStatus) {
    case 'verified':
      title = 'SheherCare — Issue Verified ✓'
      body = `Your report "${report.title}" was verified by municipal authorities and assigned for action.`
      break
    case 'in_progress':
      title = 'SheherCare — Work in Progress 🛠️'
      body = `Field teams have begun active work on "${report.title}".`
      break
    case 'resolved':
      title = 'SheherCare — Issue Resolved! 🎉'
      body = extraDetails?.note
        ? `"${report.title}" has been resolved! Note: ${extraDetails.note}`
        : `"${report.title}" has been marked as Resolved by the municipal team. Click to view resolution proof.`
      break
    case 'rejected':
      title = 'SheherCare — Issue Update'
      body = extraDetails?.rejectionReason
        ? `"${report.title}" was not approved: ${extraDetails.rejectionReason}`
        : `"${report.title}" was rejected by the municipal reviewer.`
      break
  }

  const payload: PushPayload = {
    title,
    body,
    url: `/reports/${report.id}`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `report-status-${report.id}`,
  }

  return sendPushNotification(payload, report.user_id)
}
