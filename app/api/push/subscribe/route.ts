import { NextRequest, NextResponse } from 'next/server'
import { savePushSubscription, deletePushSubscription } from '@/lib/pushService'

// POST /api/push/subscribe   — save a new push subscription for a user
// DELETE /api/push/subscribe — remove a push subscription (e.g. on logout)

export async function POST(request: NextRequest) {
  try {
    const { user_id, subscription } = await request.json()

    if (!user_id || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'user_id and full PushSubscription required' }, { status: 400 })
    }

    await savePushSubscription(user_id, subscription)

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user_id, endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint required' }, { status: 400 })
    }

    await deletePushSubscription(endpoint, user_id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}
