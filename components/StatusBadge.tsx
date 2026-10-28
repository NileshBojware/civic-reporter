'use client'

import React from 'react'
import { AlertCircle, CheckCircle2, Clock, Play, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface StatusBadgeProps {
  status: 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage()

  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-semibold bg-status-reported/10 text-status-reported border border-status-reported/20 shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>{t('status.pending')}</span>
        </span>
      )
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-semibold bg-status-verified/10 text-status-verified border border-status-verified/20 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('status.verified')}</span>
        </span>
      )
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-semibold bg-status-inprogress/10 text-status-inprogress border border-status-inprogress/20 shrink-0">
          <Play className="w-3.5 h-3.5 rotate-90" />
          <span>{t('status.in_progress')}</span>
        </span>
      )
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-semibold bg-status-resolved/10 text-status-resolved border border-status-resolved/20 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('status.resolved')}</span>
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-semibold bg-status-rejected/10 text-status-rejected border border-status-rejected/20 shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{t('status.rejected')}</span>
        </span>
      )
    default:
      return null
  }
}
