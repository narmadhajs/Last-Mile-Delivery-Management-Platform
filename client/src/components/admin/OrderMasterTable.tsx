import React, { useState, useEffect } from 'react';
import { orderApi, zoneApi, agentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { 
  Package, 
  Search, 
  Filter, 
  UserCheck, 
  Zap, 
  Edit, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw
} from 'lucide-react';

interface OrderMasterTableProps {
  onViewOrderTrack: (trackingNumber: string) => void;
  onOpenCreateOrder: () => void;
}

export const OrderMasterTable: React.FC<OrderMasterTableProps> = ({
  onViewOrderTrack,
  onOpenCreateOrder,
}) => {
  const { showToast } = useToast();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Assignment Modal
  const [assigningOrder, setAssigningOrder] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Status Override Modal
  const [overrideOrder, setOverrideOrder] = useState<any>(null);
  const [overrideStatus, setOverrideStatus] = useState('CONFIRMED');
  const [overrideRemarks, setOverrideRemarks] = useState('Supervisor manual correction');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res: any = await orderApi.getOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        orderType: orderTypeFilter || undefined,
        paymentType: paymentFilter || undefined,
        limit: 50,
      });

      if (res.success && res.data) {
        setOrders(res.data.orders);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load orders', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, orderTypeFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleOpenAssignModal = async (order: any) => {
    setAssigningOrder(order);
    setLoadingCandidates(true);
    try {
      const res: any = await orderApi.getCandidates(order.id);
      if (res.success && res.data) {
        setCandidates(res.data);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error evaluating agents', message: err.message });
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleTriggerAutoAssign = async (orderId: string) => {
    try {
      const res: any = await orderApi.autoAssign(orderId);
      if (res.success) {
        showToast({
          type: 'success',
          title: '⚡ Agent Auto-Assigned',
          message: `Matched ${res.data.assignedAgent.name} (${res.data.assignedAgent.distanceKm} km away).`,
        });
        setAssigningOrder(null);
        fetchOrders();
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Auto-Assignment Failed', message: err.message });
    }
  };

  const handleManualAssign = async (orderId: string, agentId: string, agentName: string) => {
    try {
      const res: any = await orderApi.manualAssign(orderId, agentId);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Agent Assigned',
          message: `Manually assigned ${agentName} to order.`,
        });
        setAssigningOrder(null);
        fetchOrders();
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Assignment Failed', message: err.message });
    }
  };

  const handleAdminOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideOrder) return;

    try {
      const res: any = await orderApi.adminOverride(overrideOrder.id, {
        status: overrideStatus,
        remarks: overrideRemarks,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Admin Status Override Applied',
          message: `Order status forced to ${overrideStatus} with immutable audit log.`,
        });
        setOverrideOrder(null);
        fetchOrders();
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Override Failed', message: err.message });
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking #, customer name, address..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs font-medium cursor-pointer"
          >
            <option value="" className="bg-slate-900">All Statuses</option>
            <option value="CONFIRMED" className="bg-slate-900">Confirmed (Unassigned)</option>
            <option value="ASSIGNED" className="bg-slate-900">Assigned</option>
            <option value="PICKED_UP" className="bg-slate-900">Picked Up</option>
            <option value="IN_TRANSIT" className="bg-slate-900">In Transit</option>
            <option value="OUT_FOR_DELIVERY" className="bg-slate-900">Out for Delivery</option>
            <option value="DELIVERED" className="bg-slate-900">Delivered</option>
            <option value="FAILED" className="bg-slate-900">Failed (Needs Reschedule)</option>
            <option value="RESCHEDULED" className="bg-slate-900">Rescheduled</option>
          </select>

          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs font-medium cursor-pointer"
          >
            <option value="" className="bg-slate-900">B2C & B2B</option>
            <option value="B2C" className="bg-slate-900">B2C Retail</option>
            <option value="B2B" className="bg-slate-900">B2B Enterprise</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs font-medium cursor-pointer"
          >
            <option value="" className="bg-slate-900">All Payments</option>
            <option value="PREPAID" className="bg-slate-900">Prepaid</option>
            <option value="COD" className="bg-slate-900">COD</option>
          </select>

          <button
            onClick={onOpenCreateOrder}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            Create on Behalf of Customer
          </button>

        </div>

      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Tracking #</th>
                <th className="px-4 py-3.5">Customer & Type</th>
                <th className="px-4 py-3.5">Origin ➔ Destination</th>
                <th className="px-4 py-3.5">Weight & Charge</th>
                <th className="px-4 py-3.5">Assigned Agent</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-medium">No matching orders found</p>
                    <p className="text-xs mt-0.5">Try modifying filters or create a new order</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition">
                    
                    {/* Tracking # */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => onViewOrderTrack(order.trackingNumber)}
                        className="font-mono font-bold text-brand-300 hover:text-brand-200 hover:underline flex items-center gap-1"
                      >
                        {order.trackingNumber}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Customer & Order Type */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-200 block">{order.customer?.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            order.orderType === 'B2B'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-brand-500/20 text-brand-300'
                          }`}
                        >
                          {order.orderType}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            order.paymentType === 'COD'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {order.paymentType}
                        </span>
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="truncate text-slate-300 font-medium">{order.pickupArea || order.pickupCity}</div>
                      <div className="truncate text-slate-400 text-[11px]">➔ {order.dropArea || order.dropCity}</div>
                    </td>

                    {/* Weight & Charge */}
                    <td className="px-4 py-3.5 font-mono">
                      <span className="font-bold text-white block">₹{order.totalAmount.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400">{order.chargeableWeightKg} kg billed</span>
                    </td>

                    {/* Assigned Agent */}
                    <td className="px-4 py-3.5">
                      {order.agent ? (
                        <div>
                          <span className="font-semibold text-slate-200 block">{order.agent.user?.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{order.agent.vehicleNumber}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(order)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Assign Agent
                        </button>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : order.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : order.status === 'IN_TRANSIT'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Auto-Assign trigger */}
                        {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                          <button
                            onClick={() => handleTriggerAutoAssign(order.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 transition"
                            title="Auto-Assign Nearest Agent"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Manual Assign candidate drawer */}
                        {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                          <button
                            onClick={() => handleOpenAssignModal(order)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Manual Assign Agent"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Admin Status Override */}
                        <button
                          onClick={() => {
                            setOverrideOrder(order);
                            setOverrideStatus(order.status);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          title="Admin Status Override"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Assignment Modal (Shows Ranked Candidates) */}
      {assigningOrder && (
        <Modal
          isOpen={true}
          onClose={() => setAssigningOrder(null)}
          title={`Assign Delivery Partner`}
          subtitle={`Order #${assigningOrder.trackingNumber} • Destination: ${assigningOrder.dropAddress}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-brand-950/40 border border-brand-500/40 text-xs">
              <div>
                <span className="font-bold text-brand-200">Intelligent Heuristic Matching:</span>
                <p className="text-slate-300 mt-0.5">
                  Agents scored based on Haversine proximity, current active queue load, zone affinity, and rating.
                </p>
              </div>
              <button
                onClick={() => handleTriggerAutoAssign(assigningOrder.id)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5" />
                Trigger Auto-Assign
              </button>
            </div>

            {loadingCandidates ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Evaluating candidate proximity & workload...
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {candidates.map((cand, idx) => (
                  <div
                    key={cand.agentId}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 flex items-center justify-between transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{cand.name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ★ Recommended Match
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {cand.vehicleType} • {cand.vehicleNumber}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Distance: <b className="text-brand-300">{cand.distanceKm} km</b></span>
                        <span>ETA: <b className="text-slate-200">{cand.estimatedArrivalMinutes} min</b></span>
                        <span>Active Queue: <b className="text-slate-200">{cand.activeOrderCount}/{cand.maxCapacity}</b></span>
                        <span>Rating: <b className="text-amber-300">★ {cand.rating}</b></span>
                        <span>Score: <b className="font-mono text-slate-300">{cand.compositeScore}</b></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleManualAssign(assigningOrder.id, cand.agentId, cand.name)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-brand-500 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Admin Status Override Modal */}
      {overrideOrder && (
        <Modal
          isOpen={true}
          onClose={() => setOverrideOrder(null)}
          title="Admin Status Override"
          subtitle={`Manually override lifecycle state for order #${overrideOrder.trackingNumber}`}
        >
          <form onSubmit={handleAdminOverride} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
              <ShieldAlert className="w-4 h-4 inline mr-1 text-rose-400" />
              <b>Administrative Override:</b> This will bypass regular lifecycle constraints and record an immutable audit entry with your administrator credentials.
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Status</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-semibold"
              >
                <option value="CONFIRMED" className="bg-slate-900">CONFIRMED (Ready for Pickup)</option>
                <option value="ASSIGNED" className="bg-slate-900">ASSIGNED (Agent Allocated)</option>
                <option value="PICKED_UP" className="bg-slate-900">PICKED_UP (In transit to Hub)</option>
                <option value="IN_TRANSIT" className="bg-slate-900">IN_TRANSIT (Between Hubs)</option>
                <option value="OUT_FOR_DELIVERY" className="bg-slate-900">OUT_FOR_DELIVERY (Last Mile Active)</option>
                <option value="DELIVERED" className="bg-slate-900">DELIVERED (Successfully Completed)</option>
                <option value="FAILED" className="bg-slate-900">FAILED (Requires Reschedule)</option>
                <option value="RESCHEDULED" className="bg-slate-900">RESCHEDULED (Customer Slot Confirmed)</option>
                <option value="CANCELLED" className="bg-slate-900">CANCELLED (Voided)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Audit Reason / Remarks (Mandatory)
              </label>
              <textarea
                rows={2}
                required
                value={overrideRemarks}
                onChange={(e) => setOverrideRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                placeholder="State the reason for this administrative intervention"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOverrideOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/25"
              >
                Apply Override
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
