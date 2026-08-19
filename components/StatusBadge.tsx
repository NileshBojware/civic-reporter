'use client'

import React from 'react'
import { AlertCircle, CheckCircle2, Clock, Play } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface StatusBadgeProps {
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage()

  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          {t('status.pending')}
        </span>
      )
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Play className="w-3.5 h-3.5 rotate-90" />
          {t('status.in_progress')}
        </span>
      )
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t('status.resolved')}
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          {t('status.rejected')}
        </span>
      )
    default:
      return null
  }
}

