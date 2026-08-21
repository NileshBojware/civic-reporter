import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'
import { readMockDb, writeMockDb, Report } from '@/lib/mockDb'
import { getDistanceHaversine } from '@/lib/haversine'

// GET /api/reports - List reports or run duplicate check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const duplicateCheck = searchParams.get('duplicateCheck') === 'true'
  const category = searchParams.get('category')
  const latStr = searchParams.get('latitude')
  const lngStr = searchParams.get('longitude')

  // If running a duplicate check
  if (duplicateCheck && category && latStr && lngStr) {
    const targetLat = parseFloat(latStr)
    const targetLng = parseFloat(lngStr)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    let reportsToCheck: Report[] = []

    if (isSupabaseServerConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('reports')
        .select('*')
        .eq('category', category)
        .neq('status', 'resolved')
        .gt('created_at', sevenDaysAgo)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      reportsToCheck = data || []
    } else {
      // Mock mode
      const db = readMockDb()
      reportsToCheck = db.reports.filter(
        (r) =>
          r.category === category &&
          r.status !== 'resolved' &&
          r.created_at >= sevenDaysAgo
      )
    }

    // Run Haversine formula to find items within 100 meters
    const duplicates = reportsToCheck.filter((r) => {
      const distance = getDistanceHaversine(targetLat, targetLng, r.latitude, r.longitude)
      return distance <= 100
    })

    return NextResponse.json({ duplicates })
  }

  // General list of reports
  let reports: Report[] = []

  if (isSupabaseServerConfigured && supabaseServer) {
    const { data, error } = await supabaseServer
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    reports = data || []
  } else {
    // Mock mode
    const db = readMockDb()
    reports = [...db.reports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  return NextResponse.json(reports)
}

// POST /api/reports - Create new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, latitude, longitude, address, image_url, user_id } = body

    if (!title || !category || latitude === undefined || longitude === undefined || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newReportData = {
      title,
      description: description || '',
      category,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      image_url: image_url || 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80',
      status: 'pending' as const,
      upvote_count: 0,
      user_id: user_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseServerConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('reports')
        .insert(newReportData)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data, { status: 201 })
    } else {
      // Mock mode
      const db = readMockDb()
      const newReport: Report = {
        id: `report-${Date.now()}`,
        ...newReportData,
      }
      db.reports.push(newReport)

      // Trigger notifications for admins in mock mode
      if (!db.notifications) {
        db.notifications = []
      }
      const admins = db.profiles.filter((p) => p.role === 'admin')
      admins.forEach((admin) => {
        db.notifications.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          user_id: admin.id,
          report_id: newReport.id,
          title: 'New Issue Reported',
          message: `A new issue has been reported: "${newReport.title}"`,
          is_read: false,
          type: 'new_report',
          created_at: new Date().toISOString(),
        })
      })

      writeMockDb(db)
      return NextResponse.json(newReport, { status: 201 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 })
  }
}
