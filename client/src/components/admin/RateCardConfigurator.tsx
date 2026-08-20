import React, { useState, useEffect } from 'react';
import { rateApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Sliders, Plus, Edit2, CheckCircle2, Save, Trash2, ShieldCheck, Zap } from 'lucide-react';

export const RateCardConfigurator: React.FC = () => {
  const { showToast } = useToast();
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);

  const fetchRateCards = async () => {
    setLoading(true);
    try {
      const res: any = await rateApi.getRateCards();
      if (res.success && res.data) {
        setRateCards(res.data);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load rate cards', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateCards();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    try {
      const res: any = await rateApi.updateRateCard(editingCard.id, editingCard);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Rate Card Updated',
          message: `Saved configuration for ${editingCard.name}. Real-time quotes updated immediately.`,
        });
        setEditingCard(null);
        fetchRateCards();
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update rate card', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-400" />
            Dynamic Rate Card & Tariff Engine
          </h3>
          <p className="text-xs text-slate-400">
            Configure B2B and B2C pricing slabs, volumetric divisors, intra/inter-zone rates, and COD surcharges with 100% real-time calculation.
          </p>
        </div>
      </div>

      {/* Cards Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rateCards.map((card) => (
          <div
            key={card.id}
            className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5 hover:border-slate-700 transition"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full uppercase ${
                      card.orderType === 'B2B'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    }`}
                  >
                    {card.orderType} Tier
                  </span>
                  <span className="text-xs font-mono text-slate-400">{card.code}</span>
                </div>
                <h4 className="font-bold text-base text-white mt-1.5">{card.name}</h4>
              </div>

              <button
                onClick={() => setEditingCard({ ...card })}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-brand-300 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Rates
              </button>
            </div>

            {/* Matrix Pricing Slabs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              
              {/* Intra Zone Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">
                  📍 Intra-Zone Rates (Same Zone)
                </span>
                <div className="flex justify-between text-slate-300 pt-1">
                  <span>Base Fare (up to {card.baseWeightKg} kg):</span>
                  <span className="font-bold font-mono text-white">₹{card.baseRateIntra.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Additional per {card.incrementalWeightKg} kg:</span>
                  <span className="font-bold font-mono text-white">₹{card.incrementalRateIntra.toFixed(2)}</span>
                </div>
              </div>

              {/* Inter Zone Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-sky-400 block uppercase tracking-wider">
                  🌐 Inter-Zone Rates (Cross Zone)
                </span>
                <div className="flex justify-between text-slate-300 pt-1">
                  <span>Base Fare (up to {card.baseWeightKg} kg):</span>
                  <span className="font-bold font-mono text-white">₹{card.baseRateInter.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Additional per {card.incrementalWeightKg} kg:</span>
                  <span className="font-bold font-mono text-white">₹{card.incrementalRateInter.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Surcharges & Volumetric Parameters */}
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Volumetric Factor</span>
                <span className="font-mono font-bold text-brand-300">{card.volumetricDivisor} cm³/kg</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">COD Surcharge</span>
                <span className="font-mono font-bold text-amber-300">₹{card.codFlatFee} + {card.codPercentage}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">COD Min Floor</span>
                <span className="font-mono font-bold text-amber-300">₹{card.codMinFee}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Note: {card.notes || 'Configured for production automated routing.'}
            </p>

          </div>
        ))}
      </div>

      {/* Edit Rate Card Modal */}
      {editingCard && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCard(null)}
          title={`Edit Rate Card: ${editingCard.name}`}
          subtitle={`Code: ${editingCard.code} (${editingCard.orderType})`}
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Rate Card Name</label>
              <input
                type="text"
                required
                value={editingCard.name}
                onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            {/* Base Rates */}
            <div className="grid grid-cols-3 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Base Wt Slab (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editingCard.baseWeightKg}
                  onChange={(e) => setEditingCard({ ...editingCard, baseWeightKg: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-emerald-400 font-bold block mb-1">Intra Base Rate (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editingCard.baseRateIntra}
                  onChange={(e) => setEditingCard({ ...editingCard, baseRateIntra: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-emerald-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-sky-400 font-bold block mb-1">Inter Base Rate (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editingCard.baseRateInter}
                  onChange={(e) => setEditingCard({ ...editingCard, baseRateInter: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-sky-300"
                />
              </div>
            </div>

            {/* Incremental Rates */}
            <div className="grid grid-cols-3 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Inc. Slab (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editingCard.incrementalWeightKg}
                  onChange={(e) => setEditingCard({ ...editingCard, incrementalWeightKg: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-emerald-400 font-bold block mb-1">Intra Inc. Rate (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editingCard.incrementalRateIntra}
                  onChange={(e) => setEditingCard({ ...editingCard, incrementalRateIntra: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-emerald-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-sky-400 font-bold block mb-1">Inter Inc. Rate (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editingCard.incrementalRateInter}
                  onChange={(e) => setEditingCard({ ...editingCard, incrementalRateInter: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-sky-300"
                />
              </div>
            </div>

            {/* Volumetric & COD */}
            <div className="grid grid-cols-4 gap-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Volumetric Divisor</label>
                <input
                  type="number"
                  required
                  value={editingCard.volumetricDivisor}
                  onChange={(e) => setEditingCard({ ...editingCard, volumetricDivisor: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-amber-400 block mb-1">COD Flat Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={editingCard.codFlatFee}
                  onChange={(e) => setEditingCard({ ...editingCard, codFlatFee: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-amber-400 block mb-1">COD Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editingCard.codPercentage}
                  onChange={(e) => setEditingCard({ ...editingCard, codPercentage: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-amber-400 block mb-1">COD Min Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={editingCard.codMinFee}
                  onChange={(e) => setEditingCard({ ...editingCard, codMinFee: parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
