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

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/40 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] transition-all duration-300 overflow-hidden backdrop-blur-md">
      {/* Top Banner Image */}
      <div className="relative w-full h-48 overflow-hidden bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={report.image_url || 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80'}
          alt={report.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        {/* Absolute status badges */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-zinc-800 text-zinc-300">
            {t('category.' + report.category)}
          </span>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <StatusBadge status={report.status} />
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-zinc-100 group-hover:text-purple-400 transition-colors leading-snug mb-2 line-clamp-1">
          {report.title}
        </h3>
        <p className="text-zinc-400 text-sm mb-4 line-clamp-2 leading-relaxed flex-grow">
          {report.description}
        </p>

        {/* Address and Info */}
        <div className="space-y-2 mb-6">
          <div className="flex items-start gap-2 text-xs text-zinc-400">
            <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span className="truncate leading-relaxed">{report.address}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>{t('card.reportedOn')} {formattedDate}</span>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
          {onUpvote ? (
            <button
              onClick={handleUpvote}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold border transition-all duration-200 ${
                upvoted
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                  : 'bg-zinc-800/30 text-zinc-400 border-zinc-800 hover:bg-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-purple-400 text-purple-400' : ''} ${loading ? 'animate-bounce' : ''}`} />
              <span>{upvoteCount} {t('card.upvotes')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-zinc-800/30 border border-zinc-850 text-xs text-zinc-400 font-semibold">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{upvoteCount} {t('card.upvotes')}</span>
            </div>
          )}

          <Link
            href={`/reports/${report.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors group/link"
          >
            <span>{t('card.details')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
