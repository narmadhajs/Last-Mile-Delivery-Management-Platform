import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LiveTrackingMapProps {
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropLat: number;
  dropLng: number;
  dropAddress: string;
  agentLat?: number;
  agentLng?: number;
  agentName?: string;
  vehicleNumber?: string;
  status: string;
  height?: string;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  pickupLat,
  pickupLng,
  pickupAddress,
  dropLat,
  dropLng,
  dropAddress,
  agentLat,
  agentLng,
  agentName = 'Rajesh Kumar',
  vehicleNumber = 'MH-01-BK-1080',
  status,
  height = 'h-80',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultCenter: [number, number] = [
      pickupLat && !isNaN(pickupLat) ? pickupLat : 19.0760,
      pickupLng && !isNaN(pickupLng) ? pickupLng : 72.8777,
    ];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark sleek map tiles from CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    // 1. Pickup Custom Pin
    const pickupIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div style="background: #0284c7; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); font-weight: bold; font-size: 11px;">
          📦
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const pickupMarker = L.marker([pickupLat, pickupLng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup(`<b style="color:#0284c7">Pickup Location:</b><br>${pickupAddress}`);
    bounds.extend([pickupLat, pickupLng]);

    // 2. Drop Custom Pin
    const dropIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div style="background: #10b981; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); font-weight: bold; font-size: 11px;">
          🏁
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const dropMarker = L.marker([dropLat, dropLng], { icon: dropIcon })
      .addTo(map)
      .bindPopup(`<b style="color:#10b981">Destination Drop:</b><br>${dropAddress}`);
    bounds.extend([dropLat, dropLng]);

    // 3. Agent Vehicle Live Marker (if agent has coordinates)
    const effectiveAgentLat = agentLat || (pickupLat + dropLat) / 2;
    const effectiveAgentLng = agentLng || (pickupLng + dropLng) / 2;

    const agentIcon = L.divIcon({
      className: 'custom-pulse-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div class="pulsing-dot"></div>
          <div style="position: absolute; top: -22px; background: #0f172a; border: 1px solid #38bdf8; color: #38bdf8; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.8);">
            🛵 ${agentName.split(' ')[0]}
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    if (status !== 'DELIVERED' && status !== 'FAILED') {
      L.marker([effectiveAgentLat, effectiveAgentLng], { icon: agentIcon })
        .addTo(map)
        .bindPopup(`<b>Delivery Partner:</b> ${agentName}<br>Vehicle: ${vehicleNumber}`);
      bounds.extend([effectiveAgentLat, effectiveAgentLng]);
    }

    // 4. Route Polyline
    const routeCoords: [number, number][] = [
      [pickupLat, pickupLng],
      [effectiveAgentLat, effectiveAgentLng],
      [dropLat, dropLng],
    ];

    L.polyline(routeCoords, {
      color: '#38bdf8',
      weight: 3.5,
      opacity: 0.8,
      dashArray: status === 'DELIVERED' ? undefined : '6, 8',
    }).addTo(map);

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickupLat, pickupLng, dropLat, dropLng, agentLat, agentLng, status]);

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-xl`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Status Overlay */}
      <div className="absolute top-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2.5">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <div className="text-xs">
          <span className="font-bold text-white uppercase tracking-wider text-[10px]">
            {status.replace(/_/g, ' ')}
          </span>
          <p className="text-[10px] text-slate-400">Live GPS & Route Simulation</p>
        </div>
      </div>
    </div>
  );
};
