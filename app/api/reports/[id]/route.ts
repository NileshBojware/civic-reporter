import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'
import { readMockDb, writeMockDb, Report } from '@/lib/mockDb'

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
      // pending or in_progress resets resolutions
      updates.rejection_reason = null
      updates.resolved_image_url = null
      updates.resolved_note = null
    }

    if (isSupabaseServerConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data)
    } else {
      // Mock mode
      const db = readMockDb()
      const reportIndex = db.reports.findIndex((r) => r.id === id)
      if (reportIndex === -1) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }

      const updatedReport = {
        ...db.reports[reportIndex],
        ...updates,
      }
      db.reports[reportIndex] = updatedReport
      writeMockDb(db)
      return NextResponse.json(updatedReport)
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 })
  }
}
