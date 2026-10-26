import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'

// POST /api/push/subscribe   — save a new push subscription for a user
// DELETE /api/push/subscribe — remove a push subscription (e.g. on logout)

export async function POST(request: NextRequest) {
  try {
    const { user_id, subscription } = await request.json()

    if (!user_id || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'user_id and full PushSubscription required' }, { status: 400 })
    }

    if (isSupabaseServerConfigured && supabaseServer) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(user_id)) {
        // Upsert so re-subscribing (e.g. after permission grant) just refreshes the keys
        const { error } = await supabaseServer
          .from('push_subscriptions')
          .upsert(
            {
              user_id,
              endpoint: subscription.endpoint,
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
            { onConflict: 'endpoint' }
          )

        if (error) {
          console.warn('[Push Subscribe] Supabase upsert failed:', error.message)
          // Do not fail the client request entirely if the database table had an issue
        }
      } else {
        // Mock mode or client device identifier
        console.log('[Push Subscribe] Non-UUID user_id subscribed (client-side only):', user_id)
      }
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user_id, endpoint } = await request.json()

    if (!user_id || !endpoint) {
      return NextResponse.json({ error: 'user_id and endpoint required' }, { status: 400 })
    }

    if (isSupabaseServerConfigured && supabaseServer) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(user_id)) {
        const { error } = await supabaseServer
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user_id)
          .eq('endpoint', endpoint)

        if (error) {
          console.warn('[Push Unsubscribe] Supabase delete failed:', error.message)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}
