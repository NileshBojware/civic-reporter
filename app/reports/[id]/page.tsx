'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Calendar, MapPin, ThumbsUp, CheckCircle, HelpCircle, XCircle, AlertCircle } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import confetti from 'canvas-confetti'
import { useLanguage } from '@/lib/LanguageContext'

// Dynamically load the Leaflet Map
const MapOverview = dynamic(() => import('@/components/MapOverview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] rounded-lg bg-surface-card border border-hairline animate-pulse flex items-center justify-center">
      <span className="text-muted text-body-sm">Loading map...</span>
    </div>
  ),
})

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { t, language } = useLanguage()

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
            colors: ['#10b981', '#2563eb', '#111111']
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
      <div className="flex-grow flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!report) return null

  const isAuthor = user && report.user_id === user.id

  // Category dynamic styles helper
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'garbage':
        return 'text-category-waste bg-category-waste/10 border-category-waste/20'
      case 'water_leakage':
        return 'text-category-water bg-category-water/10 border-category-water/20'
      case 'drainage':
        return 'text-category-drainage bg-category-drainage/10 border-category-drainage/20'
      case 'road_damage':
        return 'text-category-waste bg-category-waste/10 border-category-waste/20'
      case 'streetlight':
        return 'text-category-water bg-category-water/10 border-category-water/20'
      default:
        return 'text-muted bg-surface-card border-hairline'
    }
  }

  // Get status color representation for timeline
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-status-reported'
      case 'in_progress': return 'bg-status-inprogress'
      case 'resolved': return 'bg-status-resolved'
      case 'rejected': return 'bg-status-rejected'
      default: return 'bg-muted-soft'
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16 bg-canvas text-body">
      {/* Back button link */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-muted hover:text-ink mb-6 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('detail.btnBackCatalog')}</span>
      </Link>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Photo Comparisons and Description */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 md:p-8 rounded-lg bg-canvas border border-hairline shadow-sm relative overflow-hidden">
            
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-pill text-caption font-semibold border ${getCategoryStyles(report.category)}`}>
                {t('category.' + report.category)}
              </span>
              <StatusBadge status={report.status} />
            </div>

            <h1 className="text-title-lg font-bold text-ink leading-snug mb-4">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-caption text-muted border-b border-hairline-soft pb-4 mb-6">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted" />
                <span>{t('card.reportedOn')}: {new Date(report.created_at).toLocaleString(language === 'en' ? 'en-US' : language)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-accent" />
                <span className="truncate max-w-[220px]">{report.address}</span>
              </div>
            </div>

            <h3 className="text-caption font-bold text-ink uppercase mb-2">Description</h3>
            <p className="text-body-md text-body leading-relaxed mb-6">
              {report.description || 'No description provided.'}
            </p>

            {/* Evidence Comparison Grid */}
            <div className="space-y-4">
              <h3 className="text-caption font-bold text-ink uppercase mb-3">Evidence Log</h3>
              
              {report.status === 'resolved' && report.resolved_image_url ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before Evidence */}
                  <div className="rounded-lg border border-hairline overflow-hidden bg-surface-card">
                    <div className="px-4 py-2 border-b border-hairline-soft bg-surface-soft flex justify-between items-center">
                      <span className="text-[10px] font-bold text-status-reported uppercase">Before</span>
                      <span className="text-[9px] text-muted">Report Photo</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={report.image_url}
                      alt="Before evidence"
                      className="w-full h-44 object-cover"
                    />
                  </div>
                  
                  {/* After Evidence */}
                  <div className="rounded-lg border border-status-resolved/20 overflow-hidden bg-surface-card">
                    <div className="px-4 py-2 border-b border-status-resolved/10 bg-status-resolved/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-status-resolved uppercase">After (Resolved)</span>
                      <span className="text-[9px] text-status-resolved">Fix Evidence</span>
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
                <div className="rounded-lg border border-hairline overflow-hidden bg-surface-card">
                  <div className="px-4 py-2 border-b border-hairline-soft bg-surface-soft flex justify-between items-center">
                    <span className="text-[10px] font-bold text-primary uppercase">Evidence Photo</span>
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

            {/* Resolution Details Banner */}
            {report.status === 'resolved' && (
              <div className="mt-8 p-5 rounded-lg bg-status-resolved/5 border border-status-resolved/20 space-y-3">
                <h4 className="text-body-sm font-bold text-status-resolved uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Resolution Work Report
                </h4>
                <p className="text-body-sm text-body leading-relaxed font-mono bg-canvas p-3 border border-hairline rounded-md">
                  {report.resolved_note || 'The issue has been completed.'}
                </p>
                
                {/* Citizen Checkback Loop */}
                {isAuthor && (
                  <div className="pt-4 border-t border-hairline-soft mt-4">
                    <p className="text-caption font-bold text-ink mb-3 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-brand-accent" />
                      Did municipal crews fix this correctly?
                    </p>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleCitizenConfirmation(true)}
                        disabled={actionLoading}
                        className="btn-primary h-9 py-1 px-4 text-caption"
                      >
                        Yes, Confirm Fixed
                      </button>
                      <button
                        onClick={() => handleCitizenConfirmation(false)}
                        disabled={actionLoading}
                        className="btn-secondary h-9 py-1 px-4 text-caption"
                      >
                        No, Still Broken
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rejection Details Banner */}
            {report.status === 'rejected' && (
              <div className="mt-8 p-5 rounded-lg bg-status-rejected/5 border border-status-rejected/20 space-y-3">
                <h4 className="text-body-sm font-bold text-status-rejected uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  Inspection Rejection
                </h4>
                <p className="text-body-sm text-body leading-relaxed font-mono bg-canvas p-3 border border-hairline rounded-md">
                  Reason: {report.rejection_reason || 'Could not verify issue.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map location & Upvotes panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coordinates Map Pin */}
          <div className="p-5 rounded-lg bg-canvas border border-hairline shadow-sm space-y-4">
            <h3 className="text-caption font-bold text-ink uppercase tracking-wider">Location Pin</h3>
            <div className="h-[200px] rounded-lg overflow-hidden border border-hairline">
              <MapOverview reports={[report]} zoom={15} />
            </div>
            <p className="text-[10px] text-muted leading-normal font-mono text-center">
              Lat: {report.latitude.toFixed(6)}, Lng: {report.longitude.toFixed(6)}
            </p>
          </div>

          {/* Upvotes priority Card */}
          <div className="p-5 rounded-lg bg-canvas border border-hairline shadow-sm space-y-4 text-center">
            <h3 className="text-caption font-bold text-muted uppercase tracking-wider">Community Priority</h3>
            <div className="text-display-sm text-ink block font-bold">{report.upvote_count}</div>
            <span className="text-[10px] text-muted block -mt-2">{t('card.upvotes')}</span>
            
            <button
              onClick={handleUpvote}
              className={`w-full py-2.5 h-10 rounded-md text-caption font-bold flex items-center justify-center gap-2 border transition duration-150 cursor-pointer ${
                upvoted
                  ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20 hover:bg-brand-accent/15'
                  : 'btn-secondary'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-brand-accent text-brand-accent' : ''}`} />
              <span>{upvoted ? 'Upvoted!' : 'Upvote This Issue'}</span>
            </button>
          </div>

          {/* Status Timeline */}
          <div className="p-5 rounded-lg bg-canvas border border-hairline shadow-sm space-y-5">
            <h3 className="text-caption font-bold text-muted uppercase tracking-wider">Status Timeline</h3>
            <div className="space-y-4 relative pl-4 border-l border-hairline">
              {report.status === 'rejected' ? (
                <>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-status-reported border border-canvas" />
                    <div className="text-caption text-ink font-semibold">Reported Issue</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-status-rejected border border-canvas animate-pulse" />
                    <div className="text-caption text-status-rejected font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Rejected
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 1: Reported */}
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-status-reported border border-canvas" />
                    <div className="text-caption text-ink font-semibold">{t('status.pending')}</div>
                  </div>

                  {/* Step 2: Verified */}
                  <div className="relative">
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-canvas ${
                      ['verified', 'in_progress', 'resolved'].includes(report.status)
                        ? 'bg-status-verified' + (report.status === 'verified' ? ' animate-pulse' : '')
                        : 'bg-muted-soft'
                    }`} />
                    <div className={`text-caption font-semibold ${
                      ['verified', 'in_progress', 'resolved'].includes(report.status) ? 'text-ink' : 'text-muted-soft font-medium'
                    }`}>
                      {t('status.verified')}
                    </div>
                  </div>

                  {/* Step 3: In Progress */}
                  <div className="relative">
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-canvas ${
                      ['in_progress', 'resolved'].includes(report.status)
                        ? 'bg-status-inprogress' + (report.status === 'in_progress' ? ' animate-pulse' : '')
                        : 'bg-muted-soft'
                    }`} />
                    <div className={`text-caption font-semibold ${
                      ['in_progress', 'resolved'].includes(report.status) ? 'text-ink' : 'text-muted-soft font-medium'
                    }`}>
                      {t('status.in_progress')}
                    </div>
                  </div>

                  {/* Step 4: Resolved */}
                  <div className="relative">
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-canvas ${
                      report.status === 'resolved'
                        ? 'bg-status-resolved animate-pulse'
                        : 'bg-muted-soft'
                    }`} />
                    <div className={`text-caption font-semibold ${
                      report.status === 'resolved' ? 'text-ink font-semibold' : 'text-muted-soft font-medium'
                    }`}>
                      {t('status.resolved')}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
