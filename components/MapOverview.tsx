'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { getCategoryFormattedLabel } from '@/lib/categories'
import { useTheme } from '@/lib/ThemeContext'
import { useLanguage } from '@/lib/LanguageContext'
import { getLocalizedReport } from '@/lib/contentTranslator'
import { Maximize2, RefreshCw, Lock, Unlock, Layers } from 'lucide-react'

// Fix default Leaflet marker icon paths in case standard markers are used
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})
if (typeof window !== 'undefined' && L.Marker.prototype.options) {
  L.Marker.prototype.options.icon = DefaultIcon
}

export interface Report {
  id: string
  title: string
  category: string
  latitude: number
  longitude: number
  address: string
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'verified'
  image_url?: string | null
}

interface MapOverviewProps {
  reports: Report[]
  center?: [number, number]
  zoom?: number
  className?: string
  interactive?: boolean
  autoFitBounds?: boolean
  scrollWheelZoom?: boolean
}

// Custom pulsing icons mapped to status using design-system status colors
const getCustomIcon = (status: Report['status']) => {
  const colorMap: Record<Report['status'], { dot: string; ping: string }> = {
    pending:     { dot: 'bg-amber-400 border-amber-200',     ping: 'bg-amber-300' },
    verified:    { dot: 'bg-blue-500 border-blue-300',       ping: 'bg-blue-400' },
    in_progress: { dot: 'bg-violet-500 border-violet-300',   ping: 'bg-violet-400' },
    resolved:    { dot: 'bg-emerald-500 border-emerald-300', ping: 'bg-emerald-400' },
    rejected:    { dot: 'bg-red-500 border-red-300',         ping: 'bg-red-400' },
  }

  const colors = colorMap[status] ?? colorMap.pending

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 pointer-events-auto cursor-pointer">
        <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full ${colors.ping} opacity-60"></span>
        <div class="relative w-4 h-4 rounded-full ${colors.dot} border-2 shadow-md"></div>
      </div>
    `,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10],
  })
}

// Subcomponent inside MapContainer to intercept wheel & touchpad pinch events.
// Ensures touchpad pinch or mouse wheel NEVER zooms or distorts the whole website page.
function MapGestureHandler({
  interactive = true,
  isLocked = false,
  scrollWheelZoom = true,
}: {
  interactive?: boolean
  isLocked?: boolean
  scrollWheelZoom?: boolean
}) {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    if (!container) return

    // Isolate container touch actions and scroll chaining
    container.style.touchAction = isLocked ? 'auto' : 'pan-x pan-y'
    container.style.overscrollBehavior = 'contain'

    const handleWheel = (e: WheelEvent) => {
      // 1. Touchpad Pinch-to-Zoom:
      // Chrome, Edge, and Safari set e.ctrlKey = true for trackpad / precision touchpad pinches.
      // Calling e.preventDefault() on a non-passive listener stops the entire browser page from zooming!
      if (e.ctrlKey) {
        e.preventDefault()
        e.stopPropagation()

        if (!interactive || isLocked) return

        // Smooth fractional continuous zoom around cursor location
        const zoomDelta = -e.deltaY * 0.015
        const currentZoom = map.getZoom()
        const targetZoom = Math.min(Math.max(currentZoom + zoomDelta, map.getMinZoom() || 1), map.getMaxZoom() || 20)

        const containerPoint = map.mouseEventToContainerPoint(e)
        const latlng = map.containerPointToLatLng(containerPoint)
        map.setZoomAround(latlng, targetZoom, { animate: false })
        return
      }

      // 2. Standard Mouse Wheel Zooming:
      if (scrollWheelZoom && interactive && !isLocked) {
        // Prevent scrolling the parent page while hovering the active map
        e.preventDefault()
        e.stopPropagation()

        const zoomDelta = e.deltaY < 0 ? 0.5 : -0.5
        const currentZoom = map.getZoom()
        const targetZoom = Math.min(Math.max(currentZoom + zoomDelta, map.getMinZoom() || 1), map.getMaxZoom() || 20)

        const containerPoint = map.mouseEventToContainerPoint(e)
        const latlng = map.containerPointToLatLng(containerPoint)
        map.setZoomAround(latlng, targetZoom, { animate: true })
      }
    }

    // Must be { passive: false } so e.preventDefault() reliably halts browser page zoom
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [map, interactive, isLocked, scrollWheelZoom])

  return null
}

// Subcomponent inside MapContainer to control sizing, views, and bounds
function MapController({
  reports,
  center,
  zoom,
  autoFitBounds = false,
}: {
  reports: Report[]
  center: [number, number]
  zoom: number
  autoFitBounds?: boolean
}) {
  const map = useMap()
  const initialFitDone = useRef(false)

  // Invalidate size proactively on mount and whenever the container or window resizes
  useEffect(() => {
    map.invalidateSize()

    // Multiple staggered ticks ensure Next.js transitions and responsive layout settle
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 150),
      setTimeout(() => map.invalidateSize(), 400),
      setTimeout(() => map.invalidateSize(), 800),
    ]

    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)

    // Observe container dimension changes via ResizeObserver
    const container = map.getContainer()
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize()
      })
      resizeObserver.observe(container)
    }

    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [map])

  // Sync view when reports are loaded or filtered
  useEffect(() => {
    map.invalidateSize()

    if (reports.length === 1) {
      map.setView([reports[0].latitude, reports[0].longitude], zoom, { animate: true })
    } else if (reports.length > 1 && autoFitBounds) {
      // Fit bounds if autoFitBounds is requested
      const bounds = L.latLngBounds(reports.map((r) => [r.latitude, r.longitude]))
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [35, 35],
          maxZoom: 15,
          animate: initialFitDone.current,
        })
        initialFitDone.current = true
      }
    } else {
      map.setView(center, zoom, { animate: false })
    }
  }, [map, reports, center, zoom, autoFitBounds])

  return null
}

export default function MapOverview({
  reports = [],
  center = [19.8762, 75.3433], // Default Maharashtra, Chhatrapati Sambhaji Nagar center
  zoom = 13,
  className = '',
  interactive = true,
  autoFitBounds = false,
  scrollWheelZoom = true,
}: MapOverviewProps) {
  const [mounted, setMounted] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets')
  const { theme } = useTheme()
  const { language, t } = useLanguage()
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter out invalid coordinates
  const validReports = useMemo(() => {
    return (reports || []).filter(
      (r) =>
        r &&
        typeof r.latitude === 'number' &&
        typeof r.longitude === 'number' &&
        !isNaN(r.latitude) &&
        !isNaN(r.longitude)
    )
  }, [reports])

  // Center coordinates calculation
  const mapCenter: [number, number] = useMemo(() => {
    if (validReports.length === 1) {
      return [validReports[0].latitude, validReports[0].longitude]
    }
    return center
  }, [validReports, center])

  // Fast, reliable open cartography without API keys or watermarks
  const tileConfig = useMemo(() => {
    if (mapStyle === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        subdomains: [] as string[],
        maxZoom: 19,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    }

    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }
  }, [mapStyle])

  // Fit all pins handler
  const handleFitBounds = () => {
    if (!mapRef.current) return
    if (validReports.length > 1) {
      const bounds = L.latLngBounds(validReports.map((r) => [r.latitude, r.longitude]))
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true })
      }
    } else if (validReports.length === 1) {
      mapRef.current.setView([validReports[0].latitude, validReports[0].longitude], 15, { animate: true })
    } else {
      mapRef.current.setView(center, zoom, { animate: true })
    }
  }

  if (!mounted) {
    return (
      <div className={`w-full h-full min-h-[280px] sm:min-h-[350px] md:min-h-[400px] rounded-xl bg-surface-card border border-hairline animate-pulse flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-2 text-muted">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-body-sm font-medium">Initializing Map...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full min-h-[280px] sm:min-h-[350px] md:min-h-[400px] rounded-xl overflow-hidden border border-hairline shadow-sm bg-surface-soft ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={false} // Handled safely by MapGestureHandler to prevent browser page zoom
        zoomSnap={0.25}         // Enables smooth fractional zooming for touchpad pinch
        zoomDelta={0.5}
        minZoom={3}
        maxZoom={tileConfig.maxZoom}
        dragging={interactive && !isLocked}
        touchZoom={interactive && !isLocked}
        doubleClickZoom={interactive && !isLocked}
        zoomControl={interactive}
        className={`w-full h-full z-0 ${mapStyle === 'satellite' ? 'satellite-map' : 'civic-streets-map'}`}
        ref={mapRef}
      >
        {/* Fast Open Tile Layer with HTTP/2 and Edge Caching */}
        <TileLayer
          key={`${mapStyle}-${theme}`}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          subdomains={tileConfig.subdomains}
          maxZoom={tileConfig.maxZoom}
          keepBuffer={4}
          updateWhenZooming={false}
          updateWhenIdle={false}
          crossOrigin="anonymous"
        />

        {/* Dedicated Gesture & Wheel controller prevents browser page zoom */}
        <MapGestureHandler
          interactive={interactive}
          isLocked={isLocked}
          scrollWheelZoom={scrollWheelZoom}
        />

        {/* View and Size Controller */}
        <MapController
          reports={validReports}
          center={center}
          zoom={zoom}
          autoFitBounds={autoFitBounds}
        />

        {/* Interactive Markers */}
        {validReports.map((report) => {
          const localized = getLocalizedReport(report, language)
          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={getCustomIcon(report.status)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[210px] max-w-[280px]">
                  {/* Category badge */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted truncate">
                      {t('category.' + report.category) || getCategoryFormattedLabel(report.category)}
                    </span>
                    <StatusBadge status={report.status} />
                  </div>

                  {/* Optional report thumbnail */}
                  {report.image_url && (
                    <div className="w-full h-24 mb-2 rounded-md overflow-hidden bg-surface-card border border-hairline">
                      <img
                        src={report.image_url}
                        alt={localized.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <h4 className="text-body-sm font-bold text-ink mb-1 leading-snug line-clamp-2">
                    {localized.title}
                  </h4>

                  <p className="text-caption text-body mb-2.5 truncate leading-tight">
                    {localized.address || 'Location registered'}
                  </p>

                  <div className="pt-2 border-t border-hairline flex items-center justify-end">
                    <Link
                      href={`/reports/${report.id}`}
                      className="text-[11px] font-bold text-brand-accent hover:underline flex items-center gap-1"
                    >
                      {t('card.details') || 'View Details'} →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Floating Controls: Lock/Unlock Gesture Mode, Style Switcher & Fit Bounds */}
      {interactive && (
        <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
          {/* Map Layer Style Switcher */}
          <button
            type="button"
            onClick={() => setMapStyle((s) => (s === 'streets' ? 'satellite' : 'streets'))}
            title={mapStyle === 'streets' ? 'Switch to Satellite Imagery' : 'Switch to Civic Street Map'}
            className="bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-[#161f36] border border-hairline rounded-lg px-2.5 py-1.5 shadow-md transition-all hover:scale-105 text-ink flex items-center gap-1.5 text-caption font-semibold cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-brand-accent" />
            <span className="text-[11px] hidden md:inline">{mapStyle === 'streets' ? 'Civic Map' : 'Satellite'}</span>
          </button>

          {/* Lock / Unlock Gestures */}
          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            title={
              isLocked
                ? 'Map gestures locked (touching or swiping scrolls the page). Click to unlock map panning.'
                : 'Map gestures active. Click to lock so touches scroll the page without moving map.'
            }
            className={`backdrop-blur-md border border-hairline rounded-lg px-2.5 py-1.5 shadow-md transition-all hover:scale-105 flex items-center gap-1.5 text-caption font-semibold cursor-pointer ${
              isLocked
                ? 'bg-amber-500/90 hover:bg-amber-600 text-white border-amber-600'
                : 'bg-white/95 dark:bg-[#0c1222]/95 hover:bg-slate-50 dark:hover:bg-[#161f36] text-ink'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden sm:inline">{isLocked ? 'Map Locked' : 'Map Active'}</span>
          </button>

          {validReports.length > 0 && (
            <button
              type="button"
              onClick={handleFitBounds}
              title="Fit all reports on map"
              className="bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-[#161f36] border border-hairline rounded-lg p-2 shadow-md transition-all hover:scale-105 text-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/50 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

