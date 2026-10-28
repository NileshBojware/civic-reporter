import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'
import { readMockDb, writeMockDb, Report } from '@/lib/mockDb'
import { getDistanceHaversine } from '@/lib/haversine'
import { getDepartmentByCategory } from '@/lib/departments'
import { getCategoryFormattedLabel, toLegacyCategoryKey } from '@/lib/categories'

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

// POST /api/reports - Create new report & dispatch to Department Admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, latitude, longitude, address, image_url, user_id } = body

    if (!title || !category || latitude === undefined || longitude === undefined || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const dept = getDepartmentByCategory(category)
    const categoryLabel = getCategoryFormattedLabel(category)

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
      let insertResult = await supabaseServer
        .from('reports')
        .insert(newReportData)
        .select()
        .single()

      if (insertResult.error && (
        insertResult.error.message?.includes('reports_category_check') ||
        insertResult.error.message?.toLowerCase().includes('check constraint')
      )) {
        // Fallback to legacy category key to satisfy un-migrated database check constraint
        const legacyData = {
          ...newReportData,
          category: toLegacyCategoryKey(category)
        }
        insertResult = await supabaseServer
          .from('reports')
          .insert(legacyData)
          .select()
          .single()
      }

      if (insertResult.error) {
        return NextResponse.json({ error: insertResult.error.message }, { status: 500 })
      }

      const createdReport = insertResult.data

      // Department-specific notification dispatch in Supabase
      try {
        // Query department admin profile
        const { data: deptAdmins } = await supabaseServer
          .from('profiles')
          .select('id, full_name, department')
          .eq('role', 'admin')

        if (deptAdmins && deptAdmins.length > 0) {
          // Filter matching department admin or general grievance admin
          const relevantAdmins = deptAdmins.filter(
            (adm) =>
              adm.department === dept.id ||
              adm.full_name?.toLowerCase().includes(dept.name.toLowerCase()) ||
              adm.full_name?.toLowerCase().includes(dept.shortName.toLowerCase()) ||
              adm.department === 'grievance'
          )

          const targets = relevantAdmins.length > 0 ? relevantAdmins : deptAdmins.slice(0, 1)

          for (const targetAdmin of targets) {
            await supabaseServer.from('notifications').insert({
              user_id: targetAdmin.id,
              report_id: createdReport.id,
              title: `[${dept.shortName}] New Issue Reported`,
              message: `A new ${categoryLabel} issue has been routed to your department: "${createdReport.title}" at ${createdReport.address}`,
              type: 'new_report',
              is_read: false,
            })
          }
        }
      } catch (notifErr) {
        console.error('Error dispatching department admin notification:', notifErr)
      }

      return NextResponse.json(createdReport, { status: 201 })
    } else {
      // Mock mode
      const db = readMockDb()
      const newReport: Report = {
        id: `report-${Date.now()}`,
        ...newReportData,
      }
      db.reports.push(newReport)

      // Trigger notifications specifically for the responsible Department Admin
      if (!db.notifications) {
        db.notifications = []
      }

      const allAdmins = db.profiles.filter((p) => p.role === 'admin')
      const targetAdmins = allAdmins.filter(
        (adm) =>
          adm.department === dept.id ||
          adm.id === `admin-${dept.id}` ||
          adm.email === dept.adminEmail ||
          adm.department === 'grievance'
      )

      const finalAdmins = targetAdmins.length > 0 ? targetAdmins : allAdmins

      finalAdmins.forEach((admin) => {
        db.notifications.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          user_id: admin.id,
          report_id: newReport.id,
          title: `[${dept.shortName}] New Issue Reported`,
          message: `A new ${categoryLabel} issue has been routed to your department: "${newReport.title}" at ${newReport.address}`,
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
