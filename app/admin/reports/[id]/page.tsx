'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Shield, CheckCircle, XCircle, Play, AlertCircle, FileText, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { StatusBadge } from '@/components/StatusBadge'
import imageCompression from 'browser-image-compression'
import { useLanguage } from '@/lib/LanguageContext'

// Dynamically load the Leaflet Map
const MapOverview = dynamic(() => import('@/components/MapOverview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center">
      <span className="text-zinc-500 text-sm">Loading...</span>
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

  // Geolocation Map sync
  const mockReportList = report ? [report] : []

  // Client side image compression
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

  // Update Status directly (e.g. Start Fix)
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

  // Submit Resolution
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

  // Submit Rejection
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

  // Reset ticket back to review/inspect
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
      <div className="flex-grow flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md p-8 rounded-3xl glass-panel text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Access Denied</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Admin authorization required.
          </p>
          <Link
            href="/login"
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl"
          >
            Log In
          </Link>
        </div>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 mb-6 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('adminDetail.btnBackDash')}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-100">{t('adminDetail.title')}</h1>
          <p className="text-zinc-500 text-xs mt-0.5">ID: {report.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4.5 h-4.5 text-purple-400" />
          <span className="text-xs font-bold text-zinc-400">{t('nav.adminDashboard')}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Info Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 md:p-8 rounded-3xl glass-panel space-y-6">
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded-full uppercase">
                {t('category.' + report.category)}
              </span>
              <StatusBadge status={report.status} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-100 mb-2">{report.title}</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">{report.description || 'No description.'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.image_url}
                alt="Ticket Original Evidence"
                className="w-24 h-24 object-cover rounded-xl border border-zinc-900 shrink-0"
              />
              <div className="flex flex-col justify-between py-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Evidence</span>
                <span className="text-xs text-zinc-300 font-medium line-clamp-2 leading-normal">
                  {t('card.reportedOn')}: {new Date(report.created_at).toLocaleString(language === 'en' ? 'en-US' : language)}
                </span>
                <a
                  href={report.image_url}
                  target="_blank"
                  className="text-[10px] font-bold text-purple-400 hover:text-purple-300 inline-block mt-2"
                >
                  View Full Image &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* Action Dashboard Panel */}
          <div className="p-6 md:p-8 rounded-3xl glass-panel space-y-6">
            <h3 className="text-sm font-bold text-zinc-100 border-b border-zinc-800 pb-3 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-purple-400" />
              {t('adminDetail.updateStatus')}
            </h3>

            {/* If resolved or rejected, let them reset */}
            {(report.status === 'resolved' || report.status === 'rejected') ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-850 text-xs text-zinc-400">
                  This ticket has been finalized as <span className="font-bold uppercase text-zinc-100">{report.status}</span>. To make edits, reset its status.
                </div>
                <button
                  onClick={handleResetTicket}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-750 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  Reset Status to Pending
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status-dependent buttons */}
                <div className="flex flex-wrap gap-3">
                  {report.status === 'pending' && (
                    <button
                      onClick={handleStartFix}
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/10 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span>Start Work / Verify</span>
                    </button>
                  )}

                  {report.status === 'in_progress' && (
                    <button
                      onClick={() => setActionTab('resolve')}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        actionTab === 'resolve'
                          ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Resolve Ticket</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActionTab('reject')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      actionTab === 'reject'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-350 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Ticket</span>
                  </button>
                </div>

                {/* Form Resolve */}
                {actionTab === 'resolve' && (
                  <form onSubmit={handleResolveSubmit} className="space-y-5 p-5 bg-zinc-950/40 rounded-2xl border border-zinc-900 animate-in slide-in-from-top-4 duration-200">
                    <h4 className="text-xs font-bold text-zinc-350 uppercase">Mark Issue Resolved</h4>
                    
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1.5">Resolution Notes *</label>
                      <textarea
                        required
                        value={resolvedNote}
                        onChange={(e) => setResolvedNote(e.target.value)}
                        rows={3}
                        placeholder="Detail what was fixed (e.g. Road crew patched pothole with cold asphalt mix)..."
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-purple-500 transition resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1.5">Resolution Photo Evidence *</label>
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-850 hover:border-purple-500/20 rounded-xl p-4 transition cursor-pointer relative bg-zinc-900/10 min-h-[140px]">
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
                              className="max-h-36 rounded-lg mx-auto border border-zinc-850 mb-2 object-contain"
                            />
                            <span className="text-[9px] text-zinc-500 block">
                              Compressed resolution photo ready.
                            </span>
                          </div>
                        ) : (
                          <div className="text-center z-20">
                            <ImageIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                            <span className="text-xs font-semibold text-zinc-300 block">Upload Completion Photo</span>
                            <span className="text-[9px] text-zinc-500">Compacted for free storage limits</span>
                          </div>
                        )}
                      </div>
                      {compressing && (
                        <span className="text-[10px] text-purple-400 font-bold block mt-1.5 text-center animate-pulse">
                          Compressing resolution file...
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || compressing}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Updating status...' : 'Submit Work Completion'}
                    </button>
                  </form>
                )}

                {/* Form Reject */}
                {actionTab === 'reject' && (
                  <form onSubmit={handleRejectSubmit} className="space-y-4 p-5 bg-zinc-950/40 rounded-2xl border border-zinc-900 animate-in slide-in-from-top-4 duration-200">
                    <h4 className="text-xs font-bold text-zinc-350 uppercase">Reject Ticket</h4>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1.5">Mandatory Rejection Reason *</label>
                      <textarea
                        required
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        placeholder="Provide details on why this ticket is rejected (e.g. Duplicate ticket, Not public property, Unable to locate)..."
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-purple-500 transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
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
          <div className="p-5 rounded-3xl glass-panel space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{t('detail.coordinates')}</h3>
            <div className="h-[200px]">
              <MapOverview reports={mockReportList} zoom={15} />
            </div>
            <div className="text-[10px] text-zinc-500 font-mono space-y-1 mt-2">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-zinc-400 shrink-0">{t('detail.address')}:</span>
                <span>{report.address}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="font-bold text-zinc-400">Lat:</span>
                <span>{report.latitude.toFixed(6)}</span>
                <span className="text-zinc-700">|</span>
                <span className="font-bold text-zinc-400">Lng:</span>
                <span>{report.longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
