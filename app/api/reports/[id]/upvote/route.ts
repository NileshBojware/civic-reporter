import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'
import { readMockDb, writeMockDb } from '@/lib/mockDb'

// POST /api/reports/[id]/upvote - Toggle upvote on a report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required to vote' }, { status: 400 })
    }

    if (isSupabaseServerConfigured && supabaseServer) {
      // Check if vote already exists
      const { data: existingVote } = await supabaseServer
        .from('report_votes')
        .select('*')
        .eq('report_id', id)
        .eq('user_id', user_id)
        .maybeSingle()

      if (existingVote) {
        // Remove vote
        const { error: deleteError } = await supabaseServer
          .from('report_votes')
          .delete()
          .eq('report_id', id)
          .eq('user_id', user_id)

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        // Decrement upvote count
        // We'll read the report first
        const { data: report } = await supabaseServer
          .from('reports')
          .select('upvote_count')
          .eq('id', id)
          .single()

        const currentCount = report?.upvote_count || 0
        const newCount = Math.max(0, currentCount - 1)

        const { data: updatedReport, error: updateError } = await supabaseServer
          .from('reports')
          .update({ upvote_count: newCount })
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ upvoted: false, upvote_count: newCount, report: updatedReport })
      } else {
        // Add vote
        const { error: insertError } = await supabaseServer
          .from('report_votes')
          .insert({ report_id: id, user_id })

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        // Increment upvote count
        const { data: report } = await supabaseServer
          .from('reports')
          .select('upvote_count')
          .eq('id', id)
          .single()

        const currentCount = report?.upvote_count || 0
        const newCount = currentCount + 1

        const { data: updatedReport, error: updateError } = await supabaseServer
          .from('reports')
          .update({ upvote_count: newCount })
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ upvoted: true, upvote_count: newCount, report: updatedReport })
      }
    } else {
      // Mock mode
      const db = readMockDb()
      const voteIndex = db.report_votes.findIndex(
        (v) => v.report_id === id && v.user_id === user_id
      )
      const reportIndex = db.reports.findIndex((r) => r.id === id)

      if (reportIndex === -1) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }

      const report = db.reports[reportIndex]

      if (voteIndex !== -1) {
        // Remove vote
        db.report_votes.splice(voteIndex, 1)
        report.upvote_count = Math.max(0, report.upvote_count - 1)
        db.reports[reportIndex] = report
        writeMockDb(db)
        return NextResponse.json({ upvoted: false, upvote_count: report.upvote_count, report })
      } else {
        // Add vote
        db.report_votes.push({ report_id: id, user_id })
        report.upvote_count = report.upvote_count + 1
        db.reports[reportIndex] = report
        writeMockDb(db)
        return NextResponse.json({ upvoted: true, upvote_count: report.upvote_count, report })
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 })
  }
}
