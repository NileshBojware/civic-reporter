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
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
}

interface MapOverviewProps {
  reports: Report[]
  center?: [number, number]
  zoom?: number
}

// Custom pulsing icons mapped to status
const getCustomIcon = (status: 'pending' | 'in_progress' | 'resolved' | 'rejected') => {
  let colorClass = 'bg-amber-500 border-amber-300'
  let pingColor = 'bg-amber-400'

  if (status === 'in_progress') {
    colorClass = 'bg-blue-500 border-blue-300'
    pingColor = 'bg-blue-400'
  } else if (status === 'resolved') {
    colorClass = 'bg-emerald-500 border-emerald-300'
    pingColor = 'bg-emerald-400'
  } else if (status === 'rejected') {
    colorClass = 'bg-rose-500 border-rose-300'
    pingColor = 'bg-rose-400'
  }

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8">
        <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full ${pingColor} opacity-75"></span>
        <div class="relative w-4 h-4 rounded-full ${colorClass} border-2 border-zinc-950 shadow-md"></div>
      </div>
    `,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10],
  })
}

const CATEGORY_LABELS: Record<string, string> = {
  road_damage: '🛣️ Road Damage',
  garbage: '🗑️ Garbage Pile',
  water_leakage: '💧 Water Leakage',
  drainage: '🌊 Waterlogging / Drainage',
  streetlight: '💡 Streetlight Issue',
  other: '📌 Other Civic Issue',
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
      <div className="w-full h-full min-h-[400px] rounded-3xl bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center">
        <span className="text-zinc-500 text-sm">Loading Live Map...</span>
      </div>
    )
  }

  // Filter out invalid coordinates
  const validReports = reports.filter(
    (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number'
  )

  // Determine center based on reports if present, else fallback
  const mapCenter: [number, number] =
    validReports.length > 0
      ? [validReports[0].latitude, validReports[0].longitude]
      : center

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={getCustomIcon(report.status)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 min-w-[200px] text-zinc-100">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  {CATEGORY_LABELS[report.category] || report.category}
                </span>
                <h4 className="text-sm font-semibold text-zinc-900 mb-1 leading-tight">
                  {report.title}
                </h4>
                <p className="text-xs text-zinc-600 mb-3 truncate leading-normal">
                  {report.address || 'No address provided'}
                </p>
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-100">
                  <StatusBadge status={report.status} />
                  <Link
                    href={`/reports/${report.id}`}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700 transition"
                  >
                    View Details &rarr;
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
