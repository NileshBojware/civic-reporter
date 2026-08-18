'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Calendar, MapPin, ThumbsUp, CheckCircle, HelpCircle, XCircle, AlertCircle } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import confetti from 'canvas-confetti'

// Dynamically load the Leaflet Map
const MapOverview = dynamic(() => import('@/components/MapOverview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center">
      <span className="text-zinc-500 text-sm">Loading map location...</span>
    </div>
  ),
})

const CATEGORY_LABELS: Record<string, string> = {
  road_damage: '🛣️ Road Damage',
  garbage: '🗑️ Garbage Pile',
  water_leakage: '💧 Water Leakage',
  drainage: '🌊 Drainage / Waterlogging',
  streetlight: '💡 Streetlight',
  other: '📌 Other Civic Issue',
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [upvoted, setUpvoted] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReportDetails = async () => {
    try {
      const res = await fetch(`/api/reports/${id}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      } else {
        router.push('/reports')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportDetails()

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
    checkUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleUpvote = async () => {
    if (!user) {
      alert('Please log in to upvote.')
      return
    }

    try {
      const res = await fetch(`/api/reports/${id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      })

      if (res.ok) {
        setUpvoted(!upvoted)
        fetchReportDetails()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Author confirms issue is fixed
  const handleCitizenConfirmation = async (confirmed: boolean) => {
    setActionLoading(true)
    try {
      const newStatus = confirmed ? 'resolved' : 'in_progress'
      const note = confirmed
        ? 'Citizen confirmed: Issue has been resolved!'
        : 'Citizen flag: Re-opened because issue is still not resolved.'

      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolved_note: note,
          resolved_image_url: report.resolved_image_url,
        }),
      })

      if (res.ok) {
        if (confirmed) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
          alert('Thank you for confirming!')
        } else {
          alert('Issue re-opened. Field crews will review it shortly.')
        }
        fetchReportDetails()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (!report) return null

  // Timeline Steps Helpers
  const timelineSteps = [
    { label: 'Pending Verification', key: 'pending', done: true },
    { label: 'In Progress (Active Crew)', key: 'in_progress', done: report.status !== 'pending' && report.status !== 'rejected' },
    { label: 'Resolved / Finished', key: 'resolved', done: report.status === 'resolved' },
  ]

  const isAuthor = user && report.user_id === user.id

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Photo Comparisons and Description */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 md:p-8 rounded-3xl glass-panel relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                {CATEGORY_LABELS[report.category] || report.category}
              </span>
              <StatusBadge status={report.status} />
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-white leading-snug mb-4">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 border-b border-zinc-900 pb-4 mb-6">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>Logged: {new Date(report.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="truncate max-w-[200px]">{report.address}</span>
              </div>
            </div>

            <h3 className="text-xs font-bold text-zinc-300 uppercase mb-2">Original Description</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              {report.description || 'No description provided.'}
            </p>

            {/* Evidence Comparison Slider or Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase">Evidence Log</h3>
              
              {report.status === 'resolved' && report.resolved_image_url ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before Evidence */}
                  <div className="rounded-2xl border border-zinc-850 overflow-hidden bg-zinc-950">
                    <div className="px-4 py-2 border-b border-zinc-850 bg-zinc-900/50 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-amber-500 uppercase">Before</span>
                      <span className="text-[9px] text-zinc-500">Report Photo</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={report.image_url}
                      alt="Before evidence"
                      className="w-full h-44 object-cover"
                    />
                  </div>
                  
                  {/* After Evidence */}
                  <div className="rounded-2xl border border-emerald-500/20 overflow-hidden bg-zinc-950">
                    <div className="px-4 py-2 border-b border-emerald-500/10 bg-emerald-500/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-450 uppercase">After (Resolved)</span>
                      <span className="text-[9px] text-emerald-500">Fix Evidence</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={report.resolved_image_url}
                      alt="Resolution evidence"
                      className="w-full h-44 object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-850 overflow-hidden bg-zinc-950">
                  <div className="px-4 py-2 border-b border-zinc-850 bg-zinc-900/50 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-purple-400 uppercase">Evidence Image</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.image_url}
                    alt="Evidence Photo"
                    className="w-full max-h-80 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Resolution Details */}
            {report.status === 'resolved' && (
              <div className="mt-8 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Resolution Work Report
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  {report.resolved_note || 'The issue has been completed.'}
                </p>
                
                {/* Citizen Checkback Loop */}
                {isAuthor && (
                  <div className="pt-4 border-t border-zinc-800/40 mt-4">
                    <p className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      Did municipal crews fix this correctly?
                    </p>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleCitizenConfirmation(true)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition disabled:opacity-50"
                      >
                        Yes, Confirm Fixed
                      </button>
                      <button
                        onClick={() => handleCitizenConfirmation(false)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-750 text-[11px] font-bold transition disabled:opacity-50"
                      >
                        No, Still Broken
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rejection Details */}
            {report.status === 'rejected' && (
              <div className="mt-8 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2.5">
                <h4 className="text-xs font-bold text-rose-450 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  Inspection Rejection
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Reason: {report.rejection_reason || 'Could not verify issue.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map location & Upvotes panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Exact Coordinates Map Pin */}
          <div className="p-5 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Map Coordinates</h3>
            <div className="h-[200px]">
              <MapOverview reports={[report]} zoom={15} />
            </div>
            <p className="text-[10px] text-zinc-500 leading-normal font-mono text-center">
              Lat: {report.latitude.toFixed(6)}, Lng: {report.longitude.toFixed(6)}
            </p>
          </div>

          {/* Upvotes Card */}
          <div className="p-5 rounded-3xl glass-panel space-y-4 text-center">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Community Priority</h3>
            <div className="text-3xl font-extrabold text-zinc-100">{report.upvote_count}</div>
            <span className="text-[10px] text-zinc-500 block">citizens upvoted this ticket</span>
            
            <button
              onClick={handleUpvote}
              className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                upvoted
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-purple-400 text-purple-400' : ''}`} />
              <span>{upvoted ? 'Upvoted!' : 'Upvote This Issue'}</span>
            </button>
          </div>

          {/* Status Timeline */}
          <div className="p-5 rounded-3xl glass-panel space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status Timeline</h3>
            <div className="space-y-4 relative pl-4 border-l border-zinc-800">
              {report.status === 'rejected' ? (
                <>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    <div className="text-xs text-zinc-500 font-semibold">Submitted Ticket</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-zinc-950" />
                    <div className="text-xs text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Rejected
                    </div>
                  </div>
                </>
              ) : (
                timelineSteps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border transition ${
                        step.done
                          ? 'bg-purple-500 border-purple-500'
                          : 'bg-zinc-950 border-zinc-850'
                      }`}
                    />
                    <div
                      className={`text-xs font-semibold ${
                        step.done ? 'text-zinc-200' : 'text-zinc-500'
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
