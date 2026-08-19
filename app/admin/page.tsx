'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, ToggleLeft, Search, ArrowUpRight } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { StatusBadge } from '@/components/StatusBadge'
import { AiProBadge } from '@/components/AiProBadge'
import { useLanguage } from '@/lib/LanguageContext'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const { t } = useLanguage()

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const checkAuth = async () => {
      let currentUser: any = null
      let currentProf: any = null

      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession()
        currentUser = data.session?.user || null
        if (currentUser) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle()
          currentProf = prof
        }
      } else {
        const mockUserStr = localStorage.getItem('civic_reporter_user')
        if (mockUserStr) {
          currentUser = JSON.parse(mockUserStr)
          currentProf = currentUser
        }
      }

      setUser(currentUser)
      setProfile(currentProf)

      if (!currentUser || currentProf?.role !== 'admin') {
        setLoading(false)
        return
      }

      // Fetch reports
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

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  // Access Denied Screen
  if (!user || profile?.role !== 'admin') {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md p-8 rounded-3xl glass-panel text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Admin authorization required. Please log in with municipal administrative credentials.
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-2xl block text-center shadow-lg"
          >
            Log In as Admin
          </Link>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const totalCount = reports.length
  const pendingCount = reports.filter((r) => r.status === 'pending').length
  const progressCount = reports.filter((r) => r.status === 'in_progress').length
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length

  // Filter lists
  const filteredReports = reports.filter((report) => {
    const matchSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.address.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = statusFilter === 'all' || report.status === statusFilter

    return matchSearch && matchStatus
  })

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 md:py-16 space-y-10">
      {/* Header title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{t('admin.dashboard')}</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{t('admin.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-850">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">{t('hero.statsTotal')}</span>
          <span className="text-2xl font-extrabold text-white block mt-1.5">{totalCount}</span>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-850">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">{t('hero.statsPending')}</span>
          <span className="text-2xl font-extrabold text-amber-500 block mt-1.5">{pendingCount}</span>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-850">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">{t('hero.statsProgress')}</span>
          <span className="text-2xl font-extrabold text-blue-500 block mt-1.5">{progressCount}</span>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-850">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">{t('hero.statsResolved')}</span>
          <span className="text-2xl font-extrabold text-emerald-500 block mt-1.5">{resolvedCount}</span>
        </div>
      </div>

      {/* Main Grid: Reports Table + AI Pro Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Reports Table Manager (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl glass-panel space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white">{t('myreports.title')}</h3>
            
            {/* Search and Filters toolbar */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('admin.search')}
                  className="w-full sm:w-44 pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-300 font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="all">{t('catalog.allStatuses')}</option>
                <option value="pending">{t('status.pending')}</option>
                <option value="in_progress">{t('status.in_progress')}</option>
                <option value="resolved">{t('status.resolved')}</option>
                <option value="rejected">{t('status.rejected')}</option>
              </select>
            </div>
          </div>

          {/* Table container */}
          <div className="overflow-x-auto border border-zinc-900 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="p-4">{t('admin.thTitle')}</th>
                  <th className="p-4">{t('admin.thCategory')}</th>
                  <th className="p-4 text-center">{t('admin.score')}</th>
                  <th className="p-4">{t('myreports.thStatus')}</th>
                  <th className="p-4 text-right">{t('myreports.thActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 font-medium">
                      {t('catalog.noMatches')}
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-zinc-900/30 transition">
                      <td className="p-4 max-w-[200px]">
                        <span className="font-bold text-zinc-200 block truncate">{report.title}</span>
                        <span className="text-[10px] text-zinc-500 block truncate mt-0.5">{report.address}</span>
                      </td>
                      <td className="p-4 text-zinc-400 font-medium">
                        {t('category.' + report.category)}
                      </td>
                      <td className="p-4 text-center font-semibold text-zinc-300">
                        {report.upvote_count}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/reports/${report.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-[10px] font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                        >
                          <span>{t('admin.btnView')}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Pro Sidebar Toggle (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/15 to-indigo-950/15 border border-purple-900/20 shadow-lg space-y-4 relative overflow-hidden">
            {/* Soft purple glow inside */}
            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />

            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest">Automation Modules</h3>
              <AiProBadge />
            </div>

            <h4 className="text-sm font-extrabold text-white">AI Detection & Categorization</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Unlock automatic computer vision models that verify upload evidence integrity, tag categories, and trigger auto-clustering to block duplicates on entry.
            </p>

            <div className="space-y-3.5 pt-4 border-t border-zinc-850/40">
              <div className="flex items-center justify-between gap-4 opacity-50 select-none">
                <div>
                  <span className="text-xs font-bold text-zinc-300 block">Auto-verify Photos</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Flags fake/unrelated photo evidence</span>
                </div>
                <ToggleLeft className="w-9 h-9 text-zinc-600" />
              </div>

              <div className="flex items-center justify-between gap-4 opacity-50 select-none">
                <div>
                  <span className="text-xs font-bold text-zinc-300 block">DBSCAN Geo-Clustering</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Combines cluster-reports automatically</span>
                </div>
                <ToggleLeft className="w-9 h-9 text-zinc-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
