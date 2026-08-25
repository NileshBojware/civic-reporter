'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default Leaflet icon paths
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})
L.Marker.prototype.options.icon = DefaultIcon

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

// Sync map view when coordinates change externally (e.g. geolocation or EXIF GPS applied)
function MapViewSync({ center }: { center: [number, number] }) {
  const map = useMapEvents({})
  useEffect(() => {
    map.setView(center, 15, { animate: true })
  }, [center, map])
  return null
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const [mounted, setMounted] = useState(false)
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

  if (!mounted) {
    return (
      <div className="w-full h-[300px] rounded-lg bg-surface-card border border-hairline animate-pulse flex items-center justify-center">
        <span className="text-muted text-body-sm font-semibold">Loading Map Picker...</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-hairline">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        {/* Light canvas tile layer matching design system */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <DraggableMarker
          position={position}
          markerEvents={markerEvents}
          markerRef={markerRef}
        />
        <MapClickHandler onClick={onChange} />
        <MapViewSync center={position} />
      </MapContainer>

      {/* Floating instruction label using design-system tokens */}
      <div className="absolute bottom-2 left-2 z-10 bg-canvas/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-caption text-muted border border-hairline pointer-events-none shadow-sm">
        Drag pin or click map to adjust location
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
