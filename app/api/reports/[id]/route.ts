import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'
import { readMockDb, writeMockDb, Report } from '@/lib/mockDb'

// Fire-and-forget helper — sends a push notification to a user after a
// status change. We call our own /api/push/send internally so the logic
// lives in one place and works even when the browser is closed.
async function sendStatusPush(
  baseUrl: string,
  userId: string,
  reportTitle: string,
  newStatus: string,
  reportId: string
) {
  try {
    await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        user_id: userId,
        payload: {
          title: 'Issue Status Updated — SheherCare',
          body: `"${reportTitle}" is now ${newStatus.replace('_', ' ')}.`,
          url: `/reports/${reportId}`,
          icon: '/manifest-icon-192.png',
          badge: '/manifest-icon-96.png',
        },
      }),
    })
  } catch {
    // Non-critical — push failure must never break the main PATCH response
  }
}

// GET /api/reports/[id] - Get single report details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (isSupabaseServerConfigured && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(data)
  } else {
    // Mock mode
    const db = readMockDb()
    const report = db.reports.find((r) => r.id === id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    return NextResponse.json(report)
  }
}

// PATCH /api/reports/[id] - Update report details (status, note, image, rejection_reason)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { status, rejection_reason, resolved_image_url, resolved_note } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const updates: Partial<Report> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'rejected') {
      updates.rejection_reason = rejection_reason || 'No specific reason provided'
      updates.resolved_image_url = null
      updates.resolved_note = null
    } else if (status === 'resolved') {
      updates.rejection_reason = null
      updates.resolved_image_url = resolved_image_url || null
      updates.resolved_note = resolved_note || 'Issue resolved successfully.'
    } else {
      // pending, verified, or in_progress — clear any resolution/rejection data
      updates.rejection_reason = null
      updates.resolved_image_url = null
      updates.resolved_note = null
    }

    if (isSupabaseServerConfigured && supabaseServer) {
      // Fetch the existing report first to check if status actually changes
      const { data: existingReport, error: fetchError } = await supabaseServer
        .from('reports')
        .select('status')
        .eq('id', id)
        .single()

      if (fetchError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }

      const { data, error } = await supabaseServer
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Fire push notification for the citizen when status changes
      const statusChanged = existingReport.status !== data.status
      if (data.user_id && statusChanged) {
        const baseUrl = request.nextUrl.origin
        sendStatusPush(baseUrl, data.user_id, data.title, data.status, data.id)
      }

      return NextResponse.json(data)
    } else {
      // Mock mode
      const db = readMockDb()
      const reportIndex = db.reports.findIndex((r) => r.id === id)
      if (reportIndex === -1) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }

      const oldReport = db.reports[reportIndex]
      const statusChanged = oldReport.status !== status

      const updatedReport = {
        ...oldReport,
        ...updates,
      }
      db.reports[reportIndex] = updatedReport

      // Trigger status change notification + push for citizen in mock mode
      if (statusChanged && updatedReport.user_id) {
        if (!db.notifications) db.notifications = []
        db.notifications.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          user_id: updatedReport.user_id,
          report_id: updatedReport.id,
          title: 'Issue Status Updated',
          message: `Your reported issue "${updatedReport.title}" status has been changed to ${updatedReport.status}.`,
          is_read: false,
          type: 'status_change',
          created_at: new Date().toISOString(),
        })
        // Also fire push (works if the user is subscribed via the browser)
        const baseUrl = request.nextUrl.origin
        sendStatusPush(baseUrl, updatedReport.user_id, updatedReport.title, updatedReport.status, updatedReport.id)
      }

      writeMockDb(db)
      return NextResponse.json(updatedReport)
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 })
  }
}
