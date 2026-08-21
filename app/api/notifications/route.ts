import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'
import { readMockDb, writeMockDb, MockNotification } from '@/lib/mockDb'

// GET /api/notifications - Get notifications for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (isSupabaseServerConfigured && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } else {
    // Mock mode
    const db = readMockDb()
    const notifications = (db.notifications || [])
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(notifications)
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, notification_id, mark_all_read } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (isSupabaseServerConfigured && supabaseServer) {
      let query = supabaseServer.from('notifications').update({ is_read: true }).eq('user_id', user_id)

      if (!mark_all_read && notification_id) {
        query = query.eq('id', notification_id)
      }

      const { data, error } = await query.select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data)
    } else {
      // Mock mode
      const db = readMockDb()
      if (!db.notifications) {
        db.notifications = []
      }

      db.notifications = db.notifications.map((n) => {
        if (n.user_id === user_id) {
          if (mark_all_read || n.id === notification_id) {
            return { ...n, is_read: true }
          }
        }
        return n
      })

      writeMockDb(db)
      const updated = db.notifications
        .filter((n) => n.user_id === user_id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return NextResponse.json(updated)
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 })
  }
}
