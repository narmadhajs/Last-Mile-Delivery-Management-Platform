import React, { useState, useEffect } from 'react';
import { zoneApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { MapPin, Plus, Trash2, Edit, CheckCircle2, Globe, Building2 } from 'lucide-react';

export const ZoneManager: React.FC = () => {
  const { showToast } = useToast();
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [selectedZoneForArea, setSelectedZoneForArea] = useState<any>(null);

  // New Zone Form
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCity, setNewZoneCity] = useState('Mumbai');
  const [newZoneState, setNewZoneState] = useState('Maharashtra');
  const [newZoneLat, setNewZoneLat] = useState('19.0760');
  const [newZoneLng, setNewZoneLng] = useState('72.8777');
  const [newZoneDesc, setNewZoneDesc] = useState('');

  // New Area Form
  const [areaName, setAreaName] = useState('');
  const [areaPincode, setAreaPincode] = useState('');
  const [areaCity, setAreaCity] = useState('');

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res: any = await zoneApi.getAllZones();
      if (res.success && res.data) {
        setZones(res.data);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load zones', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await zoneApi.createZone({
        code: newZoneCode,
        name: newZoneName,
        city: newZoneCity,
        state: newZoneState,
        centerLat: parseFloat(newZoneLat),
        centerLng: parseFloat(newZoneLng),
        description: newZoneDesc,
      });

      if (res.success) {
        showToast({ type: 'success', title: 'Zone Created', message: `Zone ${newZoneCode} created successfully.` });
        setIsAddZoneOpen(false);
        fetchZones();
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to create zone', message: err.message });
    }
  };

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneForArea) return;

    try {
      const res: any = await zoneApi.addArea(selectedZoneForArea.id, {
        areaName,
        pincode: areaPincode,
        city: areaCity || selectedZoneForArea.city,
      });

      if (res.success) {
        showToast({ type: 'success', title: 'Area Mapped', message: `${areaName} (${areaPincode}) added to ${selectedZoneForArea.name}` });
        setSelectedZoneForArea(null);
        setAreaName('');
        setAreaPincode('');
        fetchZones();
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to add area', message: err.message });
    }
  };

  const handleRemoveArea = async (areaId: string) => {
    try {
      await zoneApi.removeArea(areaId);
      showToast({ type: 'info', title: 'Area Removed', message: 'Area unmapped from zone' });
      fetchZones();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error removing area', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-400" />
            Logistics Zones & Pincode Coverage Management
          </h3>
          <p className="text-xs text-slate-400">
            Define spatial delivery zones and link postal codes to enable automated intra vs inter-zone price detection.
          </p>
        </div>

        <button
          onClick={() => setIsAddZoneOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Delivery Zone
        </button>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {zone.code}
                  </span>
                  <h4 className="font-bold text-sm text-white">{zone.name}</h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">{zone.description || `${zone.city}, ${zone.state}`}</p>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Active Zone
              </span>
            </div>

            {/* Mapped Areas / Pincodes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  Assigned Areas ({zone.areas?.length || 0})
                </span>
                <button
                  onClick={() => {
                    setSelectedZoneForArea(zone);
                    setAreaCity(zone.city);
                  }}
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Map New Area / Pincode
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
                {zone.areas?.length === 0 ? (
                  <span className="text-[11px] text-slate-500 p-2">No postal codes mapped yet.</span>
                ) : (
                  zone.areas?.map((area: any) => (
                    <div
                      key={area.id}
                      className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200"
                    >
                      <span className="font-mono text-brand-300 font-bold">{area.pincode}</span>
                      <span>{area.areaName}</span>
                      <button
                        onClick={() => handleRemoveArea(area.id)}
                        className="text-slate-500 hover:text-rose-400 ml-1 opacity-0 group-hover:opacity-100 transition"
                        title="Unmap pincode"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
              <span>Center GPS: {zone.centerLat}, {zone.centerLng}</span>
              <span>Pickup Orders: <b className="text-slate-200">{zone._count?.pickupOrders || 0}</b></span>
            </div>

          </div>
        ))}
      </div>

      {/* Add Zone Modal */}
      {isAddZoneOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddZoneOpen(false)}
          title="Create New Delivery Zone"
          subtitle="Configure a new geographical operational zone for rate calculation"
        >
          <form onSubmit={handleCreateZone} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Zone Code</label>
                <input
                  type="text"
                  required
                  value={newZoneCode}
                  onChange={(e) => setNewZoneCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold uppercase"
                  placeholder="e.g. HYD-C"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  placeholder="e.g. Hyderabad Central & Hitec City"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={newZoneCity}
                  onChange={(e) => setNewZoneCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">State</label>
                <input
                  type="text"
                  required
                  value={newZoneState}
                  onChange={(e) => setNewZoneState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Center Latitude</label>
                <input
                  type="text"
                  required
                  value={newZoneLat}
                  onChange={(e) => setNewZoneLat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Center Longitude</label>
                <input
                  type="text"
                  required
                  value={newZoneLng}
                  onChange={(e) => setNewZoneLng(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Zone Description</label>
              <textarea
                rows={2}
                value={newZoneDesc}
                onChange={(e) => setNewZoneDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                placeholder="Hub coverage notes, key industrial areas, ports"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddZoneOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold"
              >
                Save Zone
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Map Area Modal */}
      {selectedZoneForArea && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedZoneForArea(null)}
          title={`Map Pincode to ${selectedZoneForArea.name}`}
          subtitle={`Zone Code: ${selectedZoneForArea.code}`}
        >
          <form onSubmit={handleAddArea} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Area / Landmark Name</label>
              <input
                type="text"
                required
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                placeholder="e.g. Madhapur IT Corridor"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Postal Pincode</label>
                <input
                  type="text"
                  required
                  value={areaPincode}
                  onChange={(e) => setAreaPincode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  placeholder="e.g. 500081"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={areaCity}
                  onChange={(e) => setAreaCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedZoneForArea(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold"
              >
                Link Pincode
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
