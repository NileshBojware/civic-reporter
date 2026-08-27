'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Image as ImageIcon, Sparkles, AlertTriangle, Navigation, ArrowLeft, Camera, RefreshCw, X } from 'lucide-react'
import { extractGPSFromJPEG, GPSCoordinates } from '@/lib/exif'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import imageCompression from 'browser-image-compression'
import confetti from 'canvas-confetti'
import { useLanguage } from '@/lib/LanguageContext'

// Dynamically import MapPicker
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-lg bg-surface-card border border-hairline animate-pulse flex items-center justify-center">
      <span className="text-muted text-body-sm font-semibold">Loading map picker...</span>
    </div>
  ),
})

const CATEGORIES = [
  { value: 'road_damage' },
  { value: 'garbage' },
  { value: 'water_leakage' },
  { value: 'drainage' },
  { value: 'streetlight' },
  { value: 'other' },
]

export default function ReportPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const { t } = useLanguage()

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('road_damage')
  const [latitude, setLatitude] = useState(12.9716) // Default Bangalore
  const [longitude, setLongitude] = useState(77.5946)
  const [address, setAddress] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [compressing, setCompressing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Camera & Geotag States
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [autoGeotag, setAutoGeotag] = useState(true)
  const [detectedGps, setDetectedGps] = useState<GPSCoordinates | null>(null)
  const [showGpsDialog, setShowGpsDialog] = useState(false)

  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  // Geolocation trigger state
  const [locating, setLocating] = useState(false)

  // Duplicate Check state
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [checkedDuplicates, setCheckedDuplicates] = useState(false)
  const [bypassDuplicates, setBypassDuplicates] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession()
        const currentUser = data.session?.user || null
        setUser(currentUser)
        if (currentUser) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle()
          setProfile(prof)
        }
      } else {
        const mockUserStr = localStorage.getItem('civic_reporter_user')
        if (mockUserStr) {
          const mockUser = JSON.parse(mockUserStr)
          setUser(mockUser)
          setProfile(mockUser)
        }
      }
      setLoadingAuth(false)
    }
    checkAuth()
  }, [])

  // Geolocation capture
  const handleGeoLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        setLatitude(lat)
        setLongitude(lng)

        // Simple reverse geocoding using OSM Nominatim (Free)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          )
          if (res.ok) {
            const data = await res.json()
            setAddress(data.display_name || `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          } else {
            setAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          }
        } catch (err) {
          setAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        }
        setLocating(false)
      },
      (err) => {
        console.error(err)
        alert('Could not retrieve your location. Please drop the pin manually.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Handle Map Pin adjustments
  const handleMapChange = async (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    
    // Reverse geocode new marker coordinates
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      if (res.ok) {
        const data = await res.json()
        setAddress(data.display_name || `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      }
    } catch (err) {
      // Keep existing address or show coordinates
    }
  }

  // Client side image compression and processing helper
  const processAndPreviewPhoto = async (file: File) => {
    setCompressing(true)
    setError('')
    const options = {
      maxSizeMB: 0.15, // Compress to <150kb
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    }

    try {
      const compressedFile = await imageCompression(file, options)
      setPhoto(compressedFile)

      // Convert compressed photo to base64 URL for rendering preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (err) {
      console.error('Image compression failed:', err)
      setError('Failed to compress image. Try a smaller file.')
    } finally {
      setCompressing(false)
    }
  }

  // Handle file selection from browse input
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Try to read EXIF before compression
    if (file.type === 'image/jpeg') {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          try {
            const gps = extractGPSFromJPEG(event.target.result)
            if (gps) {
              setDetectedGps(gps)
              setShowGpsDialog(true)
            }
          } catch (err) {
            console.error('EXIF reading error:', err)
          }
        }
      }
      reader.readAsArrayBuffer(file)
    }

    await processAndPreviewPhoto(file)
  }

  // Camera handling functions
  const startCamera = async (mode: 'user' | 'environment' = 'environment') => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      setCameraStream(stream)
      setCameraActive(true)
      
      // Delay source attachment slightly to ensure element is ref-populated
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 50)
    } catch (err) {
      console.error('Camera access failed:', err)
      alert(t('form.cameraNotSupported'))
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
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
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob(async (blob) => {
      if (!blob) return
      
      const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      stopCamera()
      await processAndPreviewPhoto(file)

      if (autoGeotag) {
        getDeviceLocationForGeotag()
      }
    }, 'image/jpeg', 0.95)
  }

  const getDeviceLocationForGeotag = () => {
    if (!navigator.geolocation) return
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        setLatitude(lat)
        setLongitude(lng)
        
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          )
          if (res.ok) {
            const data = await res.json()
            setAddress(data.display_name || `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          } else {
            setAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          }
        } catch (err) {
          setAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        }
      },
      (err) => {
        console.error('Failed to get location for geotag:', err)
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  const applyPhotoGps = async () => {
    if (!detectedGps) return
    const { latitude: lat, longitude: lng } = detectedGps
    setLatitude(lat)
    setLongitude(lng)
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      if (res.ok) {
        const data = await res.json()
        setAddress(data.display_name || `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      } else {
        setAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      }
    } catch (err) {
      setAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    }
    
    setShowGpsDialog(false)
  }

  // Trigger duplicate check when category + coordinates are set
  const triggerDuplicateCheck = async () => {
    if (!category || !latitude || !longitude) return

    try {
      const res = await fetch(
        `/api/reports?duplicateCheck=true&category=${category}&latitude=${latitude}&longitude=${longitude}`
      )
      if (res.ok) {
        const data = await res.json()
        setDuplicates(data.duplicates || [])
        setCheckedDuplicates(true)
        if (data.duplicates && data.duplicates.length > 0) {
          setBypassDuplicates(false)
        } else {
          setBypassDuplicates(true)
        }
      }
    } catch (err) {
      console.error(err)
      setBypassDuplicates(true) // Proceed in case of API failure
    }
  }

  useEffect(() => {
    if (category && latitude && longitude) {
      triggerDuplicateCheck()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, latitude, longitude])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !category || !address || !photoUrl) {
      setError('Please fill in all required fields and upload an image.')
      return
    }

    if (duplicates.length > 0 && !bypassDuplicates) {
      setError('Please review similar reports nearby before submitting.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      let finalImageUrl = photoUrl

      if (isSupabaseConfigured && supabase && photo) {
        const fileExt = photo.name.split('.').pop()
        const fileName = `evidence_${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('reports-evidence')
          .upload(filePath, photo)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('reports-evidence')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrlData.publicUrl
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          latitude,
          longitude,
          address,
          image_url: finalImageUrl,
          user_id: user.id,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to submit report')
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#111111', '#10b981'],
      })

      alert(t('form.successTitle'))
      router.push('/my-reports')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save issue report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingAuth) {
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
          <AlertTriangle className="w-12 h-12 text-status-reported mx-auto mb-4" />
          <h2 className="text-title-lg font-bold text-ink mb-2">Auth Required</h2>
          <p className="text-body text-body-sm mb-6 leading-relaxed">
            You must be logged in as a citizen to submit a new civic issue report.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="btn-primary w-full flex items-center justify-center"
            >
              Log In Now
            </Link>
            <Link
              href="/signup"
              className="btn-secondary w-full flex items-center justify-center"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 md:py-16 bg-canvas">
      {/* Back button link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-muted hover:text-ink mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('form.btnBack')}</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-display-md text-ink mb-2">{t('form.title')}</h1>
        <p className="text-body-sm text-body">{t('form.subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-body-sm font-semibold leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: General Details */}
        <div className="p-6 md:p-8 rounded-lg bg-canvas border border-hairline shadow-sm space-y-6">
          <h3 className="text-title-md font-bold text-ink border-b border-hairline pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary text-on-primary flex items-center justify-center text-xs font-bold">1</span>
            <span>Issue Details</span>
          </h3>

          <div>
            <label className="text-caption font-bold text-muted block mb-1.5">{t('form.fieldTitle')} *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              className="w-full px-4 py-2.5 h-10 rounded-md bg-canvas border border-hairline text-body-md text-ink placeholder-muted focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="text-caption font-bold text-muted block mb-1.5">{t('form.fieldDesc')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={t('form.descPlaceholder')}
              className="w-full px-4 py-3 rounded-md bg-canvas border border-hairline text-body-md text-ink placeholder-muted focus:outline-none focus:border-primary transition resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-1.5">
              <label className="text-caption font-bold text-muted">{t('form.fieldCategory')} *</label>
              <button
                type="button"
                disabled
                className="text-[10px] text-muted-soft font-bold bg-surface-soft px-2 py-0.5 rounded border border-hairline flex items-center gap-1 cursor-not-allowed group relative"
              >
                <Sparkles className="w-3 h-3 text-brand-accent animate-pulse" />
                Auto-detect from Photo (Pro)
              </button>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 h-10 rounded-md bg-canvas border border-hairline text-body-md text-ink focus:outline-none focus:border-primary transition cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t('category.' + c.value)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Location Picker */}
        <div className="p-6 md:p-8 rounded-lg bg-canvas border border-hairline shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
            <h3 className="text-title-md font-bold text-ink flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary text-on-primary flex items-center justify-center text-xs font-bold">2</span>
              <span>{t('form.fieldLocation')}</span>
            </h3>
            <button
              type="button"
              onClick={handleGeoLocate}
              disabled={locating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-canvas hover:bg-surface-soft text-body hover:text-ink border border-hairline text-caption font-semibold transition disabled:opacity-50 cursor-pointer h-9"
            >
              <Navigation className={`w-3.5 h-3.5 text-brand-accent ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? t('form.locating') : t('form.btnLocate')}</span>
            </button>
          </div>

          <div className="rounded-lg overflow-hidden border border-hairline">
            <MapPicker lat={latitude} lng={longitude} onChange={handleMapChange} />
          </div>

          <div>
            <label className="text-caption font-bold text-muted block mb-1.5">Detected Address / Landmarks *</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted shrink-0" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('form.locPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 h-10 rounded-md bg-canvas border border-hairline text-body-md text-ink placeholder-muted focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Evidence Upload */}
        <div className="p-6 md:p-8 rounded-lg bg-canvas border border-hairline shadow-sm space-y-6">
          <h3 className="text-title-md font-bold text-ink border-b border-hairline pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary text-on-primary flex items-center justify-center text-xs font-bold">3</span>
            <span>{t('form.fieldPhoto')} *</span>
          </h3>

          {cameraActive ? (
            <div className="relative w-full rounded-lg overflow-hidden border border-hairline bg-surface-dark p-2 flex flex-col items-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-[350px] object-cover rounded-md"
              />
              <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6 z-20">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-3 rounded-full bg-surface-dark-elevated hover:bg-surface-dark text-on-dark-soft hover:text-on-dark transition border border-hairline-soft cursor-pointer shadow-lg"
                  title={t('form.closeCamera')}
                >
                  <X className="w-5 h-5" />
                </button>
                
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-14 h-14 rounded-full bg-canvas hover:bg-surface-soft border-4 border-surface-dark flex items-center justify-center transition hover:scale-105 shadow-xl cursor-pointer"
                  title={t('form.capturePhoto')}
                >
                  <div className="w-6 h-6 rounded-full bg-primary animate-pulse" />
                </button>

                <button
                  type="button"
                  onClick={toggleCamera}
                  className="p-3 rounded-full bg-surface-dark-elevated hover:bg-surface-dark text-on-dark-soft hover:text-on-dark transition border border-hairline-soft cursor-pointer shadow-lg"
                  title={t('form.switchCamera')}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-4 left-4 bg-surface-dark-elevated text-[10px] font-bold text-on-dark px-3 py-1 rounded-full border border-hairline-soft flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-status-resolved animate-ping" />
                <span>Live Camera</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-hairline hover:border-muted rounded-lg p-8 transition bg-surface-soft/30 relative">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              {photoUrl ? (
                <div className="w-full text-center relative z-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Evidence Preview"
                    className="max-h-52 rounded-md mx-auto border border-hairline mb-3 object-contain"
                  />
                  <span className="text-[10px] text-muted font-semibold block">
                    Compressed size: {(photo!.size / 1024).toFixed(1)} KB
                  </span>
                  
                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary h-9 py-1 px-4 text-caption"
                    >
                      {t('form.btnBrowse')}
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="btn-secondary h-9 py-1 px-4 text-caption flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-brand-accent" />
                      <span>{t('form.openCamera')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center mx-auto mb-3 border border-hairline">
                    <ImageIcon className="w-5 h-5 text-muted" />
                  </div>
                  <p className="text-body-sm font-bold text-ink mb-1">Select photo evidence</p>
                  <p className="text-caption text-muted mb-5">{t('form.photoHelp')}</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto btn-secondary"
                    >
                      {t('form.btnBrowse')}
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="w-full sm:w-auto btn-primary flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{t('form.openCamera')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {compressing && (
            <div className="text-center py-2 text-caption text-brand-accent font-semibold animate-pulse">
              Compressing photo...
            </div>
          )}

          {/* Device Geotag toggle */}
          {!photoUrl && !cameraActive && (
            <div className="flex items-center gap-2 pt-2 border-t border-hairline-soft">
              <input
                type="checkbox"
                id="deviceGeotag"
                checked={autoGeotag}
                onChange={(e) => setAutoGeotag(e.target.checked)}
                className="rounded border-hairline text-primary focus:ring-primary cursor-pointer w-4 h-4"
              />
              <label htmlFor="deviceGeotag" className="text-caption font-bold text-muted cursor-pointer select-none">
                {t('form.deviceGeotagToggle')}
              </label>
            </div>
          )}

          {/* EXIF GPS detected Dialog banner */}
          {showGpsDialog && detectedGps && (
            <div className="p-4 rounded-md bg-brand-accent/5 border border-brand-accent/20 space-y-3 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-body-sm font-bold text-ink">{t('form.gpsDetectedTitle')}</h4>
                  <p className="text-caption text-body mt-0.5 leading-relaxed">{t('form.gpsDetectedDesc')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyPhotoGps}
                  className="btn-primary h-8 py-1 px-3 text-caption"
                >
                  {t('form.btnApplyGps')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGpsDialog(false)}
                  className="btn-secondary h-8 py-1 px-3 text-caption"
                >
                  {t('form.btnIgnoreGps')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Duplicate warning box */}
        {duplicates.length > 0 && !bypassDuplicates && (
          <div className="p-6 rounded-lg bg-status-reported/10 border border-status-reported/20 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-status-reported shrink-0 mt-0.5" />
              <div>
                <h4 className="text-body-sm font-bold text-status-reported">
                  {t('form.duplicateDetected')}
                </h4>
                <p className="text-caption text-body mt-1 leading-relaxed">
                  {t('form.duplicateDesc')}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-hairline-soft">
              {duplicates.map((dup) => (
                <div key={dup.id} className="flex justify-between items-center gap-3 p-3 bg-canvas rounded-md border border-hairline">
                  <div>
                    <span className="text-caption font-bold text-ink block truncate max-w-[300px]">
                      {dup.title}
                    </span>
                    <span className="text-[10px] text-muted block">{dup.address}</span>
                  </div>
                  <Link
                    href={`/reports/${dup.id}`}
                    target="_blank"
                    className="text-caption font-bold text-brand-accent hover:underline shrink-0"
                  >
                    Inspect Issue &rarr;
                  </Link>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="bypass"
                checked={bypassDuplicates}
                onChange={(e) => setBypassDuplicates(e.target.checked)}
                className="rounded border-hairline text-primary focus:ring-primary cursor-pointer w-4 h-4"
              />
              <label htmlFor="bypass" className="text-caption font-bold text-ink cursor-pointer select-none">
                {t('form.bypassDuplicate')}
              </label>
            </div>
          </div>
        )}

        {/* Submit Block */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting || compressing || (duplicates.length > 0 && !bypassDuplicates)}
            className="btn-primary w-full md:w-auto px-10 h-12 text-body-sm shadow-sm"
          >
            {submitting ? t('form.btnSubmitting') : t('form.btnSubmit')}
          </button>
        </div>
      </form>
    </div>
  )
}
