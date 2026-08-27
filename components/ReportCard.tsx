'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { MapPin, ThumbsUp, Calendar, ArrowRight } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { useLanguage } from '@/lib/LanguageContext'

interface Report {
  id: string
  title: string
  description: string
  category: string
  address: string
  image_url: string
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  upvote_count: number
  created_at: string
}

interface ReportCardProps {
  report: Report
  onUpvote?: (id: string) => Promise<void> | void
  isUpvoted?: boolean
}

export function ReportCard({ report, onUpvote, isUpvoted = false }: ReportCardProps) {
  const [upvoteCount, setUpvoteCount] = useState(report.upvote_count)
  const [upvoted, setUpvoted] = useState(isUpvoted)
  const [loading, setLoading] = useState(false)
  const { t, language } = useLanguage()

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading || !onUpvote) return

    setLoading(true)
    try {
      await onUpvote(report.id)
      setUpvoted(!upvoted)
      setUpvoteCount(prev => upvoted ? prev - 1 : prev + 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = new Date(report.created_at).toLocaleDateString(language === 'en' ? 'en-US' : language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Map category to design system color styles
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
    <div className="group flex flex-col sm:flex-row gap-5 p-6 bg-canvas border border-hairline rounded-lg hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 relative">
      {/* Left: Fixed aspect ratio image thumbnail */}
      <div className="w-full sm:w-36 h-28 shrink-0 overflow-hidden rounded-md border border-hairline bg-surface-card relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={report.image_url || 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80'}
          alt={report.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Right: Info and content body */}
      <div className="flex-grow flex flex-col justify-between min-w-0">
        <div>
          {/* Header row: Title */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <h3 className="text-title-md font-bold text-ink group-hover:text-primary transition-colors leading-snug line-clamp-1">
              {report.title}
            </h3>
          </div>

          {/* Subheader: location and timestamp */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted mb-2">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" />
              <span className="truncate">{report.address}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>{t('card.reportedOn')} {formattedDate}</span>
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-pill text-caption font-semibold border ${getCategoryStyles(report.category)}`}>
              {t('category.' + report.category)}
            </span>
            <StatusBadge status={report.status} />
          </div>

          {/* Description truncated to 2 lines */}
          <p className="text-body-md text-body line-clamp-2 leading-relaxed mb-4">
            {report.description}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-hairline-soft mt-auto">
          {onUpvote ? (
            <button
              onClick={handleUpvote}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-caption font-semibold border transition-all duration-150 cursor-pointer ${
                upvoted
                  ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20 hover:bg-brand-accent/15'
                  : 'bg-surface-card text-body border-hairline hover:bg-surface-strong hover:text-ink'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-brand-accent text-brand-accent' : ''} ${loading ? 'animate-pulse' : ''}`} />
              <span>{upvoteCount} {t('card.upvotes')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-card border border-hairline text-caption text-body font-semibold">
              <ThumbsUp className="w-3.5 h-3.5 text-muted" />
              <span>{upvoteCount} {t('card.upvotes')}</span>
            </div>
          )}

          <Link
            href={`/reports/${report.id}`}
            className="inline-flex items-center gap-1 text-caption font-semibold text-ink hover:underline group/link"
          >
            <span>{t('card.details')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
