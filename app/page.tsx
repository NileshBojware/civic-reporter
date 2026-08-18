'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PlusCircle, MapPin, CheckCircle, Flame, ShieldAlert, ChevronRight } from 'lucide-react'
import { ReportCard } from '@/components/ReportCard'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

// Dynamically load Leaflet Map to avoid SSR errors
const MapOverview = dynamic(() => import('@/components/MapOverview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] rounded-3xl bg-zinc-900/60 border border-zinc-800 animate-pulse flex items-center justify-center">
      <span className="text-zinc-500 text-sm">Loading Live Map...</span>
    </div>
  ),
})

export default function LandingPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Fetch reports on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/reports')
        if (res.ok) {
          const data = await res.json()
          setReports(data)
        }
      } catch (err) {
        console.error('Failed to load reports', err)
      } finally {
        setLoading(false)
      }
    }

    const checkUser = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession()
        setUser(data.session?.user || null)
      } else {
        const mockUser = localStorage.getItem('civic_reporter_user')
        if (mockUser) {
          setUser(JSON.parse(mockUser))
        }
      }
    }

    fetchData()
    checkUser()
  }, [])

  // Calculate stats
  const totalCount = reports.length
  const pendingCount = reports.filter((r) => r.status === 'pending').length
  const progressCount = reports.filter((r) => r.status === 'in_progress').length
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length

  const handleUpvote = async (id: string) => {
    if (!user) {
      alert('Please log in to upvote reports.')
      return
    }

    try {
      const res = await fetch(`/api/reports/${id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      })

      if (res.ok) {
        // Refresh local data
        const updated = await fetch('/api/reports')
        if (updated.ok) {
          const data = await updated.json()
          setReports(data)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Pre-determine which ones are upvoted by this user
  // (In mock mode or Supabase, check local list)
  const checkUpvoted = (reportId: string) => {
    if (!user) return false
    // For simplicity, we fetch matching votes if needed, but in mock mode we can read report_votes from API if desired.
    // As a simple shortcut, let's keep track of upvotes locally in localStorage if needed or just let it update on response.
    return false
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl text-center flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-6 animate-pulse">
            <Flame className="w-3.5 h-3.5" />
            Empowering Citizen Action
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-tight">
            Report Civic Problems. <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Track Solutions in Real Time.
            </span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mb-10 leading-relaxed">
            Help improve your municipality. Report potholes, broken streetlights, leakage, or trash piles with photos and location pins. Get status updates instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/report"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Report a New Issue</span>
            </Link>
            <Link
              href="/reports"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 font-bold transition-all duration-200"
            >
              <span>View Live Map</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Widgets */}
      <section className="py-6 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl glass-panel relative overflow-hidden">
            {/* Absolute accent border */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            
            <div className="text-center p-4 border-r border-zinc-800/60 last:border-0 md:block">
              <span className="text-2xl md:text-4xl font-extrabold text-zinc-100">{totalCount}</span>
              <span className="text-xs text-zinc-400 block mt-1 font-semibold">Total Reports</span>
            </div>
            <div className="text-center p-4 border-r border-zinc-800/60 last:border-0">
              <span className="text-2xl md:text-4xl font-extrabold text-amber-500">{pendingCount}</span>
              <span className="text-xs text-zinc-400 block mt-1 font-semibold">Pending Review</span>
            </div>
            <div className="text-center p-4 border-r border-zinc-800/60 last:border-0">
              <span className="text-2xl md:text-4xl font-extrabold text-blue-500">{progressCount}</span>
              <span className="text-xs text-zinc-400 block mt-1 font-semibold">In Progress</span>
            </div>
            <div className="text-center p-4 last:border-0">
              <span className="text-2xl md:text-4xl font-extrabold text-emerald-500">{resolvedCount}</span>
              <span className="text-xs text-zinc-400 block mt-1 font-semibold">Resolved</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Map Explanation Info */}
            <div className="lg:col-span-4 space-y-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                Live Issues in <br />
                Your Community
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Explore local issues pinned on the map. If you notice a report that affects you, upvote it to increase its priority for municipal authorities.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-zinc-950 animate-pulse" />
                  <span className="text-xs text-zinc-300 font-semibold">Pending Inspection</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-zinc-950 animate-pulse" />
                  <span className="text-xs text-zinc-300 font-semibold">In Progress (Work Assigned)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-pulse" />
                  <span className="text-xs text-zinc-300 font-semibold">Resolved & Verified</span>
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="lg:col-span-8 h-[400px]">
              <MapOverview reports={reports} />
            </div>
          </div>
        </div>
      </section>

      {/* Recent Submissions Section */}
      <section className="py-16 px-4 md:px-6 bg-zinc-950/40 border-t border-zinc-900/60">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">Recent Issue Logs</h2>
              <p className="text-zinc-400 text-xs md:text-sm mt-1">Directly reported by local residents</p>
            </div>
            <Link
              href="/reports"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1.5"
            >
              <span>View Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="w-full h-80 rounded-3xl bg-zinc-900/60 border border-zinc-800 animate-pulse"
                />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-zinc-800">
              <p className="text-zinc-500 text-sm">No civic issues have been reported yet.</p>
              <Link
                href="/report"
                className="mt-4 inline-flex text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl"
              >
                Be the first to report
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reports.slice(0, 3).map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onUpvote={handleUpvote}
                  isUpvoted={checkUpvoted(report.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
