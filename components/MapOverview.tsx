'use client'

import React, { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'

interface Report {
  id: string
  title: string
  category: string
  latitude: number
  longitude: number
  address: string
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'verified'
}

interface MapOverviewProps {
  reports: Report[]
  center?: [number, number]
  zoom?: number
}

// Custom pulsing icons mapped to status using design-system status colors
const getCustomIcon = (status: Report['status']) => {
  // Status color hex values matching design.md tokens
  const colorMap: Record<Report['status'], { dot: string; ping: string }> = {
    pending:     { dot: 'bg-amber-400 border-amber-200',   ping: 'bg-amber-300' },
    verified:    { dot: 'bg-blue-500 border-blue-300',     ping: 'bg-blue-400' },
    in_progress: { dot: 'bg-violet-500 border-violet-300', ping: 'bg-violet-400' },
    resolved:    { dot: 'bg-emerald-500 border-emerald-300', ping: 'bg-emerald-400' },
    rejected:    { dot: 'bg-red-500 border-red-300',       ping: 'bg-red-400' },
  }

  const colors = colorMap[status] ?? colorMap.pending

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8">
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

const CATEGORY_LABELS: Record<string, string> = {
  road_damage:   '🛣️ Road Damage',
  garbage:       '🗑️ Garbage Pile',
  water_leakage: '💧 Water Leakage',
  drainage:      '🌊 Waterlogging / Drainage',
  streetlight:   '💡 Streetlight Issue',
  other:         '📌 Other Civic Issue',
}

export default function MapOverview({
  reports,
  center = [12.9716, 77.5946], // Default Bangalore center
  zoom = 13,
}: MapOverviewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-lg bg-surface-card border border-hairline animate-pulse flex items-center justify-center">
        <span className="text-muted text-body-sm">Loading Live Map...</span>
      </div>
    )
  }

  // Filter out invalid coordinates
  const validReports = reports.filter(
    (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number'
  )

  // Determine center based on first report if present, else fallback
  const mapCenter: [number, number] =
    validReports.length > 0
      ? [validReports[0].latitude, validReports[0].longitude]
      : center

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-hairline shadow-sm">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* Light canvas tile layer matching design system */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {validReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={getCustomIcon(report.status)}
          >
            <Popup className="custom-leaflet-popup">
              {/* Popup uses design-system text colors — white background is set by leaflet CSS overrides */}
              <div className="p-1 min-w-[200px]">
                <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                  {CATEGORY_LABELS[report.category] || report.category}
                </span>
                <h4 className="text-body-sm font-semibold text-ink mb-1 leading-tight">
                  {report.title}
                </h4>
                <p className="text-caption text-body mb-3 truncate leading-normal">
                  {report.address || 'No address provided'}
                </p>
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-hairline">
                  <StatusBadge status={report.status} />
                  <Link
                    href={`/reports/${report.id}`}
                    className="text-caption font-semibold text-brand-accent hover:underline transition"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
