import React, { useEffect, useRef, useState } from 'react';
import { agentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import L from 'leaflet';
import { Truck, Navigation, Star, Phone, ShieldCheck, Activity } from 'lucide-react';

export const FleetMap: React.FC = () => {
  const { showToast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const res: any = await agentApi.getAllAgents();
      if (res.success && res.data) {
        setAgents(res.data);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load fleet', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || agents.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [19.0760, 72.8777],
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    agents.forEach((agent) => {
      if (!agent.currentLat || !agent.currentLng) return;

      const isAvailable = agent.status === 'AVAILABLE';
      const isBusy = agent.status === 'BUSY';

      const agentIcon = L.divIcon({
        className: 'custom-fleet-icon',
        html: `
          <div style="background: ${isAvailable ? '#10b981' : isBusy ? '#f59e0b' : '#64748b'}; color: white; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6); font-size: 14px; cursor: pointer;">
            ${agent.vehicleType === 'VAN' ? '🚐' : '🛵'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([agent.currentLat, agent.currentLng], { icon: agentIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
          <b style="font-size: 13px;">${agent.user?.name}</b><br/>
          <span style="font-size: 11px; color: #64748b;">Vehicle: ${agent.vehicleType} (${agent.vehicleNumber})</span><br/>
          <span style="font-size: 11px; color: ${isAvailable ? '#10b981' : '#f59e0b'}; font-weight: bold;">Status: ${agent.status}</span><br/>
          <span style="font-size: 11px;">Active Queue: ${agent.activeOrderCount}/${agent.maxCapacity} orders</span>
        </div>
      `);

      marker.on('click', () => {
        setSelectedAgent(agent);
      });

      bounds.extend([agent.currentLat, agent.currentLng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [agents]);

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Live Delivery Fleet Telemetry & Workload Map
          </h3>
          <p className="text-xs text-slate-400">
            Real-time GPS positions of active delivery riders, vehicle telemetry, and current order load balance.
          </p>
        </div>
        <button
          onClick={fetchFleet}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-brand-300 border border-slate-700"
        >
          Refresh GPS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Map Container */}
        <div className="lg:col-span-2 h-96 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Fleet List / Selected Agent Card */}
        <div className="space-y-3 overflow-y-auto max-h-96">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                selectedAgent?.id === agent.id
                  ? 'bg-brand-950/40 border-brand-500 shadow-lg'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {agent.vehicleType === 'VAN' ? '🚐' : '🛵'}
                  </span>
                  <span className="font-bold text-sm text-white">{agent.user?.name}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    agent.status === 'AVAILABLE'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {agent.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Vehicle: <b className="text-slate-200 font-mono">{agent.vehicleNumber}</b></span>
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  {agent.rating}
                </span>
              </div>

              {/* Workload Meter */}
              <div className="mt-2.5">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Current Workload</span>
                  <span className="font-bold text-slate-200">
                    {agent.activeOrderCount} / {agent.maxCapacity} active orders
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      agent.activeOrderCount >= agent.maxCapacity
                        ? 'bg-rose-500'
                        : agent.activeOrderCount > 0
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(agent.activeOrderCount / agent.maxCapacity) * 100}%` }}
                  />
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
