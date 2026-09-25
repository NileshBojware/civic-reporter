'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  PlusCircle, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ThumbsUp, 
  ArrowRight, 
  Camera, 
  FileText, 
  Users, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Map as MapIcon 
} from 'lucide-react'
import { ReportCard } from '@/components/ReportCard'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/lib/LanguageContext'

// Dynamically load Leaflet Map to avoid SSR errors
const MapOverview = dynamic(() => import('@/components/MapOverview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-2xl bg-surface-card border border-hairline animate-pulse flex items-center justify-center">
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
      {/* Hero Section with Vibrant Animated City Panorama Background */}
      <section className="relative pt-10 pb-20 md:pt-14 md:pb-28 px-4 md:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Animated Background Panorama Layer - Daylight in Light Mode */}
        <div 
          className="absolute inset-0 z-0 animate-panorama-slow pointer-events-none opacity-100 transition-opacity duration-700 dark:opacity-0"
          style={{
            backgroundImage: `url('/images/hero-bg.png')`,
          }}
        />
        {/* Animated Background Panorama Layer - Starlit Night in Dark Mode */}
        <div 
          className="absolute inset-0 z-0 animate-panorama-slow pointer-events-none opacity-0 transition-opacity duration-700 dark:opacity-100"
          style={{
            backgroundImage: `url('/images/hero-bg-dark.png')`,
          }}
        />
        {/* Crisp Whitish in Light Mode & Atmospheric Starlit Overlays in Dark Mode */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/92 via-white/70 to-white/35 dark:from-[#070a12]/92 dark:via-[#070a12]/75 dark:to-[#070a12]/40 transition-colors duration-700 pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/40 via-transparent to-white/90 dark:from-transparent dark:to-[#070a12] transition-colors duration-700 pointer-events-none" />

        <div className="container mx-auto max-w-[1240px] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/95 dark:bg-[#0c1222]/95 text-blue-600 dark:text-blue-400 border border-blue-200/90 dark:border-blue-900/50 mb-5 shrink-0 shadow-xs backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t('hero.badge') || 'Empowering Citizen Action'}</span>
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-5">
                Report Civic <br className="hidden sm:inline" />
                Problems. <br />
                <span className="text-blue-600 dark:text-blue-400">Track Solutions in Real Time.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-lg leading-relaxed font-normal">
                {t('hero.desc') || 'Help improve your municipality. Report potholes, broken streetlights, leakage, or trash piles with photos and location pins. Get status updates instantly.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto mb-8">
                <Link
                  href="/report"
                  className="px-6 py-3.5 rounded-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('hero.btnReport') || 'Report a New Issue'}</span>
                </Link>
                <Link
                  href="/reports"
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 dark:bg-[#0c1222] dark:hover:bg-[#141d36] text-slate-800 dark:text-white font-semibold text-sm flex items-center justify-center gap-2 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <MapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{t('hero.btnViewMap') || 'View Map'}</span>
                  <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </Link>
              </div>

              {/* 4 Quick Process Mini Pills - Light in Light Mode, Black in Dark Mode */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-2xl">
                <Link
                  href="/report"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-slate-50/80 dark:bg-[#0c1222] dark:hover:bg-[#121a30] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#151f38] group-hover:bg-blue-600 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight whitespace-nowrap">Add Photo</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap">Show the issue</div>
                  </div>
                </Link>

                <Link
                  href="/report"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-slate-50/80 dark:bg-[#0c1222] dark:hover:bg-[#121a30] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#151f38] group-hover:bg-blue-600 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight whitespace-nowrap">Add Location</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap">Pin on map</div>
                  </div>
                </Link>

                <Link
                  href="/reports"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-slate-50/80 dark:bg-[#0c1222] dark:hover:bg-[#121a30] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#151f38] group-hover:bg-blue-600 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight whitespace-nowrap">Track Progress</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap">Real-time updates</div>
                  </div>
                </Link>

                <Link
                  href="/reports"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white hover:bg-slate-50/80 dark:bg-[#0c1222] dark:hover:bg-[#121a30] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#151f38] group-hover:bg-blue-600 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight whitespace-nowrap">Stronger City</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap">Together we build</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Hero Right: Live Map container */}
            <div className="lg:col-span-6 relative">
              <div className="h-[400px] md:h-[460px] w-full bg-white dark:bg-[#0c1222] p-2 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 relative overflow-hidden">
                <MapOverview reports={reports} center={[19.8762, 75.3433]} zoom={13} />

                {/* Floating Map Area Badge */}
                <Link
                  href="/reports"
                  className="absolute bottom-4 left-4 z-[400] bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-slate-200/90 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 hover:bg-white dark:hover:bg-[#0c1222] transition-all hover:scale-105"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{reports.length > 0 ? `${reports.length} reports in this area` : '14 reports in this area'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Stats row: 4 Sparkline metric cards (White in Light Mode, Black in Dark Mode) */}
      <section className="-mt-8 md:-mt-12 mb-8 px-4 md:px-6 relative z-20">
        <div className="container mx-auto max-w-[1240px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat Card 1: Total Reports */}
            <Link
              href="/reports"
              className="p-5 bg-white dark:bg-[#0c1222] dark:hover:bg-[#121a30] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 active:translate-y-0 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-[#151f38] group-hover:bg-blue-100 dark:group-hover:bg-[#1c2a4c] text-blue-600 dark:text-blue-400 transition-colors flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                      {totalCount > 0 ? totalCount : 14}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
                      {t('hero.statsTotal') || 'Total Reports'}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/80 dark:border-emerald-900/50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" /> +12%
                </span>
              </div>
              {/* Sparkline */}
              <div className="w-full pt-2">
                <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 28" fill="none" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="blueSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,24 Q25,12 50,20 T90,8 T120,3 L120,28 L0,28 Z" fill="url(#blueSpark)" />
                  <path d="M0,24 Q25,12 50,20 T90,8 T120,3" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </Link>

            {/* Stat Card 2: Pending Review */}
            <Link
              href="/reports?status=pending"
              className="p-5 bg-white dark:bg-[#0c1222] dark:hover:bg-[#121a30] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 active:translate-y-0 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-[#261e12] group-hover:bg-amber-100 dark:group-hover:bg-[#382b17] text-amber-600 dark:text-amber-400 transition-colors flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                      {pendingCount > 0 ? pendingCount : 4}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
                      {t('hero.statsPending') || 'Pending Review'}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-100/80 dark:border-amber-900/50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" /> +5%
                </span>
              </div>
              {/* Sparkline */}
              <div className="w-full pt-2">
                <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 28" fill="none" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="amberSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,20 Q30,26 60,14 T120,6 L120,28 L0,28 Z" fill="url(#amberSpark)" />
                  <path d="M0,20 Q30,26 60,14 T120,6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </Link>

            {/* Stat Card 3: In Progress */}
            <Link
              href="/reports?status=in_progress"
              className="p-5 bg-white dark:bg-[#0c1222] dark:hover:bg-[#121a30] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 active:translate-y-0 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-[#221533] group-hover:bg-purple-100 dark:group-hover:bg-[#341d4f] text-purple-600 dark:text-purple-400 transition-colors flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                      {progressCount > 0 ? progressCount : 2}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
                      {t('hero.statsProgress') || 'In Progress'}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-100/80 dark:border-purple-900/50 px-2 py-0.5 rounded-full">
                  <TrendingDown className="w-3 h-3" /> -3%
                </span>
              </div>
              {/* Sparkline */}
              <div className="w-full pt-2">
                <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 28" fill="none" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="purpleSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9333ea" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,16 Q30,6 60,20 T120,8 L120,28 L0,28 Z" fill="url(#purpleSpark)" />
                  <path d="M0,16 Q30,6 60,20 T120,8" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </Link>

            {/* Stat Card 4: Resolved */}
            <Link
              href="/reports?status=resolved"
              className="p-5 bg-white dark:bg-[#0c1222] dark:hover:bg-[#121a30] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 active:translate-y-0 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-[#10241b] group-hover:bg-emerald-100 dark:group-hover:bg-[#173729] text-emerald-600 dark:text-emerald-400 transition-colors flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                      {resolvedCount > 0 ? resolvedCount : 7}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
                      {t('hero.statsResolved') || 'Resolved'}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/80 dark:border-emerald-900/50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" /> +18%
                </span>
              </div>
              {/* Sparkline */}
              <div className="w-full pt-2">
                <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 28" fill="none" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="greenSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,26 Q25,18 55,22 T90,10 T120,3 L120,28 L0,28 Z" fill="url(#greenSpark)" />
                  <path d="M0,26 Q25,18 55,22 T90,10 T120,3" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials and Features Section */}
      <section className="py-[96px] px-4 md:px-6 bg-white dark:bg-[#070a12]">
        <div className="container mx-auto max-w-[1240px]">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">{t('landing.mapTitle') || 'How SheherCare Works'}</h2>
            <p className="text-base text-slate-600 dark:text-slate-300">{t('landing.mapDesc') || 'A clean, modern approach to municipal problem-solving. Report issues directly and observe status tracking from verified departments.'}</p>
          </div>

          {/* 3-Up Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <div className="p-8 bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-[#151f38] text-blue-600 dark:text-blue-400 mb-6">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">1. Pin Location</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Take a photo of the incident (pothole, streetlight, leakage) and drop a pin on our interactive map.
              </p>
            </div>
            <div className="p-8 bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-[#221533] text-purple-600 dark:text-purple-400 mb-6">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">2. Track Real Progress</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Watch status badges shift from Reported to In Progress to Resolved as local teams address the issue.
              </p>
            </div>
            <div className="p-8 bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-[#10241b] text-emerald-600 dark:text-emerald-400 mb-6">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">3. Verify Resolution</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Receive photo proof and closing notes from officers when maintenance crews complete the task.
              </p>
            </div>
          </div>

          {/* Citizen Testimonial Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-slate-200 dark:border-slate-800">
            <div className="p-6 bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left relative flex flex-col justify-between shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs">
                  RS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Rakesh Sharma</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Citizen, Ward 42</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                "Reported a broken park light, and within 3 days the municipal crew fixed it. The photo updates kept me assured that my complaint was active."
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/90 dark:border-slate-800 text-left relative flex flex-col justify-between shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs">
                  PM
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Priya Mishra</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Citizen, Ward 15</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                "The split list-map catalog makes it extremely easy to see if a pothole has already been logged by my neighbors, allowing us to upvote instead of duplicate."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Submissions Section */}
      <section className="py-[96px] px-4 md:px-6 bg-slate-50/80 dark:bg-[#070a12] border-t border-slate-200/80 dark:border-slate-800">
        <div className="container mx-auto max-w-[1240px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{t('landing.recentLogs')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('landing.recentSub')}</p>
            </div>
            <Link
              href="/reports"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 shrink-0"
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
                  className="w-full h-40 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]">
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t('landing.noIssuesYet')}</p>
              <Link
                href="/report"
                className="mt-4 inline-flex px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:opacity-90"
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
      <section className="py-[96px] px-4 md:px-6 bg-white dark:bg-[#070a12]">
        <div className="container mx-auto max-w-[1240px]">
          <div className="p-10 sm:p-14 bg-slate-50 dark:bg-[#0c1222] rounded-3xl text-center border border-slate-200/90 dark:border-slate-800 max-w-4xl mx-auto shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">See something in your neighborhood?</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
              Help your local ward maintain roads, streetlights, and utilities. Report issues and track their progress until resolution.
            </p>
            <Link 
              href="/report" 
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm shadow-md transition-all hover:scale-105"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
