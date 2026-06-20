import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster/dist/leaflet.markercluster'
import 'leaflet.heat/dist/leaflet-heat'
import { formatNumber } from '@/lib/utils'

const BENGALURU_CENTER = [12.9716, 77.5946]

const hasValidCoordinates = ({ latitude, longitude }) =>
  Number.isFinite(latitude) && Number.isFinite(longitude)

function createGlowIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border-radius: 50%;
      box-shadow: 0 0 12px ${color}, 0 0 24px ${color}80;
      border: 2px solid rgba(255,255,255,0.3);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function HeatmapLayer({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points?.length) return
    const heatData = points
      .filter(hasValidCoordinates)
      .map((p) => [p.latitude, p.longitude, p.intensity || 0.5])
    if (!heatData.length) return
    const heat = L.heatLayer(heatData, {
      radius: 25,
      blur: 20,
      maxZoom: 17,
      gradient: {
        0.2: '#3B82F6',
        0.4: '#10B981',
        0.6: '#EAB308',
        0.8: '#F59E0B',
        1.0: '#EF4444',
      },
    })
    heat.addTo(map)
    return () => map.removeLayer(heat)
  }, [map, points])
  return null
}

function ClusterLayer({ markers, getColor }) {
  const map = useMap()
  useEffect(() => {
    if (!markers?.length) return
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    })
    markers.forEach((m) => {
      if (!hasValidCoordinates(m)) return
      const color = getColor ? getColor(m) : '#00D4FF'
      const marker = L.marker([m.latitude, m.longitude], { icon: createGlowIcon(color) })
      const popupContent = m.popupContent || `
        <div style="min-width:180px">
          <strong style="color:#00D4FF">${m.junction_name || 'Unknown'}</strong><br/>
          <span style="color:#94a3b8">Violations: ${formatNumber(m.total_violations)}</span><br/>
          <span style="color:#94a3b8">CIP: ${formatNumber(m.total_cip, 1)}</span>
        </div>
      `
      marker.bindPopup(typeof popupContent === 'string' ? popupContent : undefined)
      if (typeof popupContent !== 'string') marker.bindPopup(() => popupContent)
      cluster.addLayer(marker)
    })
    map.addLayer(cluster)
    return () => map.removeLayer(cluster)
  }, [map, markers, getColor])
  return null
}

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

export default function HotspotMap({
  markers = [],
  heatmapPoints = [],
  getMarkerColor,
  height = '100%',
  center = BENGALURU_CENTER,
  zoom = 12,
  showHeatmap = true,
  showClusters = true,
  renderPopup,
}) {
  const validMarkers = markers.filter(hasValidCoordinates)
  const maxCip = Math.max(...validMarkers.map((m) => m.total_cip || m.avg_cip || 0), 1)

  const defaultGetColor = (m) => {
    const cip = m.total_cip || m.avg_cip || 0
    const ratio = cip / maxCip
    if (ratio >= 0.8) return '#EF4444'
    if (ratio >= 0.6) return '#F59E0B'
    if (ratio >= 0.3) return '#EAB308'
    if (ratio >= 0.1) return '#10B981'
    return '#3B82F6'
  }

  const enrichedMarkers = validMarkers.map((m) => ({
    ...m,
    popupContent: renderPopup ? renderPopup(m) : undefined,
  }))

  const heatPoints = heatmapPoints.length
    ? heatmapPoints
    : validMarkers.map((m) => ({
        latitude: m.latitude,
        longitude: m.longitude,
        intensity: (m.total_cip || m.total_violations || 1) / maxCip,
      }))

  return (
    <div style={{ height, width: '100%' }} className="relative rounded-xl overflow-hidden border border-white/5 group">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapResizer />
        {showHeatmap && <HeatmapLayer points={heatPoints} />}
        {showClusters && (
          <ClusterLayer
            markers={enrichedMarkers}
            getColor={getMarkerColor || defaultGetColor}
          />
        )}
      </MapContainer>

      {/* Floating Legend Panel */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-2xl max-w-[200px] pointer-events-none transition-all duration-300">
        <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2.5">CIP Severity</h4>
        <div className="space-y-2">
          {[
            { label: 'Very High (≥ 80%)', color: '#EF4444' },
            { label: 'High (60% - 80%)', color: '#F59E0B' },
            { label: 'Medium (30% - 60%)', color: '#EAB308' },
            { label: 'Low (10% - 30%)', color: '#10B981' },
            { label: 'Very Low (< 10%)', color: '#3B82F6' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/10" 
                style={{ 
                  backgroundColor: item.color,
                  boxShadow: `0 0 8px ${item.color}`
                }} 
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
