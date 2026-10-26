import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'
import { readMockDb, writeMockDb, Report } from '@/lib/mockDb'
import { sendReportStatusPushNotification } from '@/lib/pushService'
import { getDepartmentByCategory } from '@/lib/departments'

// GET /api/reports/[id] - Get single report details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (isSupabaseServerConfigured && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('reports')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!error && data) {
        return NextResponse.json(data)
      }
    } catch (supaErr) {
      console.warn('[GET /api/reports/[id]] Supabase query fallback:', supaErr)
    }
  }

  // Fallback to mock_db
  const db = readMockDb()
  const report = db.reports.find((r) => r.id === id)
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
  return NextResponse.json(report)
}

// PATCH /api/reports/[id] - Update report details (status, note, image, rejection_reason)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { status, rejection_reason, resolved_image_url, resolved_note, admin_department_id } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Enforce department jurisdiction authorization:
    // Administrators from other departments cannot change ticket status
    if (admin_department_id && admin_department_id !== 'grievance') {
      const db = readMockDb()
      let reportCategory = db.reports.find((r) => r.id === id)?.category
      if (!reportCategory && isSupabaseServerConfigured && supabaseServer) {
        try {
          const { data: rep } = await supabaseServer.from('reports').select('category').eq('id', id).maybeSingle()
          reportCategory = rep?.category
        } catch {
          // ignore
        }
      }

      if (reportCategory) {
        const targetDept = getDepartmentByCategory(reportCategory)
        const isAuthorized = targetDept.id === admin_department_id || targetDept.categories.includes(reportCategory)
        if (!isAuthorized) {
          return NextResponse.json(
            { error: `Permission Denied: Only administrators of the ${targetDept.name} (${targetDept.shortName}) can modify this ticket's status.` },
            { status: 403 }
          )
        }
      }
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

    let updatedReport: Report | null = null
    let statusChanged = false

    // 1. Try Supabase first if configured
    if (isSupabaseServerConfigured && supabaseServer) {
      try {
        const { data: existingReport } = await supabaseServer
          .from('reports')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (existingReport) {
          statusChanged = existingReport.status !== status
          const { data, error } = await supabaseServer
            .from('reports')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

          if (!error && data) {
            updatedReport = data as Report

            // Also record in Supabase notifications table
            if (statusChanged && data.user_id) {
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
              if (uuidRegex.test(data.user_id)) {
                try {
                  await supabaseServer.from('notifications').insert({
                    user_id: data.user_id,
                    report_id: data.id,
                    title: 'Issue Status Updated',
                    message: `Your reported issue "${data.title}" status has been changed to ${data.status}.`,
                    is_read: false,
                    type: 'status_change',
                  })
                } catch {
                  // Non-fatal
                }
              }
            }
          }
        }
      } catch (supaErr) {
        console.warn('[PATCH /api/reports/[id]] Supabase update error, falling back:', supaErr)
      }
    }

    // 2. If not updated via Supabase, update in mock_db
    if (!updatedReport) {
      const db = readMockDb()
      const reportIndex = db.reports.findIndex((r) => r.id === id)
      if (reportIndex !== -1) {
        const oldReport = db.reports[reportIndex]
        statusChanged = oldReport.status !== status

        updatedReport = {
          ...oldReport,
          ...updates,
        }
        db.reports[reportIndex] = updatedReport

        // Record in in-app notifications
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
        }

        writeMockDb(db)
      }
    }

    if (!updatedReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // 3. Dispatch real Web Push notification directly to subscribed devices!
    if (statusChanged) {
      try {
        console.log(`[PATCH /api/reports] Status changed to "${updatedReport.status}" for "${updatedReport.title}". Sending Web Push...`)
        await sendReportStatusPushNotification(
          updatedReport,
          updatedReport.status,
          {
            note: updatedReport.resolved_note,
            rejectionReason: updatedReport.rejection_reason,
          }
        )
      } catch (pushErr) {
        console.error('[PATCH /api/reports] Push notification failed:', pushErr)
      }
    }

    return NextResponse.json(updatedReport)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 })
  }
}
