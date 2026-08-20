import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { TrackingTimeline } from '../components/customer/TrackingTimeline';
import { RescheduleModal } from '../components/customer/RescheduleModal';
import { LiveTrackingMap } from '../components/maps/LiveTrackingMap';
import { 
  Package, 
  Plus, 
  Clock, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface CustomerPageProps {
  onOpenBookOrder: () => void;
  onViewDeepTrack: (trackingNumber: string) => void;
}

export const CustomerPage: React.FC<CustomerPageProps> = ({
  onOpenBookOrder,
  onViewDeepTrack,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Selected Order for Modal Tracking
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [rescheduleOrder, setRescheduleOrder] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res: any = await orderApi.getOrders({ limit: 50 });
      if (res.success && res.data) {
        setOrders(res.data.orders);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load your orders', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'ACTIVE') return !['DELIVERED', 'CANCELLED'].includes(o.status);
    if (activeFilter === 'DELIVERED') return o.status === 'DELIVERED';
    if (activeFilter === 'FAILED') return ['FAILED', 'RESCHEDULED'].includes(o.status);
    return true;
  });

  return (
    <div className="space-y-6 py-4">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Welcome back, {user?.name || 'Customer'}
            </h2>
            <p className="text-xs text-slate-400">
              Account Type: <b className="text-brand-300">{user?.companyName || 'Standard Consumer'}</b> • Manage your shipments and track deliveries in real time.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenBookOrder}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Book New Delivery
        </button>
      </div>

      {/* Orders Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'DELIVERED', 'FAILED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeFilter === tab
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab === 'ALL' && `All Shipments (${orders.length})`}
              {tab === 'ACTIVE' && `Active Deliveries (${orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length})`}
              {tab === 'DELIVERED' && `Completed (${orders.filter((o) => o.status === 'DELIVERED').length})`}
              {tab === 'FAILED' && `Failed / Rescheduled (${orders.filter((o) => ['FAILED', 'RESCHEDULED'].includes(o.status)).length})`}
            </button>
          ))}
        </div>

        <button
          onClick={fetchOrders}
          className="text-xs text-slate-400 hover:text-white font-medium"
        >
          Refresh Orders
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-brand-400" />
            <h4 className="text-base font-semibold text-slate-300">No Orders in this Category</h4>
            <p className="text-xs mt-1 max-w-sm mx-auto">
              Place a new order with auto-calculated charges to begin tracking your delivery journey.
            </p>
            <button
              onClick={onOpenBookOrder}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold"
            >
              Book Your First Delivery
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-xl space-y-4"
            >
              {/* Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-sm text-white">{order.trackingNumber}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : order.status === 'FAILED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : order.status === 'OUT_FOR_DELIVERY'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    }`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-bold text-white font-mono">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {order.paymentType}
                  </span>
                </div>
              </div>

              {/* Route Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold text-brand-400 block uppercase">Pickup Origin</span>
                  <p className="text-slate-200 font-medium truncate mt-0.5">{order.pickupAddress}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 block uppercase">Destination Drop</span>
                  <p className="text-slate-200 font-medium truncate mt-0.5">{order.dropAddress}</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Weight: <b className="text-slate-200">{order.chargeableWeightKg} kg</b></span>
                  <span>•</span>
                  <span>Category: <b className="text-slate-200">{order.packageCategory}</b></span>
                  {order.agent && (
                    <>
                      <span>•</span>
                      <span>Agent: <b className="text-brand-300">{order.agent.user?.name}</b></span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {order.status === 'FAILED' && (
                    <button
                      onClick={() => setRescheduleOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reschedule Slot
                    </button>
                  )}

                  <button
                    onClick={() => setTrackingOrder(order)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-brand-300 border border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <span>Timeline & Map</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onViewDeepTrack(order.trackingNumber)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
                    title="Open Dedicated Fullscreen Tracking Page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Live Tracking Modal with Map & Timeline */}
      {trackingOrder && (
        <Modal
          isOpen={true}
          onClose={() => setTrackingOrder(null)}
          title={`Shipment Tracking: ${trackingOrder.trackingNumber}`}
          subtitle={`Current Status: ${trackingOrder.status.replace(/_/g, ' ')}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            <LiveTrackingMap
              pickupLat={trackingOrder.pickupLat}
              pickupLng={trackingOrder.pickupLng}
              pickupAddress={trackingOrder.pickupAddress}
              dropLat={trackingOrder.dropLat}
              dropLng={trackingOrder.dropLng}
              dropAddress={trackingOrder.dropAddress}
              agentLat={trackingOrder.agent?.currentLat}
              agentLng={trackingOrder.agent?.currentLng}
              agentName={trackingOrder.agent?.user?.name}
              vehicleNumber={trackingOrder.agent?.vehicleNumber}
              status={trackingOrder.status}
              height="h-72"
            />

            <TrackingTimeline
              order={trackingOrder}
              onRescheduleClick={() => {
                const ord = trackingOrder;
                setTrackingOrder(null);
                setRescheduleOrder(ord);
              }}
            />
          </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {rescheduleOrder && (
        <Modal
          isOpen={true}
          onClose={() => setRescheduleOrder(null)}
          title="Reschedule Failed Delivery"
          subtitle={`Order #${rescheduleOrder.trackingNumber}`}
        >
          <RescheduleModal
            orderId={rescheduleOrder.id}
            trackingNumber={rescheduleOrder.trackingNumber}
            onSuccess={() => {
              setRescheduleOrder(null);
              fetchOrders();
            }}
            onClose={() => setRescheduleOrder(null)}
          />
        </Modal>
      )}

    </div>
  );
};
