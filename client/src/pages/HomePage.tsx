import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { QuickQuoteCalculator } from '../components/customer/QuickQuoteCalculator';
import { 
  Truck, 
  Package, 
  ShieldCheck, 
  Cpu, 
  MapPin, 
  RotateCcw, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2,
  Navigation,
  Sliders,
  DollarSign,
  Search
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onOpenBookOrder: (quoteData?: any) => void;
  onTrackOrder: (trackingNumber: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenBookOrder,
  onTrackOrder,
}) => {
  const { switchRole } = useAuth();
  const [trackInput, setTrackInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onTrackOrder(trackInput.trim());
    }
  };

  return (
    <div className="space-y-12 py-6">
      
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-[#0f172a] to-brand-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Logistics Automation & Dispatch Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Intelligent Last-Mile Delivery <br />
            <span className="bg-gradient-to-r from-brand-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Engine & Fleet Orchestrator
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Automate multi-zone tariff calculations, volumetric weight billing, spatial Haversine auto-assignment, immutable status lifecycles, and resilient failed-delivery customer rescheduling.
          </p>

          {/* Quick Track Input */}
          <form onSubmit={handleTrackSubmit} className="flex items-center gap-2 max-w-md bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700 shadow-xl">
            <Search className="w-5 h-5 text-slate-400 ml-2.5" />
            <input
              type="text"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              placeholder="Enter Tracking # (e.g. TRK-2026-MUM901)"
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none px-2"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition flex items-center gap-1"
            >
              Track Live
            </button>
          </form>

          {/* Role Quick Jump Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                switchRole('CUSTOMER');
                onNavigate('customer');
              }}
              className="px-4 py-2.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 text-xs font-bold flex items-center gap-2 transition"
            >
              <Package className="w-4 h-4" />
              Customer Portal
            </button>

            <button
              onClick={() => {
                switchRole('AGENT');
                onNavigate('agent');
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition"
            >
              <Truck className="w-4 h-4" />
              Delivery Agent Hub
            </button>

            <button
              onClick={() => {
                switchRole('ADMIN');
                onNavigate('admin');
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Operations
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Quick Rate Calculator Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Real-Time Dynamic Rate Engine Demo
            </h2>
            <p className="text-xs text-slate-400">
              Test volumetric billing, intra/inter-zone detection, and COD surcharge calculation in real-time.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl">
          <QuickQuoteCalculator onSelectBookWithQuote={(quote) => onOpenBookOrder(quote)} />
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 transition space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white">Dynamic Rate Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Computes volumetric weight ($(L \times B \times H) \div 5000$), bills on higher of actual vs volumetric, auto-resolves intra/inter zones, and adds configured COD surcharges.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Navigation className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white">Haversine Auto-Assignment</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Matches nearest available agent using great-circle GPS trigonometry, current active load balancing, home-zone affinity, and driver performance rating.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white">Resilient Rescheduling</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Failed attempts trigger instant customer notifications with secure reschedule links. Customers choose new time windows, and agents are automatically re-assigned.
          </p>
        </div>

      </div>

    </div>
  );
};
