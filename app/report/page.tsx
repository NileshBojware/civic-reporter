'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Image as ImageIcon, Sparkles, AlertTriangle, CheckCircle, Navigation, ArrowLeft } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import imageCompression from 'browser-image-compression'
import confetti from 'canvas-confetti'

// Dynamically import MapPicker
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center">
      <span className="text-zinc-500 text-sm font-semibold">Loading Map Picker...</span>
    </div>
  ),
})

const CATEGORIES = [
  { value: 'road_damage', label: '🛣️ Road Damage (Potholes, cracks)' },
  { value: 'garbage', label: '🗑️ Garbage Pile (Overflowing bins, litter)' },
  { value: 'water_leakage', label: '💧 Water Leakage (Burst pipe, overflow)' },
  { value: 'drainage', label: '🌊 Waterlogging / Blocked Drainage' },
  { value: 'streetlight', label: '💡 Streetlight (Flickering, dead bulb)' },
  { value: 'other', label: '📌 Other Civic Issue' },
]

export default function ReportPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

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

  // Client side image compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setCompressing(true)

    // Option details for browser-image-compression
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

      alert('Report logged successfully!')
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
          <h2 className="text-xl font-bold text-white mb-2">Auth Required</h2>
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
        Back to Home
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Report a Civic Issue</h1>
        <p className="text-zinc-400 text-sm mt-1">Submit a problem with photo evidence and location details.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: General Details */}
        <div className="p-6 md:p-8 rounded-3xl glass-panel space-y-6">
          <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">1</span>
            Issue Details
          </h3>

          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">Issue Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue (e.g. Large pothole near bus stand)"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide more context, size, danger level, or references for field crews..."
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-1.5">
              <label className="text-xs font-bold text-zinc-400">Category *</label>
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
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-sm text-zinc-100 focus:outline-none focus:border-purple-500 transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-zinc-900">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Location Picker */}
        <div className="p-6 md:p-8 rounded-3xl glass-panel space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
              Location Tagging
            </h3>
            <button
              type="button"
              onClick={handleGeoLocate}
              disabled={locating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold transition disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Locating...' : 'Get GPS Location'}</span>
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
                placeholder="Enter address details or nearby landmarks manually if empty..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Evidence Upload */}
        <div className="p-6 md:p-8 rounded-3xl glass-panel space-y-6">
          <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">3</span>
            Evidence Evidence (Photo) *
          </h3>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-purple-500/40 rounded-2xl p-6 transition cursor-pointer relative bg-zinc-900/10">
            <input
              type="file"
              accept="image/*"
              required
              onChange={handlePhotoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
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
                  Compressed size: {(photo!.size / 1024).toFixed(1)} KB (Ideal for Vercel/Supabase free limits)
                </span>
                <span className="text-xs text-purple-400 font-bold mt-2 inline-block">
                  Click or drag to replace photo
                </span>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
                  <ImageIcon className="w-5 h-5 text-zinc-500" />
                </div>
                <p className="text-sm font-semibold text-zinc-200 mb-1">Click to select photo evidence</p>
                <p className="text-xs text-zinc-500">Camera pictures are automatically compressed</p>
              </div>
            )}
          </div>

          {compressing && (
            <div className="text-center py-2 text-xs text-purple-400 font-semibold animate-pulse">
              Compressing image evidence to free-tier bounds...
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
                  {duplicates.length} Similar Issue(s) Already Reported Nearby
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Other citizens have already reported similar {category.replace('_', ' ')} issues in this exact radius (within 100 meters) in the last 7 days.
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
                className="rounded border-zinc-800 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="bypass" className="text-xs font-bold text-zinc-300 cursor-pointer">
                My issue is unique / not listed above. I want to report anyway.
              </label>
            </div>
          </div>
        )}

        {/* Submit Block */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting || compressing || (duplicates.length > 0 && !bypassDuplicates)}
            className="w-full md:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none transition-all duration-200"
          >
            {submitting ? 'Submitting Issue...' : 'Submit Civic Report'}
          </button>
        </div>
      </form>
    </div>
  )
}
