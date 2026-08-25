'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PlusCircle, MapPin, CheckCircle2, Clock, Play, ThumbsUp, ArrowRight, Star } from 'lucide-react'
import { ReportCard } from '@/components/ReportCard'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'

// Dynamically load Leaflet Map to avoid SSR errors
const MapOverview = dynamic(() => import('@/components/MapOverview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] rounded-lg bg-surface-card border border-hairline animate-pulse flex items-center justify-center">
      <span className="text-muted text-body-sm">Loading map...</span>
    </div>
  ),
})

export default function LandingPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set())
  const { t } = useLanguage()

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
        const result = await res.json()
        // Toggle upvoted state based on API response
        setUpvotedIds((prev) => {
          const next = new Set(prev)
          if (result.upvoted) {
            next.add(id)
          } else {
            next.delete(id)
          }
          return next
        })
        // Refresh report list to get updated upvote_count
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

  const checkUpvoted = (reportId: string) => {
    return upvotedIds.has(reportId)
  }

  return (
    <div className="flex flex-col w-full bg-canvas">
      {/* Hero Section: 6-6 Split */}
      <section className="relative py-[96px] px-4 md:px-6 border-b border-hairline-soft">
        <div className="container mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-bold bg-brand-accent/10 text-brand-accent border border-brand-accent/20 mb-6 shrink-0">
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('hero.badge') || 'Municipal Civic Platform'}</span>
              </span>
              <h1 className="text-display-xl text-ink mb-6">
                {t('hero.title1')} <br className="hidden md:inline" />
                <span className="text-brand-accent">{t('hero.title2')}</span>
              </h1>
              <p className="text-body-md text-body mb-8 max-w-lg leading-relaxed">
                {t('hero.desc')}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  href="/report"
                  className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('hero.btnReport')}</span>
                </Link>
                <Link
                  href="/reports"
                  className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <span>{t('hero.btnViewMap')}</span>
                  <ArrowRight className="w-4 h-4 text-brand-accent" />
                </Link>
              </div>
            </div>

            {/* Hero Right: Live Map mockup container */}
            <div className="lg:col-span-6 h-[400px] md:h-[450px] w-full bg-canvas border border-hairline rounded-xl shadow-lg p-1 relative overflow-hidden">
              <MapOverview reports={reports} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats row: 4-up grid */}
      <section className="py-8 px-4 md:px-6 bg-surface-soft border-b border-hairline-soft">
        <div className="container mx-auto max-w-[1200px]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stat Cards */}
            <div className="p-6 bg-canvas border border-hairline rounded-lg text-left shadow-sm">
              <span className="text-display-sm text-ink block">{totalCount}</span>
              <span className="text-caption text-muted block mt-1 font-semibold">{t('hero.statsTotal')}</span>
            </div>
            <div className="p-6 bg-canvas border border-hairline rounded-lg text-left shadow-sm">
              <span className="text-display-sm text-status-reported block">{pendingCount}</span>
              <span className="text-caption text-muted block mt-1 font-semibold">{t('hero.statsPending')}</span>
            </div>
            <div className="p-6 bg-canvas border border-hairline rounded-lg text-left shadow-sm">
              <span className="text-display-sm text-status-inprogress block">{progressCount}</span>
              <span className="text-caption text-muted block mt-1 font-semibold">{t('hero.statsProgress')}</span>
            </div>
            <div className="p-6 bg-canvas border border-hairline rounded-lg text-left shadow-sm">
              <span className="text-display-sm text-status-resolved block">{resolvedCount}</span>
              <span className="text-caption text-muted block mt-1 font-semibold">{t('hero.statsResolved')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials and Features Section */}
      <section className="py-[96px] px-4 md:px-6">
        <div className="container mx-auto max-w-[1200px]">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-display-lg text-ink mb-4">{t('landing.mapTitle') || 'How SheherCare Works'}</h2>
            <p className="text-body-md text-body">{t('landing.mapDesc') || 'A clean, modern approach to municipal problem-solving. Report issues directly and observe status tracking from verified departments.'}</p>
          </div>

          {/* 3-Up Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <div className="p-8 bg-surface-card rounded-lg border border-hairline-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas border border-hairline text-brand-accent mb-6">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-title-md font-bold text-ink mb-3">1. Pin Location</h3>
              <p className="text-body-md text-body leading-relaxed">
                Take a photo of the incident (pothole, streetlight, leakage) and drop a pin on our interactive map.
              </p>
            </div>
            <div className="p-8 bg-surface-card rounded-lg border border-hairline-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas border border-hairline text-status-inprogress mb-6">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-title-md font-bold text-ink mb-3">2. Track Real Progress</h3>
              <p className="text-body-md text-body leading-relaxed">
                Watch status badges shift from Reported to In Progress to Resolved as local teams address the issue.
              </p>
            </div>
            <div className="p-8 bg-surface-card rounded-lg border border-hairline-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas border border-hairline text-status-resolved mb-6">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-title-md font-bold text-ink mb-3">3. Verify Resolution</h3>
              <p className="text-body-md text-body leading-relaxed">
                Receive photo proof and closing notes from officers when maintenance crews complete the task.
              </p>
            </div>
          </div>

          {/* Citizen Testimonial Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-hairline">
            <div className="p-6 bg-surface-card rounded-lg text-left relative flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary font-bold text-xs">
                  RS
                </div>
                <div>
                  <h4 className="text-title-sm font-bold text-ink leading-none">Rakesh Sharma</h4>
                  <span className="text-caption text-muted">Citizen, Ward 42</span>
                </div>
              </div>
              <p className="text-body-md text-body italic leading-relaxed">
                "Reported a broken park light, and within 3 days the municipal crew fixed it. The photo updates kept me assured that my complaint was active."
              </p>
            </div>
            <div className="p-6 bg-surface-card rounded-lg text-left relative flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary font-bold text-xs">
                  PM
                </div>
                <div>
                  <h4 className="text-title-sm font-bold text-ink leading-none">Priya Mishra</h4>
                  <span className="text-caption text-muted">Citizen, Ward 15</span>
                </div>
              </div>
              <p className="text-body-md text-body italic leading-relaxed">
                "The split list-map catalog makes it extremely easy to see if a pothole has already been logged by my neighbors, allowing us to upvote instead of duplicate."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Submissions Section */}
      <section className="py-[96px] px-4 md:px-6 bg-surface-soft border-t border-hairline-soft">
        <div className="container mx-auto max-w-[1200px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-display-md text-ink font-semibold">{t('landing.recentLogs')}</h2>
              <p className="text-body-md text-body mt-1">{t('landing.recentSub')}</p>
            </div>
            <Link
              href="/reports"
              className="text-caption font-bold text-brand-accent hover:underline flex items-center gap-1.5 shrink-0"
            >
              <span>{t('landing.viewCatalog')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="w-full h-40 rounded-lg bg-canvas border border-hairline animate-pulse"
                />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 rounded-lg border border-dashed border-hairline bg-canvas">
              <p className="text-muted text-body-sm">{t('landing.noIssuesYet')}</p>
              <Link
                href="/report"
                className="mt-4 inline-flex btn-primary"
              >
                {t('landing.beFirst')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
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

      {/* Pre-footer CTA Band */}
      <section className="py-[96px] px-4 md:px-6 bg-canvas">
        <div className="container mx-auto max-w-[1200px]">
          <div className="p-12 bg-surface-card rounded-lg text-center border border-hairline-soft max-w-4xl mx-auto">
            <h2 className="text-display-sm text-ink mb-3">See something in your neighborhood?</h2>
            <p className="text-body-md text-body mb-8 max-w-xl mx-auto">
              Help your local ward maintain roads, streetlights, and utilities. Report issues and track their progress until resolution.
            </p>
            <Link href="/report" className="btn-primary">
              Report an Issue
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
