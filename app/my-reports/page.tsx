'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Info, Calendar, MapPin, ArrowRight, Clipboard } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { StatusBadge } from '@/components/StatusBadge'

export default function MyReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchMyReports = async () => {
      let currentUser: any = null

      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession()
        currentUser = data.session?.user || null
      } else {
        const mockUser = localStorage.getItem('civic_reporter_user')
        if (mockUser) {
          currentUser = JSON.parse(mockUser)
        }
      }

      setUser(currentUser)

      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/reports')
        if (res.ok) {
          const allReports = await res.json()
          // Filter to only those submitted by this user
          const myReports = allReports.filter((r: any) => r.user_id === currentUser.id)
          setReports(myReports)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchMyReports()
  }, [])

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md p-8 rounded-3xl glass-panel text-center">
          <Info className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Please log in to view your logged civic issue reports.
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-2xl block text-center"
          >
            Log In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">My Submissions</h1>
          <p className="text-zinc-400 text-sm mt-1">Track and manage your submitted issue reports.</p>
        </div>
        <Link
          href="/report"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Another Issue</span>
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-850 rounded-3xl space-y-4">
          <Clipboard className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 text-sm">You haven't submitted any civic issue reports yet.</p>
          <p className="text-xs text-zinc-650">Help improve your locality by reporting problems you see.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 md:p-6 rounded-2xl bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex gap-4 items-start md:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={report.image_url}
                  alt={report.title}
                  className="w-16 h-16 rounded-xl object-cover border border-zinc-850 shrink-0"
                />
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 mb-1 leading-snug line-clamp-1">
                    {report.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-550">
                    <span className="font-semibold text-purple-400">
                      {report.category.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-zinc-700">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                      <span className="truncate max-w-[200px]">{report.address}</span>
                    </span>
                    <span className="text-zinc-700">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t border-zinc-900/60 md:border-0">
                <StatusBadge status={report.status} />
                <Link
                  href={`/reports/${report.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <span>Track Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
