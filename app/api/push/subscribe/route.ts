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

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // In mock mode there's no persistent store for push subscriptions —
    // the browser still registers with the push server directly, so push
    // will work as long as the same browser session is open.

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
      const { error } = await supabaseServer
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user_id)
        .eq('endpoint', endpoint)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}
