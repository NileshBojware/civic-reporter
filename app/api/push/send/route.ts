import { NextRequest, NextResponse } from 'next/server'
import { sendPushNotification, PushPayload } from '@/lib/pushService'

// POST /api/push/send
// Body: { user_id?: string, payload: PushPayload }
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (
    process.env.INTERNAL_API_SECRET &&
    secret !== process.env.INTERNAL_API_SECRET &&
    process.env.NODE_ENV === 'production'
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { user_id, payload } = (await request.json()) as {
      user_id?: string
      payload: PushPayload
    }

    if (!payload?.title) {
      return NextResponse.json({ error: 'payload.title required' }, { status: 400 })
    }

    const result = await sendPushNotification(payload, user_id)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Push send failed' }, { status: 500 })
  }
}
