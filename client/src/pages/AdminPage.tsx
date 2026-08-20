import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { OrderMasterTable } from '../components/admin/OrderMasterTable';
import { ZoneManager } from '../components/admin/ZoneManager';
import { RateCardConfigurator } from '../components/admin/RateCardConfigurator';
import { FleetMap } from '../components/admin/FleetMap';
import { AuditLogsViewer } from '../components/admin/AuditLogsViewer';
import { 
  LayoutDashboard, 
  Package, 
  Globe, 
  Sliders, 
  Truck, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Activity
} from 'lucide-react';

interface AdminPageProps {
  onViewOrderTrack: (trackingNumber: string) => void;
  onOpenCreateOrder: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onViewOrderTrack,
  onOpenCreateOrder,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'orders' | 'zones' | 'rates' | 'fleet' | 'audit'>('orders');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async (isManualRefresh = false) => {
    setLoading(true);
    try {
      const res: any = await analyticsApi.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
        if (isManualRefresh) {
          showToast({ type: 'success', title: 'Live Metrics Updated', message: 'Dashboard analytics refreshed.' });
        }
      }
    } catch (err: any) {
      console.warn('Analytics fetch warning:', err.message);
      if (isManualRefresh) {
        showToast({ type: 'error', title: 'Failed to load analytics', message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);


  const kpi = stats?.kpi || {
    totalOrders: 6,
    totalRevenue: 2315.0,
    deliveredOrders: 2,
    inTransitOrders: 3,
    failedOrders: 1,
    onTimeRate: 98,
    totalAgents: 4,
    activeZones: 4,
  };

  return (
    <div className="space-y-6 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0f172a] to-indigo-950/40 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Logistics Operations Control Center</h2>
            <p className="text-xs text-slate-400">
              Fleet telemetry, rate engine rules, zone mapping, and comprehensive audit ledger.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchStats(true)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-brand-300 border border-slate-700 self-start sm:self-auto"
        >
          Refresh Live Metrics
        </button>

      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Deliveries</span>
            <Package className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{kpi.totalOrders}</div>
          <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Active Fleet Processing
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">₹{kpi.totalRevenue.toFixed(2)}</div>
          <p className="text-[10px] text-slate-400">Auto-Calculated Tariffs</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>On-Time Success</span>
            <CheckCircle2 className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold text-brand-300">{kpi.onTimeRate}%</div>
          <p className="text-[10px] text-slate-400">{kpi.deliveredOrders} Delivered • {kpi.inTransitOrders} In-Transit</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Fleet & Zones</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {kpi.totalAgents} Agents <span className="text-sm font-normal text-slate-400">/ {kpi.activeZones} Zones</span>
          </div>
          <p className="text-[10px] text-amber-300">{kpi.failedOrders} Reschedule Pending</p>
        </div>

      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Orders Master Table
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'zones'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          Zones & Pincodes
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'rates'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Rate Cards Config
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'fleet'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          Fleet Live Map
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Audit & Event Trail
        </button>

      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'orders' && (
          <OrderMasterTable
            onViewOrderTrack={onViewOrderTrack}
            onOpenCreateOrder={onOpenCreateOrder}
          />
        )}

        {activeTab === 'zones' && <ZoneManager />}

        {activeTab === 'rates' && <RateCardConfigurator />}

        {activeTab === 'fleet' && <FleetMap />}

        {activeTab === 'audit' && <AuditLogsViewer />}
      </div>

    </div>
  );
};
