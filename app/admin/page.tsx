'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  AlertTriangle, 
  ToggleLeft, 
  Search, 
  ArrowUpRight, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Layers, 
  UserCheck, 
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { StatusBadge } from '@/components/StatusBadge'
import { AiProBadge } from '@/components/AiProBadge'
import { useLanguage } from '@/lib/LanguageContext'
import { DEPARTMENTS, getAdminDepartment, getDepartmentByCategory, Department } from '@/lib/departments'
import { getCategoryFormattedLabel, getCategoryStyles } from '@/lib/categories'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeDept, setActiveDept] = useState<Department>(DEPARTMENTS[0])
  const [scopeFilter, setScopeFilter] = useState<'department' | 'all'>('department')
  const { t } = useLanguage()

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categorySubFilter, setCategorySubFilter] = useState('all')

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

      const isDeptAdmin = currentUser?.email && DEPARTMENTS.some(d => d.adminEmail.toLowerCase() === currentUser.email.toLowerCase())
      const isAdmin = currentProf?.role === 'admin' || isDeptAdmin || currentUser?.user_metadata?.role === 'admin'

      if (!currentUser || !isAdmin) {
        setLoading(false)
        return
      }

      // Determine the administrator's department
      const dept = getAdminDepartment(currentUser, currentProf)
      if (dept) {
        setActiveDept(dept)
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
      <div className="flex-grow flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const isDeptAdmin = user?.email && DEPARTMENTS.some(d => d.adminEmail.toLowerCase() === user.email.toLowerCase())
  const isAdmin = profile?.role === 'admin' || isDeptAdmin || user?.user_metadata?.role === 'admin'

  // Access Denied Screen
  if (!user || !isAdmin) {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-16 bg-canvas">
        <div className="w-full max-w-md p-8 rounded-xl border border-hairline bg-canvas text-center shadow-lg space-y-4">
          <AlertTriangle className="w-12 h-12 text-status-rejected mx-auto" />
          <h2 className="text-title-lg font-bold text-ink">Department Admin Access Required</h2>
          <p className="text-body text-body-sm leading-relaxed">
            Please log in with municipal departmental administrative credentials (e.g., <code className="text-xs bg-surface-soft px-1.5 py-0.5 rounded">admin.pwd@shehercare.in</code>).
          </p>
          <Link
            href="/login"
            className="btn-primary w-full flex items-center justify-center shadow-sm h-10"
          >
            Log In as Department Admin
          </Link>
        </div>
      </div>
    )
  }

  // Calculate statistics for active department and entire municipality
  const deptReports = reports.filter((r) => activeDept.categories.includes(r.category))
  
  const statsReports = scopeFilter === 'department' ? deptReports : reports
  const totalCount = statsReports.length
  const pendingCount = statsReports.filter((r) => r.status === 'pending').length
  const progressCount = statsReports.filter((r) => r.status === 'in_progress').length
  const resolvedCount = statsReports.filter((r) => r.status === 'resolved').length
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100

  // Filter list
  const filteredReports = reports.filter((report) => {
    // Scope filter
    if (scopeFilter === 'department' && !activeDept.categories.includes(report.category)) {
      return false
    }

    // Category subfilter
    if (categorySubFilter !== 'all' && report.category !== categorySubFilter) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all' && report.status !== statusFilter) {
      return false
    }

    // Search query
    const matchSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase())

    return matchSearch
  })

  return (
    <div className="container mx-auto max-w-[1240px] px-4 py-8 md:py-12 space-y-8 bg-canvas text-body">
      
      {/* Department Top Banner */}
      <div className="p-6 md:p-8 rounded-2xl border border-hairline bg-gradient-to-br from-canvas via-surface-soft to-canvas shadow-sm relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${activeDept.badgeColor}`}>
                {activeDept.shortName} Department
              </span>
              <span className="text-xs text-muted font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {user?.email || activeDept.adminEmail}
              </span>
            </div>

            <h1 className="text-display-sm md:text-display-md font-bold text-ink tracking-tight">
              {activeDept.name} <span className="text-blue-600 dark:text-blue-400">Admin Portal</span>
            </h1>

            <p className="text-body-sm text-muted max-w-2xl leading-relaxed">
              {activeDept.description}
            </p>
          </div>

          {/* Department Switcher Dropdown for Officers */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Switch Department Portal
              </label>
              <div className="relative">
                <select
                  value={activeDept.id}
                  onChange={(e) => {
                    const found = DEPARTMENTS.find(d => d.id === e.target.value)
                    if (found) {
                      setActiveDept(found)
                      setCategorySubFilter('all')
                    }
                  }}
                  className="w-full sm:w-64 pl-3 pr-8 py-2 text-xs font-semibold rounded-lg bg-canvas border border-hairline text-ink focus:outline-none focus:border-primary shadow-sm cursor-pointer"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.shortName})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

        </div>

        {/* Department Purview Subcategories Badges */}
        <div className="pt-4 border-t border-hairline/60 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted mr-1">Jurisdiction Categories:</span>
          {activeDept.categories.map((catKey) => (
            <span
              key={catKey}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryStyles(catKey)}`}
            >
              {getCategoryFormattedLabel(catKey)}
            </span>
          ))}
        </div>
      </div>

      {/* Scope Switcher Tabs (My Department vs City-wide) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-soft border border-hairline">
          <button
            type="button"
            onClick={() => setScopeFilter('department')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              scopeFilter === 'department'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{activeDept.shortName} Department Queue</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${scopeFilter === 'department' ? 'bg-white/20 text-white' : 'bg-canvas text-muted border border-hairline'}`}>
              {deptReports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              scopeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Municipal Reports</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${scopeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-canvas text-muted border border-hairline'}`}>
              {reports.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-muted font-medium">
          Showing {filteredReports.length} of {statsReports.length} incidents
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-canvas border border-hairline shadow-sm space-y-1">
          <span className="text-muted text-[11px] font-bold uppercase tracking-wider block">
            {scopeFilter === 'department' ? `${activeDept.shortName} Total` : 'City Total'}
          </span>
          <span className="text-display-sm font-bold text-ink block">{totalCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-canvas border border-hairline shadow-sm space-y-1">
          <span className="text-muted text-[11px] font-bold uppercase tracking-wider block text-status-reported">
            Pending Triage
          </span>
          <span className="text-display-sm font-bold text-status-reported block">{pendingCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-canvas border border-hairline shadow-sm space-y-1">
          <span className="text-muted text-[11px] font-bold uppercase tracking-wider block text-status-inprogress">
            In Progress
          </span>
          <span className="text-display-sm font-bold text-status-inprogress block">{progressCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-canvas border border-hairline shadow-sm space-y-1">
          <span className="text-muted text-[11px] font-bold uppercase tracking-wider block text-status-resolved">
            Resolved
          </span>
          <span className="text-display-sm font-bold text-status-resolved block">{resolvedCount}</span>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-xl bg-canvas border border-hairline shadow-sm space-y-1">
          <span className="text-muted text-[11px] font-bold uppercase tracking-wider block text-blue-600 dark:text-blue-400">
            Resolution SLA
          </span>
          <span className="text-display-sm font-bold text-blue-600 dark:text-blue-400 block">{resolutionRate}%</span>
        </div>
      </div>

      {/* Main Grid: Reports Table + Automation Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Reports Table Section (8 cols) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-canvas border border-hairline shadow-sm space-y-5">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-title-md font-bold text-ink">
                {scopeFilter === 'department' ? `${activeDept.name} Triage Table` : 'City-Wide Incident Register'}
              </h3>
              <p className="text-caption text-muted">
                Review citizen submissions, assign field teams, and confirm resolution proof
              </p>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('admin.search')}
                  className="w-full sm:w-44 pl-8 pr-3 h-9 rounded-lg bg-canvas border border-hairline text-xs text-ink placeholder-muted focus:outline-none focus:border-primary transition"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 h-9 rounded-lg bg-canvas border border-hairline text-xs text-body font-semibold focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">{t('catalog.allStatuses')}</option>
                <option value="pending">{t('status.pending')}</option>
                <option value="verified">{t('status.verified')}</option>
                <option value="in_progress">{t('status.in_progress')}</option>
                <option value="resolved">{t('status.resolved')}</option>
                <option value="rejected">{t('status.rejected')}</option>
              </select>

              {scopeFilter === 'department' && activeDept.categories.length > 1 && (
                <select
                  value={categorySubFilter}
                  onChange={(e) => setCategorySubFilter(e.target.value)}
                  className="px-2.5 h-9 rounded-lg bg-canvas border border-hairline text-xs text-body font-semibold focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">All Subcategories</option>
                  {activeDept.categories.map((c) => (
                    <option key={c} value={c}>{getCategoryFormattedLabel(c)}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-hairline rounded-xl">
            <table className="w-full text-left border-collapse text-caption">
              <thead>
                <tr className="bg-surface-soft border-b border-hairline text-muted font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">{t('admin.thTitle')}</th>
                  <th className="p-3.5">Department & Category</th>
                  <th className="p-3.5 text-center">{t('admin.score')}</th>
                  <th className="p-3.5">{t('myreports.thStatus')}</th>
                  <th className="p-3.5 text-right">{t('myreports.thActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted font-medium bg-canvas">
                      <p className="text-body-sm font-semibold text-ink mb-1">No reports match the current filter</p>
                      <p className="text-caption text-muted">Try resetting search criteria or switching department view.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const reportDept = getDepartmentByCategory(report.category)
                    const isDirectJurisdiction = activeDept.categories.includes(report.category)

                    return (
                      <tr key={report.id} className="hover:bg-surface-soft/40 transition bg-canvas">
                        <td className="p-3.5 max-w-[220px] min-w-[160px]">
                          <span className="font-bold text-ink block truncate">{report.title}</span>
                          <span className="text-[11px] text-muted block truncate mt-0.5">{report.address}</span>
                        </td>
                        
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${reportDept.badgeColor}`}>
                              {reportDept.shortName}
                            </span>
                            <span className="text-xs text-body font-medium block">
                              {getCategoryFormattedLabel(report.category)}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 text-center font-bold text-ink">
                          {report.upvote_count}
                        </td>

                        <td className="p-3.5">
                          <StatusBadge status={report.status} />
                        </td>

                        <td className="p-3.5 text-right">
                          <Link
                            href={`/admin/reports/${report.id}`}
                            className="btn-primary h-8 px-3 py-1 text-[11px] inline-flex items-center gap-1 rounded-lg font-bold shadow-sm"
                          >
                            <span>Triage</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Sidebar: Department Jurisdiction Directory & AI Automation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Department Directory Card */}
          <div className="p-5 rounded-2xl bg-canvas border border-hairline shadow-sm space-y-3.5">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Municipal Departments (10)
            </h4>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {DEPARTMENTS.map((dept) => {
                const isSelected = activeDept.id === dept.id
                const deptCount = reports.filter(r => dept.categories.includes(r.category)).length

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      setActiveDept(dept)
                      setScopeFilter('department')
                      setCategorySubFilter('all')
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between border ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'bg-canvas border-hairline text-body hover:bg-surface-soft'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="block truncate">{dept.name}</span>
                      <span className="text-[10px] text-muted block truncate">{dept.adminEmail}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-surface-soft text-muted border border-hairline'
                    }`}>
                      {deptCount}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI Automation Modules */}
          <div className="p-5 rounded-2xl bg-surface-card border border-hairline shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest">Automation Modules</h3>
              <AiProBadge />
            </div>

            <h4 className="text-body-sm font-bold text-ink">Auto-Routing to Departments</h4>
            <p className="text-caption text-body leading-relaxed">
              Automated computer vision and NLP models classify citizen photos into the appropriate municipal department with 98.4% accuracy.
            </p>

            <div className="space-y-3 pt-3 border-t border-hairline">
              <div className="flex items-center justify-between gap-4 opacity-70">
                <div>
                  <span className="text-caption font-bold text-ink block">Auto-Dispatch to Field Teams</span>
                  <span className="text-[9px] text-muted block">Sends alert to department duty officer</span>
                </div>
                <ToggleLeft className="w-8 h-8 text-blue-600" />
              </div>

              <div className="flex items-center justify-between gap-4 opacity-70">
                <div>
                  <span className="text-caption font-bold text-ink block">Duplicate Detection (100m)</span>
                  <span className="text-[9px] text-muted block">Clusters nearby citizen reports</span>
                </div>
                <ToggleLeft className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
