import React, { useState, useEffect } from 'react';
import { orderApi, agentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AgentTaskQueue } from '../components/agent/AgentTaskQueue';
import { 
  Truck, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Power, 
  Activity, 
  RefreshCw,
  Navigation,
  CheckCircle2
} from 'lucide-react';

export const AgentPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusToggling, setStatusToggling] = useState(false);

  const fetchAgentData = async () => {
    setLoading(true);
    try {
      const [ordersRes, agentsRes]: [any, any] = await Promise.all([
        orderApi.getOrders({ limit: 50 }),
        agentApi.getAllAgents(),
      ]);

      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data.orders);
      }

      if (agentsRes.success && agentsRes.data) {
        const found = agentsRes.data.find((a: any) => a.userId === user?.id) || agentsRes.data[0];
        setAgentProfile(found);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load agent profile', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, [user]);

  const toggleStatus = async (newStatus: 'AVAILABLE' | 'OFFLINE') => {
    setStatusToggling(true);
    try {
      const res: any = await agentApi.updateProfile({ status: newStatus });
      if (res.success && res.data) {
        setAgentProfile(res.data);
        showToast({
          type: 'success',
          title: `Status: ${newStatus}`,
          message: newStatus === 'AVAILABLE' ? 'You are now ready to receive delivery tasks.' : 'You are currently offline.',
        });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Status Toggle Failed', message: err.message });
    } finally {
      setStatusToggling(false);
    }
  };

  const isOnline = agentProfile?.status === 'AVAILABLE' || agentProfile?.status === 'BUSY';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      
      {/* Mobile-Friendly Agent Profile Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-emerald-950/40 border border-slate-800 shadow-2xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20 text-2xl">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{user?.name || agentProfile?.user?.name || 'Delivery Partner'}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {agentProfile?.vehicleType} • {agentProfile?.vehicleNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Assigned Zone: <b className="text-slate-200">{agentProfile?.homeZone?.name || 'Mumbai Central (MUM-C)'}</b>
              </p>
            </div>
          </div>

          {/* Online / Offline Switch */}
          <button
            disabled={statusToggling}
            onClick={() => toggleStatus(isOnline ? 'OFFLINE' : 'AVAILABLE')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto shadow-lg ${
              isOnline
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'Online • Ready for Orders' : 'Go Online'}</span>
          </button>
        </div>

        {/* Agent Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Rating</span>
            <span className="font-bold text-amber-300 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              {agentProfile?.rating || '4.92'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Deliveries Completed</span>
            <span className="font-bold text-white mt-0.5 block">
              {agentProfile?.totalDeliveries || 142} parcels
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Current Active Load</span>
            <span className="font-bold text-brand-300 mt-0.5 block">
              {orders.filter((o) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length} / 5 active
            </span>
          </div>
        </div>

      </div>

      {/* Task Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            My Active Delivery Task Queue
          </h3>
          <button
            onClick={fetchAgentData}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            Refresh Tasks
          </button>
        </div>

        <AgentTaskQueue
          orders={orders}
          onOrdersUpdated={fetchAgentData}
        />
      </div>

    </div>
  );
};
