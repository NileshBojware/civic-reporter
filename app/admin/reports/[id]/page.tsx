'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Shield, CheckCircle, XCircle, Play, AlertCircle, FileText, Image as ImageIcon, AlertTriangle, ShieldCheck, Building2, UserCheck, Lock, ShieldAlert, Camera, RefreshCw, X, Upload, Trash2 } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { StatusBadge } from '@/components/StatusBadge'
import imageCompression from 'browser-image-compression'
import { useLanguage } from '@/lib/LanguageContext'
import { getCategoryStyles, getCategoryFormattedLabel } from '@/lib/categories'
import { DEPARTMENTS, getDepartmentByCategory, getAdminDepartment, isCategoryInDepartment } from '@/lib/departments'
import { getLocalizedReport } from '@/lib/contentTranslator'

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

  // Camera states & refs
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null)

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

      const isDeptAdmin = currentUser?.email && DEPARTMENTS.some(d => d.adminEmail.toLowerCase() === currentUser.email.toLowerCase())
      const isAdmin = currentProf?.role === 'admin' || isDeptAdmin || currentUser?.user_metadata?.role === 'admin'

      if (!currentUser || !isAdmin) {
        setLoading(false)
        return
      }

      fetchReportDetails()
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const localized = report ? getLocalizedReport(report, language) : null
  const mockReportList = localized ? [localized] : []

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  const processResolutionPhoto = async (file: File) => {
    setCompressing(true)
    setError('')

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

  const handleResolutionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await processResolutionPhoto(files[0])
  }

  const startCamera = async (mode: 'user' | 'environment' = 'environment') => {
    setError('')
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setCameraStream(stream)
      setCameraActive(true)

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 50)
    } catch (err) {
      console.warn('Live camera getUserMedia failed, triggering native camera input:', err)
      if (cameraInputRef.current) {
        cameraInputRef.current.click()
      } else {
        setError('Camera permission denied or camera not supported.')
      }
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setCameraActive(false)
  }

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `admin_resolution_${Date.now()}.jpg`, { type: 'image/jpeg' })
      stopCamera()
      await processResolutionPhoto(file)
    }, 'image/jpeg', 0.95)
  }

  const removeResolutionPhoto = () => {
    setResolutionPhoto(null)
    setResolutionPhotoUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleStartFix = async () => {
    if (!isDirectJurisdiction) {
      setError(`Permission denied: Only administrators of ${reportDept.name} can update this ticket.`)
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'in_progress',
          admin_department_id: currentAdminDept?.id,
        }),
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
    if (!isDirectJurisdiction) {
      setError(`Permission denied: Only administrators of ${reportDept.name} can update this ticket.`)
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'verified',
          admin_department_id: currentAdminDept?.id,
        }),
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
    if (!isDirectJurisdiction) {
      setError(`Permission denied: Only administrators of ${reportDept.name} can update this ticket.`)
      return
    }
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
          admin_department_id: currentAdminDept?.id,
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
    if (!isDirectJurisdiction) {
      setError(`Permission denied: Only administrators of ${reportDept.name} can update this ticket.`)
      return
    }
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
          admin_department_id: currentAdminDept?.id,
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
    if (!isDirectJurisdiction) {
      setError(`Permission denied: Only administrators of ${reportDept.name} can update this ticket.`)
      return
    }
    if (!window.confirm('Reset this ticket back to Pending? This will delete resolution or rejection notes.')) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'pending',
          admin_department_id: currentAdminDept?.id,
        }),
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

  const isDeptAdmin = user?.email && DEPARTMENTS.some(d => d.adminEmail.toLowerCase() === user.email.toLowerCase())
  const isAdmin = profile?.role === 'admin' || isDeptAdmin || user?.user_metadata?.role === 'admin'

  if (!user || !isAdmin) {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-16 bg-canvas">
        <div className="w-full max-w-md p-8 rounded-xl border border-hairline bg-canvas text-center shadow-lg space-y-4">
          <AlertTriangle className="w-12 h-12 text-status-rejected mx-auto" />
          <h2 className="text-title-lg font-bold text-ink">Department Admin Access Required</h2>
          <p className="text-body text-body-sm leading-relaxed">
            Please log in with municipal departmental administrative credentials.
          </p>
          <Link
            href="/login"
            className="btn-primary w-full flex items-center justify-center h-10 shadow-sm"
          >
            Log In as Department Admin
          </Link>
        </div>
      </div>
    )
  }

  if (!report) return null

  const reportDept = getDepartmentByCategory(report.category)
  const currentAdminDept = getAdminDepartment(user, profile)
  const isDirectJurisdiction = Boolean(
    currentAdminDept?.id === 'grievance' ||
    (currentAdminDept && currentAdminDept.id === reportDept.id) ||
    (currentAdminDept && isCategoryInDepartment(report.category, currentAdminDept.id))
  )

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 bg-canvas text-body">
      {/* Back to dashboard */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-muted hover:text-ink mb-6 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('adminDetail.btnBackDash')}</span>
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${reportDept.badgeColor}`}>
              {reportDept.name}
            </span>
            {isDirectJurisdiction ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Direct Jurisdiction
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                <Lock className="w-2.5 h-2.5" /> Cross-Department (Read-Only)
              </span>
            )}
          </div>
          <h1 className="text-display-sm text-ink mb-0.5">{t('adminDetail.title')}</h1>
          <p className="text-[11px] text-muted font-mono">ID: {report.id}</p>
        </div>

        <div className="flex items-center gap-2 text-caption text-muted font-bold bg-surface-soft border border-hairline px-3 py-1.5 rounded-lg">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{currentAdminDept ? `${currentAdminDept.shortName} Admin` : 'Municipal Admin'}</span>
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
          <div className="p-6 md:p-8 rounded-2xl bg-canvas border border-hairline shadow-sm space-y-6">
            <div className="flex justify-between items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-caption font-semibold border ${getCategoryStyles(report.category)}`}>
                {getCategoryFormattedLabel(report.category)}
              </span>
              <StatusBadge status={report.status} />
            </div>

            <div>
              <h2 className="text-title-lg font-bold text-ink mb-2">{localized?.title || report.title}</h2>
              <p className="text-body-md text-body leading-relaxed">{localized?.description || report.description || 'No description.'}</p>
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

          {/* Action Dashboard Panel (Direct Jurisdiction) or Read-Only Notice (Cross-Department) */}
          {!isDirectJurisdiction ? (
            <div className="p-6 md:p-8 rounded-2xl bg-canvas border border-hairline shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-hairline text-ink">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-title-sm font-bold">Cross-Department Read-Only View</h3>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-caption uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Administrative Jurisdiction Restricted</span>
                </div>
                <p className="text-body-sm text-body leading-relaxed">
                  This report is assigned to the <strong className="text-ink">{reportDept.name} ({reportDept.shortName})</strong>.
                </p>
                <p className="text-caption text-muted leading-relaxed">
                  As an administrator of <strong>{currentAdminDept?.name || 'another department'}</strong>, you can inspect full ticket details, location, evidence, and comments for coordination, but <strong>you cannot change the ticket status or execute administrative actions</strong>.
                </p>
              </div>

              <div className="pt-2 text-caption text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-hairline">
                <span>Responsible Department Contact:</span>
                <code className="text-xs font-mono font-bold text-ink bg-surface-soft px-2 py-1 rounded border border-hairline">
                  {reportDept.adminEmail}
                </code>
              </div>
            </div>
          ) : (
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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-muted block uppercase tracking-wider">
                          Resolution Photo Evidence *
                        </label>
                        {resolutionPhotoUrl && !cameraActive && (
                          <button
                            type="button"
                            onClick={removeResolutionPhoto}
                            className="text-[11px] text-status-rejected hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Photo</span>
                          </button>
                        )}
                      </div>

                      {/* Hidden file inputs: one standard file picker and one direct camera capture */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleResolutionPhotoUpload}
                        className="hidden"
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleResolutionPhotoUpload}
                        className="hidden"
                      />

                      {cameraActive ? (
                        /* Live Camera Viewfinder */
                        <div className="relative w-full rounded-xl overflow-hidden border border-hairline bg-slate-950 p-2 flex flex-col items-center shadow-lg">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full max-h-[300px] object-cover rounded-lg"
                          />
                          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 z-20">
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="p-2.5 rounded-full bg-slate-900/90 text-white/80 hover:text-white border border-slate-700 cursor-pointer shadow-lg hover:scale-105 transition"
                              title="Cancel Camera"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="w-13 h-13 rounded-full bg-white hover:bg-slate-100 border-4 border-slate-900 flex items-center justify-center transition hover:scale-110 shadow-2xl cursor-pointer"
                              title="Capture Photo"
                            >
                              <div className="w-5 h-5 rounded-full bg-primary animate-pulse" />
                            </button>

                            <button
                              type="button"
                              onClick={toggleCamera}
                              className="p-2.5 rounded-full bg-slate-900/90 text-white/80 hover:text-white border border-slate-700 cursor-pointer shadow-lg hover:scale-105 transition"
                              title="Switch Camera (Front/Back)"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="absolute top-3 left-3 bg-slate-900/90 text-[10px] font-bold text-white px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>Live Camera Active</span>
                          </div>
                        </div>
                      ) : resolutionPhotoUrl ? (
                        /* Preview of captured/selected photo */
                        <div className="p-4 rounded-xl border border-hairline bg-canvas text-center space-y-3">
                          <div className="relative inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolutionPhotoUrl}
                              alt="Resolution evidence preview"
                              className="max-h-44 rounded-lg mx-auto border border-hairline object-contain shadow-sm"
                            />
                            <span className="inline-flex items-center gap-1 absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow-sm">
                              <CheckCircle className="w-3 h-3" /> Ready
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => startCamera()}
                              className="btn-secondary h-8 px-3 text-[11px] font-semibold flex items-center gap-1.5 rounded-lg"
                            >
                              <Camera className="w-3.5 h-3.5 text-primary" />
                              <span>Retake with Camera</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="btn-secondary h-8 px-3 text-[11px] font-semibold flex items-center gap-1.5 rounded-lg"
                            >
                              <Upload className="w-3.5 h-3.5 text-muted" />
                              <span>Choose from Files</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Choose Camera or File */
                        <div className="border-2 border-dashed border-hairline hover:border-primary/50 rounded-xl p-5 transition bg-canvas space-y-3 text-center">
                          <div className="flex justify-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Camera className="w-5 h-5" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center text-muted">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          </div>

                          <div>
                            <span className="text-body-sm font-bold text-ink block">
                              Add Resolution Proof Photo
                            </span>
                            <span className="text-[11px] text-muted">
                              Take a live photo on site or upload completion image from device
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => startCamera()}
                              className="btn-primary w-full sm:w-auto h-9 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Take Photo with Camera</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="btn-secondary w-full sm:w-auto h-9 px-4 text-xs font-semibold flex items-center justify-center gap-2"
                            >
                              <Upload className="w-4 h-4 text-muted" />
                              <span>Upload from Files</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {compressing && (
                        <span className="text-[10px] text-brand-accent font-bold block mt-1.5 text-center animate-pulse">
                          Optimizing image for database storage...
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
          )}
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
                <span className="leading-relaxed">{localized?.address || report.address}</span>
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
