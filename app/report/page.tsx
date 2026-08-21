'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Image as ImageIcon, Sparkles, AlertTriangle, CheckCircle, Navigation, ArrowLeft, Camera, RefreshCw, X, Check } from 'lucide-react'
import { extractGPSFromJPEG, GPSCoordinates } from '@/lib/exif'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import imageCompression from 'browser-image-compression'
import confetti from 'canvas-confetti'
import { useLanguage } from '@/lib/LanguageContext'

// Dynamically import MapPicker
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center">
      <span className="text-zinc-500 text-sm font-semibold">Loading...</span>
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
          // Found duplicate, show warning, but let them choose
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

  // Run duplicate check automatically on step transition/validation
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
        // Upload image evidence to Supabase bucket
        const fileExt = photo.name.split('.').pop()
        const fileName = `evidence_${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('reports-evidence')
          .upload(filePath, photo)

        if (uploadError) throw uploadError

        // Get public image URL
        const { data: publicUrlData } = supabase.storage
          .from('reports-evidence')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrlData.publicUrl
      }

      // Create Report API call
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

      // Confetti feedback!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#6366f1', '#3b82f6'],
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
      <div className="flex-grow flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md p-8 rounded-3xl glass-panel text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Auth Required</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            You must be logged in as a citizen to submit a new civic issue report.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl transition"
            >
              Log In Now
            </Link>
            <Link
              href="/signup"
              className="py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-2xl hover:bg-zinc-800 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('form.btnBack')}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-100">{t('form.title')}</h1>
        <p className="text-zinc-400 text-sm mt-1">{t('form.subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: General Details */}
        <div className="p-6 md:p-8 rounded-3xl glass-panel space-y-6">
          <h3 className="text-base font-bold text-zinc-100 border-b border-zinc-800 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">1</span>
            {t('form.fieldTitle')}
          </h3>

          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">{t('form.fieldTitle')} *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">{t('form.fieldDesc')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('form.descPlaceholder')}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-1.5">
              <label className="text-xs font-bold text-zinc-400">{t('form.fieldCategory')} *</label>
              <button
                type="button"
                disabled
                className="text-[10px] text-zinc-500 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850 flex items-center gap-1 cursor-not-allowed group relative"
              >
                <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                Auto-detect from Photo (Pro)
                <span className="absolute bottom-full right-0 bg-zinc-950 text-zinc-400 border border-zinc-800 text-[8px] p-1 rounded hidden group-hover:block whitespace-nowrap mb-1">
                  Coming soon.
                </span>
              </button>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-sm text-zinc-100 focus:outline-none focus:border-purple-500 transition cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-zinc-900">
                  {t('category.' + c.value)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Location Picker */}
        <div className="p-6 md:p-8 rounded-3xl glass-panel space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-3">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
              {t('form.fieldLocation')}
            </h3>
            <button
              type="button"
              onClick={handleGeoLocate}
              disabled={locating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? t('form.locating') : t('form.btnLocate')}</span>
            </button>
          </div>

          <MapPicker lat={latitude} lng={longitude} onChange={handleMapChange} />

          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">Detected Address / Landmarks *</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('form.locPlaceholder')}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Evidence Upload */}
        <div className="p-6 md:p-8 rounded-3xl glass-panel space-y-6">
          <h3 className="text-base font-bold text-zinc-100 border-b border-zinc-800 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">3</span>
            {t('form.fieldPhoto')} *
          </h3>

          {cameraActive ? (
            <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black flex flex-col items-center p-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-[350px] object-cover rounded-xl"
              />
              {/* Camera Overlays / Controls */}
              <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6 z-20">
                {/* Cancel Camera */}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white transition border border-zinc-800 backdrop-blur-sm cursor-pointer shadow-lg"
                  title={t('form.closeCamera')}
                >
                  <X className="w-5 h-5" />
                </button>
                
                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-14 h-14 rounded-full bg-white hover:bg-zinc-200 border-4 border-zinc-950 flex items-center justify-center transition hover:scale-105 shadow-xl cursor-pointer"
                  title={t('form.capturePhoto')}
                >
                  <div className="w-6 h-6 rounded-full bg-purple-600 animate-pulse" />
                </button>

                {/* Switch Camera */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="p-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white transition border border-zinc-800 backdrop-blur-sm cursor-pointer shadow-lg"
                  title={t('form.switchCamera')}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur-sm text-[10px] font-bold text-purple-400 px-3 py-1 rounded-full border border-purple-500/20 flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                <span>Live Camera</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-purple-500/40 rounded-2xl p-6 transition bg-zinc-900/10 relative">
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
                    className="max-h-52 rounded-xl mx-auto border border-zinc-850 mb-3 object-contain"
                  />
                  <span className="text-[10px] text-zinc-500 font-bold block">
                    Compressed size: {(photo!.size / 1024).toFixed(1)} KB
                  </span>
                  
                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {t('form.btnBrowse')}
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {t('form.openCamera')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
                    <ImageIcon className="w-5 h-5 text-zinc-500" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-200 mb-1">Select photo evidence</p>
                  <p className="text-xs text-zinc-500 mb-5">{t('form.photoHelp')}</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {t('form.btnBrowse')}
                    </button>
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/10"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {t('form.openCamera')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {compressing && (
            <div className="text-center py-2 text-xs text-purple-400 font-semibold animate-pulse">
              Compressing...
            </div>
          )}

          {/* Device Geotag toggle */}
          {!photoUrl && !cameraActive && (
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/40">
              <input
                type="checkbox"
                id="deviceGeotag"
                checked={autoGeotag}
                onChange={(e) => setAutoGeotag(e.target.checked)}
                className="rounded border-zinc-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="deviceGeotag" className="text-xs font-semibold text-zinc-400 cursor-pointer select-none">
                {t('form.deviceGeotagToggle')}
              </label>
            </div>
          )}

          {/* EXIF GPS detected Dialog banner */}
          {showGpsDialog && detectedGps && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-purple-400 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-100">{t('form.gpsDetectedTitle')}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{t('form.gpsDetectedDesc')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyPhotoGps}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-extrabold transition cursor-pointer shadow-sm"
                >
                  {t('form.btnApplyGps')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGpsDialog(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-350 text-[10px] font-bold transition cursor-pointer"
                >
                  {t('form.btnIgnoreGps')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Duplicate warning box */}
        {duplicates.length > 0 && !bypassDuplicates && (
          <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold text-amber-500">
                  {t('form.duplicateDetected')}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {t('form.duplicateDesc')}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-zinc-800/40">
              {duplicates.map((dup) => (
                <div key={dup.id} className="flex justify-between items-center gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-900">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block truncate max-w-[300px]">
                      {dup.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">{dup.address}</span>
                  </div>
                  <Link
                    href={`/reports/${dup.id}`}
                    target="_blank"
                    className="text-[10px] font-extrabold text-purple-400 hover:text-purple-300 hover:underline shrink-0"
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
                className="rounded border-zinc-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="bypass" className="text-xs font-bold text-zinc-300 cursor-pointer select-none">
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
            className="w-full md:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none transition-all duration-200 cursor-pointer"
          >
            {submitting ? t('form.btnSubmitting') : t('form.btnSubmit')}
          </button>
        </div>
      </form>
    </div>
  )
}
