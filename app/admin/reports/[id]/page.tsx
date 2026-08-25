'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Shield, CheckCircle, XCircle, Play, AlertCircle, FileText, Image as ImageIcon, AlertTriangle, ShieldCheck } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { StatusBadge } from '@/components/StatusBadge'
import imageCompression from 'browser-image-compression'
import { useLanguage } from '@/lib/LanguageContext'

// Dynamically load the Leaflet Map
const MapOverview = dynamic(() => import('@/components/MapOverview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] rounded-lg bg-surface-card border border-hairline animate-pulse flex items-center justify-center">
      <span className="text-muted text-body-sm">Loading map...</span>
    </div>
  ),
})

export default function AdminReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { t, language } = useLanguage()

  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  // Forms states
  const [actionTab, setActionTab] = useState<'none' | 'resolve' | 'reject'>('none')
  const [rejectionReason, setRejectionReason] = useState('')
  const [resolvedNote, setResolvedNote] = useState('')
  const [resolutionPhoto, setResolutionPhoto] = useState<File | null>(null)
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState('')
  const [compressing, setCompressing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchReportDetails = async () => {
    try {
      const res = await fetch(`/api/reports/${id}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      } else {
        router.push('/admin')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

      fetchReportDetails()
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const mockReportList = report ? [report] : []

  const handleResolutionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setCompressing(true)

    const options = {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    }

    try {
      const compressedFile = await imageCompression(file, options)
      setResolutionPhoto(compressedFile)

      const reader = new FileReader()
      reader.onloadend = () => {
        setResolutionPhotoUrl(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (err) {
      console.error('Image compression failed:', err)
      setError('Failed to compress resolution photo.')
    } finally {
      setCompressing(false)
    }
  }

  const handleStartFix = async () => {
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      })

      if (!res.ok) {
        throw new Error('Failed to update status')
      }

      alert('Work status updated to In Progress!')
      fetchReportDetails()
    } catch (err: any) {
      setError(err.message || 'Error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'verified' }),
      })

      if (!res.ok) {
        throw new Error('Failed to verify report')
      }

      alert('Report verified. Ready for work assignment.')
      fetchReportDetails()
    } catch (err: any) {
      setError(err.message || 'Error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedNote || !resolutionPhotoUrl) {
      setError('Please add a resolution description and upload work completion photo evidence.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      let finalImageUrl = resolutionPhotoUrl

      if (isSupabaseConfigured && supabase && resolutionPhoto) {
        const fileExt = resolutionPhoto.name.split('.').pop()
        const fileName = `resolution_${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('reports-resolutions')
          .upload(filePath, resolutionPhoto)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('reports-resolutions')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrlData.publicUrl
      }

      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolved_note: resolvedNote,
          resolved_image_url: finalImageUrl,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update status')
      }

      alert('Ticket marked as Resolved successfully!')
      setActionTab('none')
      setResolvedNote('')
      setResolutionPhotoUrl('')
      fetchReportDetails()
    } catch (err: any) {
      setError(err.message || 'Error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectionReason) {
      setError('A rejection reason is mandatory.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to reject ticket')
      }

      alert('Ticket rejected successfully.')
      setActionTab('none')
      setRejectionReason('')
      fetchReportDetails()
    } catch (err: any) {
      setError(err.message || 'Error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetTicket = async () => {
    if (!window.confirm('Reset this ticket back to Pending? This will delete resolution or rejection notes.')) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })
      if (res.ok) {
        alert('Ticket status reset to Pending.')
        fetchReportDetails()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-16 bg-canvas">
        <div className="w-full max-w-md p-8 rounded-lg border border-hairline bg-canvas text-center shadow-md">
          <AlertTriangle className="w-12 h-12 text-status-rejected mx-auto mb-4" />
          <h2 className="text-title-lg font-bold text-ink mb-2">Access Denied</h2>
          <p className="text-body text-body-sm mb-6 leading-relaxed">
            Admin authorization required.
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

  if (!report) return null

  // Category dynamic style helper
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
      {/* Back to dashboard */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-muted hover:text-ink mb-6 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('adminDetail.btnBackDash')}</span>
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-display-sm text-ink mb-0.5">{t('adminDetail.title')}</h1>
          <p className="text-[10px] text-muted font-mono">ID: {report.id}</p>
        </div>
        <div className="flex items-center gap-2 text-caption text-muted font-bold bg-surface-soft border border-hairline px-3 py-1.5 rounded-md">
          <Shield className="w-4 h-4 text-brand-accent" />
          <span>{t('nav.adminDashboard')}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-body-sm font-semibold leading-relaxed">
          {error}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Info Card & Action Dash */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 md:p-8 rounded-lg bg-canvas border border-hairline shadow-sm space-y-6">
            <div className="flex justify-between items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-pill text-caption font-semibold border ${getCategoryStyles(report.category)}`}>
                {t('category.' + report.category)}
              </span>
              <StatusBadge status={report.status} />
            </div>

            <div>
              <h2 className="text-title-lg font-bold text-ink mb-2">{report.title}</h2>
              <p className="text-body-md text-body leading-relaxed">{report.description || 'No description.'}</p>
            </div>

            <div className="p-4 rounded-lg bg-canvas border border-hairline flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.image_url}
                alt="Ticket Original Evidence"
                className="w-24 h-24 object-cover rounded-md border border-hairline shrink-0"
              />
              <div className="flex flex-col justify-between py-1 min-w-0">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Evidence</span>
                <span className="text-caption text-body font-medium line-clamp-2 leading-normal">
                  {t('card.reportedOn')}: {new Date(report.created_at).toLocaleString(language === 'en' ? 'en-US' : language)}
                </span>
                <a
                  href={report.image_url}
                  target="_blank"
                  className="text-[10px] font-bold text-brand-accent hover:underline inline-block mt-2"
                >
                  View Full Image &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* Action Dashboard Panel */}
          <div className="p-6 md:p-8 rounded-lg bg-canvas border border-hairline shadow-sm space-y-6">
            <h3 className="text-title-sm font-bold text-ink border-b border-hairline-soft pb-3 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-brand-accent" />
              <span>Update Ticket Status</span>
            </h3>

            {/* If resolved or rejected, let them reset */}
            {(report.status === 'resolved' || report.status === 'rejected') ? (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-surface-soft border border-hairline text-caption text-body">
                  This ticket has been finalized as <span className="font-bold uppercase text-ink">{report.status}</span>. To make edits, reset its status.
                </div>
                <button
                  onClick={handleResetTicket}
                  disabled={submitting}
                  className="btn-secondary text-caption py-1.5 h-9"
                >
                  Reset Status to Pending
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status-dependent buttons */}
                <div className="flex flex-wrap gap-3">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={handleVerify}
                        disabled={submitting}
                        className="btn-primary h-10 px-5 text-caption flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify Report</span>
                      </button>
                    </>
                  )}

                  {report.status === 'verified' && (
                    <button
                      onClick={handleStartFix}
                      disabled={submitting}
                      className="btn-primary h-10 px-5 text-caption flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Start Work</span>
                    </button>
                  )}

                  {report.status === 'in_progress' && (
                    <button
                      onClick={() => setActionTab('resolve')}
                      className={`h-10 px-5 text-caption rounded-md font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        actionTab === 'resolve'
                          ? 'bg-primary text-on-primary'
                          : 'btn-primary'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Resolve Ticket</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActionTab('reject')}
                    className={`h-10 px-5 text-caption rounded-md font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                      actionTab === 'reject'
                        ? 'bg-status-rejected/10 text-status-rejected border-status-rejected/25'
                        : 'btn-secondary text-status-rejected border-status-rejected/20 hover:bg-status-rejected/5'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Ticket</span>
                  </button>
                </div>

                {/* Form Resolve */}
                {actionTab === 'resolve' && (
                  <form onSubmit={handleResolveSubmit} className="space-y-5 p-5 bg-surface-soft/40 rounded-lg border border-hairline animate-in slide-in-from-top-4 duration-200">
                    <h4 className="text-caption font-bold text-ink uppercase">Mark Issue Resolved</h4>
                    
                    <div>
                      <label className="text-[10px] font-bold text-muted block mb-1.5">Resolution Notes *</label>
                      <textarea
                        required
                        value={resolvedNote}
                        onChange={(e) => setResolvedNote(e.target.value)}
                        rows={3}
                        placeholder="Detail what was fixed (e.g. Road crew patched pothole with cold asphalt mix)..."
                        className="w-full px-3.5 py-2 rounded-md bg-canvas border border-hairline text-caption text-ink placeholder-muted focus:outline-none focus:border-primary transition resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted block mb-1.5">Resolution Photo Evidence *</label>
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-hairline hover:border-muted rounded-md p-4 transition bg-canvas relative min-h-[140px]">
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={handleResolutionPhotoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        {resolutionPhotoUrl ? (
                          <div className="w-full text-center z-20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolutionPhotoUrl}
                              alt="Resolution evidence preview"
                              className="max-h-36 rounded-md mx-auto border border-hairline mb-2 object-contain"
                            />
                            <span className="text-[9px] text-muted block font-semibold">
                              Resolution photo uploaded.
                            </span>
                          </div>
                        ) : (
                          <div className="text-center z-20">
                            <ImageIcon className="w-8 h-8 text-muted mx-auto mb-2" />
                            <span className="text-caption font-semibold text-ink block">Upload Completion Photo</span>
                            <span className="text-[9px] text-muted">Compacted for database storage limits</span>
                          </div>
                        )}
                      </div>
                      {compressing && (
                        <span className="text-[10px] text-brand-accent font-bold block mt-1.5 text-center animate-pulse">
                          Compressing resolution file...
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || compressing}
                      className="btn-primary w-full h-10 text-caption"
                    >
                      {submitting ? 'Updating status...' : 'Submit Work Completion'}
                    </button>
                  </form>
                )}

                {/* Form Reject */}
                {actionTab === 'reject' && (
                  <form onSubmit={handleRejectSubmit} className="space-y-4 p-5 bg-surface-soft/40 rounded-lg border border-hairline animate-in slide-in-from-top-4 duration-200">
                    <h4 className="text-caption font-bold text-ink uppercase">Reject Ticket</h4>

                    <div>
                      <label className="text-[10px] font-bold text-muted block mb-1.5">Mandatory Rejection Reason *</label>
                      <textarea
                        required
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        placeholder="Provide details on why this ticket is rejected (e.g. Duplicate ticket, Not public property, Unable to locate)..."
                        className="w-full px-3.5 py-2 rounded-md bg-canvas border border-hairline text-caption text-ink placeholder-muted focus:outline-none focus:border-primary transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full h-10 text-caption bg-status-rejected hover:bg-status-rejected/90"
                    >
                      {submitting ? 'Updating status...' : 'Reject Ticket'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Map Pin Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-lg bg-canvas border border-hairline shadow-sm space-y-4">
            <h3 className="text-caption font-bold text-ink uppercase tracking-wider">{t('detail.coordinates')}</h3>
            <div className="h-[200px] rounded-lg overflow-hidden border border-hairline">
              <MapOverview reports={mockReportList} zoom={15} />
            </div>
            <div className="text-[10px] text-muted font-mono space-y-2 mt-2">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-ink shrink-0">{t('detail.address')}:</span>
                <span className="leading-relaxed">{report.address}</span>
              </div>
              <div className="flex items-center gap-1.5 border-t border-hairline-soft pt-2">
                <span className="font-bold text-ink">Lat:</span>
                <span>{report.latitude.toFixed(6)}</span>
                <span className="text-hairline">|</span>
                <span className="font-bold text-ink">Lng:</span>
                <span>{report.longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
