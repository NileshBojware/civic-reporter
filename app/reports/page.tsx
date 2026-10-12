'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Filter, RefreshCw, Layers } from 'lucide-react'
import { ReportCard } from '@/components/ReportCard'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'

// Dynamically load the Leaflet Map
const MapOverview = dynamic(() => import('@/components/MapOverview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] rounded-lg bg-surface-card border border-hairline animate-pulse flex items-center justify-center">
      <span className="text-muted text-body-sm">Loading map...</span>
    </div>
  ),
})

import { CIVIC_CATEGORIES, normalizeCategoryKey } from '@/lib/categories'

const CATEGORIES = [
  { value: 'all' },
  ...CIVIC_CATEGORIES.map((c) => ({ value: c.id, icon: c.icon, label: c.label })),
]

const STATUSES = [
  { value: 'all' },
  { value: 'pending' },
  { value: 'verified' },
  { value: 'in_progress' },
  { value: 'resolved' },
  { value: 'rejected' },
]

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { t } = useLanguage()

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list') // For mobile screens

  // Fetch reports on mount
  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Read query parameters from URL (e.g. ?status=pending)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const statusParam = params.get('status')
      const catParam = params.get('category')
      if (statusParam && STATUSES.some((s) => s.value === statusParam)) {
        setSelectedStatus(statusParam)
      }
      if (catParam && CATEGORIES.some((c) => c.value === catParam)) {
        setSelectedCategory(catParam)
      }
    }

    fetchReports()

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
  }, [])

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

  // Filter logic
  const filteredReports = reports.filter((r) => {
    const normR = normalizeCategoryKey(r.category)
    const normSelected = normalizeCategoryKey(selectedCategory)
    const categoryMatch =
      selectedCategory === 'all' ||
      r.category === selectedCategory ||
      normR === normSelected

    const statusMatch = selectedStatus === 'all' || r.status === selectedStatus
    return categoryMatch && statusMatch
  })

  return (
    <div className="flex-grow flex flex-col h-[calc(100vh-4rem)] bg-canvas">
      {/* Top filter toolbar */}
      <div className="w-full border-b border-hairline bg-canvas/80 backdrop-blur px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-accent" />
          <h2 className="text-body-sm font-bold text-ink">{t('catalog.filters')}</h2>
        </div>

        <div className="flex items-center gap-3 flex-grow md:flex-grow-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-md bg-canvas border border-hairline text-caption text-body font-semibold focus:outline-none focus:border-primary flex-grow md:flex-grow-0 cursor-pointer h-10"
          >
            {CATEGORIES.map((c: any) => (
              <option key={c.value} value={c.value}>
                {c.value === 'all'
                  ? t('catalog.allCategories')
                  : t('category.' + c.value)}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-md bg-canvas border border-hairline text-caption text-body font-semibold focus:outline-none focus:border-primary flex-grow md:flex-grow-0 cursor-pointer h-10"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.value === 'all' ? t('catalog.allStatuses') : t('status.' + s.value)}
              </option>
            ))}
          </select>

          <button
            onClick={fetchReports}
            className="p-2.5 bg-canvas hover:bg-surface-soft border border-hairline text-body hover:text-ink rounded-md transition cursor-pointer h-10 w-10 flex items-center justify-center"
            title={t('catalog.refresh')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile View Segmented Toggle (nav-pill-group) */}
        <div className="flex md:hidden bg-surface-soft p-1 rounded-pill border border-hairline">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-pill text-caption font-bold transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-body'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-1.5 rounded-pill text-caption font-bold transition-all cursor-pointer ${
              viewMode === 'map' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-body'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="flex-grow flex relative overflow-hidden h-full">
        {/* Left Side: Scrollable Issue Cards list */}
        <div
          className={`w-full md:w-[500px] lg:w-[560px] xl:w-[620px] border-r border-hairline bg-surface-soft/40 p-4 md:p-6 overflow-y-auto flex-shrink-0 h-full custom-scrollbar ${
            viewMode === 'map' ? 'hidden md:block' : 'block'
          }`}
        >
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="w-full h-44 rounded-lg bg-canvas border border-hairline animate-pulse"
                />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-hairline rounded-lg bg-canvas">
              <p className="text-muted text-body-sm">{t('catalog.noMatches')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onUpvote={handleUpvote}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Map view with reduced size and comfortable scroll margins */}
        <div
          className={`flex-grow h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center bg-slate-50/60 dark:bg-[#070a12]/60 ${
            viewMode === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Framed Map Card with reduced dimensions */}
          <div className="w-full max-w-[780px] h-[360px] sm:h-[440px] md:h-[500px] lg:h-[540px] max-h-[calc(100vh-13rem)] rounded-2xl overflow-hidden shadow-md border border-hairline relative bg-surface-card">
            <MapOverview reports={filteredReports} autoFitBounds={true} scrollWheelZoom={false} />
          </div>

          {/* Quick helpful guidance note */}
          <div className="mt-2.5 text-center text-[11px] text-muted flex items-center justify-center gap-1.5 select-none pointer-events-none">
            <span>Use +/- or double-click to zoom • Surrounding space allows smooth page scrolling</span>
          </div>
        </div>
      </div>
    </div>
  )
}
