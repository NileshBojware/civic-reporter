import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidMailto = process.env.VAPID_MAILTO || 'mailto:admin@shehercare.app'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey)
}

export interface PushPayload {
  title: string
  body: string
  url?: string   // deep-link opened when the notification is clicked
  icon?: string
  badge?: string
}

// POST /api/push/send
// Body: { user_id: string, payload: PushPayload }
// Called internally by our own API routes (e.g. PATCH /api/reports/[id]) after
// a status change. Never exposed to untrusted callers — it only runs server-side.
export async function POST(request: NextRequest) {
  // Verify the call is coming from our own server (internal secret header)
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  try {
    const { user_id, payload } = (await request.json()) as {
      user_id: string
      payload: PushPayload
    }

    if (!user_id || !payload?.title) {
      return NextResponse.json({ error: 'user_id and payload.title required' }, { status: 400 })
    }

    if (!isSupabaseServerConfigured || !supabaseServer) {
      // Mock mode — nothing to do (no persistent subscription store)
      return NextResponse.json({ sent: 0, skipped: 'mock-mode' })
    }

    // Fetch all push subscriptions for this user
    const { data: subs, error } = await supabaseServer
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 'no-subscriptions' })
    }

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        )
      )
    )

    // Remove expired/invalid subscriptions (410 Gone, 404 Not Found)
    const expiredEndpoints: string[] = []
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const statusCode = (result.reason as any)?.statusCode
        if (statusCode === 410 || statusCode === 404) {
          expiredEndpoints.push(subs[i].endpoint)
        }
      }
    })

    if (expiredEndpoints.length > 0) {
      await supabaseServer
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints)
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return NextResponse.json({ sent, total: subs.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Push send failed' }, { status: 500 })
  }
}
