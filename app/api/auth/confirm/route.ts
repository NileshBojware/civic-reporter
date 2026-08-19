import { NextResponse } from 'next/server'
import { isSupabaseServerConfigured, supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!isSupabaseServerConfigured || !supabaseServer) {
      return NextResponse.json(
        { error: 'Supabase Server client is not configured' },
        { status: 500 }
      )
    }

    // Get the user by listing users and finding the matching email
    const { data, error: listError } = await supabaseServer.auth.admin.listUsers()
    if (listError) throw listError

    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      return NextResponse.json({ error: 'User not found in authentication records' }, { status: 404 })
    }

    // Confirm the email for this user
    const { error: updateError } = await supabaseServer.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    )
    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: 'Email confirmed successfully' })
  } catch (error: any) {
    console.error('Error confirming email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm email' },
      { status: 500 }
    )
  }
}
