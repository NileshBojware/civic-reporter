import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'
import { readMockDb, writeMockDb, Comment } from '@/lib/mockDb'

// GET /api/reports/[id]/comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (isSupabaseServerConfigured && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('report_comments')
      .select('*, profiles(full_name)')
      .eq('report_id', id)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Normalise shape to match mock: surface author_name from the join
    const comments = (data ?? []).map((c: any) => ({
      ...c,
      author_name: c.profiles?.full_name ?? 'Anonymous',
    }))
    return NextResponse.json(comments)
  }

  // Mock mode
  const db = readMockDb()
  const comments = (db.comments ?? [])
    .filter((c) => c.report_id === id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  return NextResponse.json(comments)
}

// POST /api/reports/[id]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { user_id, author_name, body } = await request.json()

    if (!body || body.trim().length === 0) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    }
    if (body.trim().length > 1000) {
      return NextResponse.json({ error: 'Comment must be 1000 characters or fewer' }, { status: 400 })
    }

    if (isSupabaseServerConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('report_comments')
        .insert({ report_id: id, user_id: user_id ?? null, body: body.trim() })
        .select('*, profiles(full_name)')
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(
        { ...data, author_name: data.profiles?.full_name ?? 'Anonymous' },
        { status: 201 }
      )
    }

    // Mock mode
    const db = readMockDb()
    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      report_id: id,
      user_id: user_id ?? null,
      author_name: author_name?.trim() || 'Anonymous',
      body: body.trim(),
      created_at: new Date().toISOString(),
    }
    if (!db.comments) db.comments = []
    db.comments.push(newComment)
    writeMockDb(db)
    return NextResponse.json(newComment, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}

// DELETE /api/reports/[id]/comments?comment_id=xxx&user_id=yyy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const comment_id = searchParams.get('comment_id')
  const user_id = searchParams.get('user_id')

  if (!comment_id) {
    return NextResponse.json({ error: 'comment_id is required' }, { status: 400 })
  }

  if (isSupabaseServerConfigured && supabaseServer) {
    const { error } = await supabaseServer
      .from('report_comments')
      .delete()
      .eq('id', comment_id)
      .eq('report_id', id)
      .eq('user_id', user_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Mock mode
  const db = readMockDb()
  const before = db.comments?.length ?? 0
  db.comments = (db.comments ?? []).filter(
    (c) => !(c.id === comment_id && c.report_id === id && c.user_id === user_id)
  )
  if ((db.comments?.length ?? 0) === before) {
    return NextResponse.json({ error: 'Comment not found or not owned by user' }, { status: 404 })
  }
  writeMockDb(db)
  return NextResponse.json({ success: true })
}
