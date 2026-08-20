import React from 'react';
import { 
  FileText, 
  Cpu, 
  Globe, 
  Navigation, 
  RotateCcw, 
  ShieldCheck, 
  Layers, 
  Database,
  ArrowRight
} from 'lucide-react';

export const SystemDesignPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      {/* Page Header */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          Technical Architecture Specification
        </div>
        <h2 className="text-2xl font-bold text-white">System Design Write-Up</h2>
        <p className="text-xs text-slate-400">
          Executive design report detailing the Dynamic Rate Calculation Engine, Spatial Zone Detection, Intelligent Auto-Assignment Heuristic, and Resilient Failed Delivery Flow.
        </p>
      </div>

      {/* Section 1: Dynamic Rate Calculation Engine */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-400" />
          1. Dynamic Rate Calculation Engine
        </h3>
        
        <p className="text-xs text-slate-300 leading-relaxed">
          The Rate Engine follows a deterministic pipeline that ensures pricing transparency without hardcoded values. When an order or quote request is submitted:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-bold text-brand-300 block">Volumetric Weight Formula:</span>
            <code className="text-xs text-slate-200 block font-mono bg-slate-900 p-2 rounded">
              Volumetric Wt (kg) = (L × B × H) ÷ 5000
            </code>
            <p className="text-[11px] text-slate-400">
              The volumetric divisor (default 5000) is admin-configurable per rate card.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-300 block">Chargeable Weight:</span>
            <code className="text-xs text-slate-200 block font-mono bg-slate-900 p-2 rounded">
              Chargeable = max(Actual Wt, Volumetric Wt)
            </code>
            <p className="text-[11px] text-slate-400">
              Protects logistics margins against low-density, bulky parcel shipments.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Based on the resolved <b className="text-white">OrderType (B2B/B2C)</b>, the engine fetches the active database <code className="text-brand-300 font-mono">RateCard</code>. Slabs are applied as:
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <div>Subtotal = BaseRate + ⌈(Chargeable - BaseWeight) ÷ IncWeight⌉ × IncRate</div>
          <div>COD Surcharge = max(CodMinFee, CodFlatFee + (Subtotal × CodPercentage ÷ 100))</div>
          <div className="text-brand-300 font-bold">Total Amount = Subtotal + COD Surcharge</div>
        </div>
      </div>

      {/* Section 2: Spatial Zone Detection */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          2. Zone Detection & Resolution Approach
        </h3>
        
        <p className="text-xs text-slate-300 leading-relaxed">
          Zone detection maps pickup and drop locations to operational logistics zones via a 4-tier fallback hierarchy:
        </p>

        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
          <li><b className="text-white">Exact Pincode Lookup:</b> Direct matching against mapped <code className="text-brand-300 font-mono">ZoneArea</code> records.</li>
          <li><b className="text-white">Text Area Match:</b> Substring token search across area/landmark names.</li>
          <li><b className="text-white">Coordinate Proximity:</b> Haversine distance evaluation between coordinates and zone center radius.</li>
          <li><b className="text-white">Prefix Routing:</b> 3-digit postal circle prefix grouping (e.g. 400xxx ➔ Mumbai).</li>
        </ol>

        <p className="text-xs text-slate-300 leading-relaxed">
          If <code className="text-brand-300 font-mono">PickupZone.id == DropZone.id</code>, the trip is classified as <b className="text-emerald-300">INTRA_ZONE</b> applying local intra-rates; otherwise it is classified as <b className="text-sky-300">INTER_ZONE</b> applying inter-zone tariffs.
        </p>
      </div>

      {/* Section 3: Intelligent Auto-Assignment Logic */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 text-cyan-400" />
          3. Intelligent Agent Auto-Assignment Heuristic
        </h3>
        
        <p className="text-xs text-slate-300 leading-relaxed">
          The assignment engine evaluates available agents in real-time. Proximity is computed via the Great-Circle Haversine formula:
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
          d = 2R · arcsin(√(sin²(Δφ/2) + cos(φ₁)·cos(φ₂)·sin²(Δλ/2)))
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          A multi-factor composite penalty score is calculated for each eligible candidate (lower is better):
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-cyan-300">
          Score = (1.2 × DistKm) + (3.5 × ActiveQueue) + (5.0 × IsBusy) - (8.0 × HomeZoneAffinity) - (2.0 × (Rating - 3.0))
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The candidate with the minimal composite score is atomically assigned within a database transaction, incrementing driver load and dispatching real-time notifications.
        </p>
      </div>

      {/* Section 4: Failed Delivery & Customer Reschedule Lifecycle */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-400" />
          4. Failed Delivery & Customer Reschedule Handling
        </h3>
        
        <p className="text-xs text-slate-300 leading-relaxed">
          When an agent cannot complete delivery, they flag the order as <code className="text-rose-400 font-mono">FAILED</code> with structured reasons (e.g. <i>Customer Unavailable</i>, <i>Wrong Address</i>). The system immediately:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-rose-300 block mb-1">1. Frees Agent Capacity</span>
            <p className="text-[11px] text-slate-400">Decrements driver active load so they can continue pending tasks.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-amber-300 block mb-1">2. Dispatches Alerts</span>
            <p className="text-[11px] text-slate-400">Sends Email & SMS with a secure one-click customer reschedule link.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-emerald-300 block mb-1">3. Automated Reassignment</span>
            <p className="text-[11px] text-slate-400">Customer picks new slot ➔ state moves to <code className="text-amber-300 font-mono">RESCHEDULED</code> ➔ auto-assigned.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Every state transition is appended to the immutable <code className="text-indigo-300 font-mono">TrackingHistory</code> ledger with actor identity, timestamp, coordinates, and reason for complete end-to-end auditability.
        </p>
      </div>

    </div>
  );
};
