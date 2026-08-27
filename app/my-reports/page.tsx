'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Info, Calendar, MapPin, ArrowRight, Clipboard } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { StatusBadge } from '@/components/StatusBadge'
import { useLanguage } from '@/lib/LanguageContext'

export default function MyReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { t, language } = useLanguage()

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
      <div className="flex-grow flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-16 bg-canvas">
        <div className="w-full max-w-md p-8 rounded-lg border border-hairline bg-canvas text-center shadow-md">
          <Info className="w-12 h-12 text-brand-accent mx-auto mb-4" />
          <h2 className="text-title-lg font-bold text-ink mb-2">Sign In Required</h2>
          <p className="text-body-sm text-body mb-6 leading-relaxed">
            Please log in to view your logged civic issue reports.
          </p>
          <Link
            href="/login"
            className="btn-primary w-full flex items-center justify-center"
          >
            Log In
          </Link>
        </div>
      </div>
    )
  }

  // Category styles helper
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

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16 bg-canvas text-body">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-display-md text-ink mb-1">{t('myreports.title')}</h1>
          <p className="text-body-sm text-body">{t('myreports.subtitle')}</p>
        </div>
        <Link
          href="/report"
          className="btn-primary flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('myreports.btnReportNow')}</span>
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-hairline bg-canvas rounded-lg space-y-4">
          <Clipboard className="w-12 h-12 text-muted mx-auto" />
          <p className="text-body-sm text-muted">{t('myreports.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 md:p-6 rounded-lg bg-canvas border border-hairline flex flex-col md:flex-row md:items-center justify-between gap-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200"
            >
              <div className="flex gap-4 items-start md:items-center min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={report.image_url}
                  alt={report.title}
                  className="w-16 h-16 rounded-md object-cover border border-hairline shrink-0 bg-surface-card"
                />
                <div className="min-w-0">
                  <h3 className="text-body-md font-bold text-ink mb-1.5 leading-snug line-clamp-1">
                    {report.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption text-muted">
                    <span className={`inline-flex px-2 py-0.5 rounded-pill text-[11px] font-semibold border ${getCategoryStyles(report.category)}`}>
                      {t('category.' + report.category)}
                    </span>
                    <span className="text-hairline-soft hidden sm:inline">|</span>
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{report.address}</span>
                    </span>
                    <span className="text-hairline-soft hidden sm:inline">|</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>{new Date(report.created_at).toLocaleDateString(language === 'en' ? 'en-US' : language)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t border-hairline-soft md:border-0 shrink-0">
                <StatusBadge status={report.status} />
                <Link
                  href={`/reports/${report.id}`}
                  className="inline-flex items-center gap-1 text-caption font-semibold text-ink hover:underline cursor-pointer"
                >
                  <span>{t('card.details')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-accent" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
