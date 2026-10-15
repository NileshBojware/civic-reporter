'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '@/lib/ThemeContext'
import { RefreshCw } from 'lucide-react'

// Fix default Leaflet icon paths
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

interface MapPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

// Handle map click to place the pin at the clicked location
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Dedicated Gesture Handler: prevents touchpad pinch from zooming the browser page
function MapGestureHandler() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    if (!container) return

    container.style.touchAction = 'pan-x pan-y'
    container.style.overscrollBehavior = 'contain'

    const handleWheel = (e: WheelEvent) => {
      // 1. Touchpad Pinch-to-Zoom (Chrome sets e.ctrlKey = true on touchpad pinch)
      if (e.ctrlKey) {
        e.preventDefault()
        e.stopPropagation()

        const zoomDelta = -e.deltaY * 0.015
        const currentZoom = map.getZoom()
        const targetZoom = Math.min(Math.max(currentZoom + zoomDelta, map.getMinZoom() || 1), map.getMaxZoom() || 20)

        const containerPoint = map.mouseEventToContainerPoint(e)
        const latlng = map.containerPointToLatLng(containerPoint)
        map.setZoomAround(latlng, targetZoom, { animate: false })
        return
      }

      // 2. Mouse Wheel Zoom
      e.preventDefault()
      e.stopPropagation()

      const zoomDelta = e.deltaY < 0 ? 0.5 : -0.5
      const currentZoom = map.getZoom()
      const targetZoom = Math.min(Math.max(currentZoom + zoomDelta, map.getMinZoom() || 1), map.getMaxZoom() || 20)

      const containerPoint = map.mouseEventToContainerPoint(e)
      const latlng = map.containerPointToLatLng(containerPoint)
      map.setZoomAround(latlng, targetZoom, { animate: true })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [map])

  return null
}

// Proactive sizing and external coordinate sync
function MapController({
  center,
}: {
  center: [number, number]
}) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()

    const timers = [
      setTimeout(() => map.invalidateSize(), 60),
      setTimeout(() => map.invalidateSize(), 200),
      setTimeout(() => map.invalidateSize(), 500),
    ]

    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)

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

  // Sync map view when coordinates change externally (e.g. geolocation or EXIF GPS)
  useEffect(() => {
    map.setView(center, 15, { animate: true })
  }, [center, map])

  return null
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const markerRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const position: [number, number] = useMemo(() => [lat, lng], [lat, lng])

  const markerEvents = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const latLng = marker.getLatLng()
          onChange(latLng.lat, latLng.lng)
        }
      },
    }),
    [onChange]
  )

  // Fast, open cartography with global edge caching and zero API key requirement
  const tileConfig = useMemo(() => {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-[300px] rounded-lg bg-surface-card border border-hairline animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-body-sm font-semibold">Loading Map Picker...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-hairline bg-surface-soft">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false} // Handled safely by MapGestureHandler to prevent page zoom
        zoomSnap={0.25}         // Smooth fractional zooming for touchpad pinch
        zoomDelta={0.5}
        minZoom={3}
        maxZoom={tileConfig.maxZoom}
        className="w-full h-full z-0"
      >
        {/* Fast Open Tile Layer with HTTP/2 and Edge Caching */}
        <TileLayer
          key={theme}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          subdomains={tileConfig.subdomains}
          maxZoom={tileConfig.maxZoom}
          keepBuffer={3}
          updateWhenZooming={false}
          updateWhenIdle={false}
          crossOrigin="anonymous"
        />
        <MapGestureHandler />
        <DraggableMarker
          position={position}
          markerEvents={markerEvents}
          markerRef={markerRef}
        />
        <MapClickHandler onClick={onChange} />
        <MapController center={position} />
      </MapContainer>

      {/* Floating instruction label using design-system tokens */}
      <div className="absolute bottom-2 left-2 z-[400] bg-canvas/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-caption text-muted border border-hairline pointer-events-none shadow-sm">
        Drag pin, scroll wheel or pinch to pinpoint location
      </div>
    </div>
  )
}

function DraggableMarker({
  position,
  markerEvents,
  markerRef,
}: {
  position: [number, number]
  markerEvents: any
  markerRef: any
}) {
  return (
    <Marker
      draggable={true}
      eventHandlers={markerEvents}
      position={position}
      ref={markerRef}
    />
  )
}

