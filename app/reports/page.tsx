'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Filter, Map, List, RefreshCw } from 'lucide-react'
import { ReportCard } from '@/components/ReportCard'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'

// Dynamically load the Leaflet Map
const MapOverview = dynamic(() => import('@/components/MapOverview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] rounded-3xl bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center">
      <span className="text-zinc-500 text-sm">Loading...</span>
    </div>
  ),
})

const CATEGORIES = [
  { value: 'all' },
  { value: 'road_damage' },
  { value: 'garbage' },
  { value: 'water_leakage' },
  { value: 'drainage' },
  { value: 'streetlight' },
  { value: 'other' },
]

const STATUSES = [
  { value: 'all' },
  { value: 'pending' },
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
    const categoryMatch = selectedCategory === 'all' || r.category === selectedCategory
    const statusMatch = selectedStatus === 'all' || r.status === selectedStatus
    return categoryMatch && statusMatch
  })

  return (
    <div className="flex-grow flex flex-col h-[calc(100vh-4rem)]">
      {/* Top filter toolbar */}
      <div className="w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-zinc-200">{t('catalog.filters')}</h2>
        </div>

        <div className="flex items-center gap-3 flex-grow md:flex-grow-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-semibold focus:outline-none focus:border-purple-500 flex-grow md:flex-grow-0 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-zinc-900">
                {c.value === 'all' ? t('catalog.allCategories') : t('category.' + c.value)}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-semibold focus:outline-none focus:border-purple-500 flex-grow md:flex-grow-0 cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-zinc-900">
                {s.value === 'all' ? t('catalog.allStatuses') : t('status.' + s.value)}
              </option>
            ))}
          </select>

          <button
            onClick={fetchReports}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition cursor-pointer"
            title={t('catalog.refresh')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile View Toggle Buttons */}
        <div className="flex md:hidden bg-zinc-900 p-0.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg flex items-center justify-center cursor-pointer ${
              viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-zinc-400'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg flex items-center justify-center cursor-pointer ${
              viewMode === 'map' ? 'bg-purple-600 text-white' : 'text-zinc-400'
            }`}
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="flex-grow flex relative overflow-hidden">
        {/* Left Side: Scrollable Issue Cards list */}
        <div
          className={`w-full md:w-[450px] lg:w-[500px] border-r border-zinc-900 bg-zinc-950/40 p-4 md:p-6 overflow-y-auto flex-shrink-0 h-full ${
            viewMode === 'map' ? 'hidden md:block' : 'block'
          }`}
        >
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="w-full h-48 rounded-3xl bg-zinc-900 border border-zinc-850 animate-pulse"
                />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-850 rounded-3xl">
              <p className="text-zinc-500 text-sm">{t('catalog.noMatches')}</p>
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

        {/* Right Side: OSM interactive map view */}
        <div
          className={`flex-grow h-full relative ${
            viewMode === 'list' ? 'hidden md:block' : 'block'
          }`}
        >
          <MapOverview reports={filteredReports} />
        </div>
      </div>
    </div>
  )
}
