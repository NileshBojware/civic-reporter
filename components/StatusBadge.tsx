'use client'

import React from 'react'
import { AlertCircle, CheckCircle2, Clock, Play, ShieldCheck, RefreshCw, CloudOff } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export type ReportStatusType =
  | 'pending'
  | 'verified'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'pending_sync'
  | string

interface StatusBadgeProps {
  status: ReportStatusType
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
    case 'pending_sync':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Sync</span>
        </span>
      )
    case 'syncing':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 shrink-0">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Syncing...</span>
        </span>
      )
    case 'synced':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Synced</span>
        </span>
      )
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed</span>
        </span>
      )
    default:
      return null
  }
}

interface SyncStatusBadgeProps {
  status: 'pending' | 'syncing' | 'synced' | 'failed'
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>
      )
    case 'syncing':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 shrink-0">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Syncing</span>
        </span>
      )
    case 'synced':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          <span>Synced</span>
        </span>
      )
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0">
          <AlertCircle className="w-3 h-3" />
          <span>Failed</span>
        </span>
      )
  }
}
