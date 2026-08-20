import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LiveTrackingMap } from '../components/maps/LiveTrackingMap';
import { TrackingTimeline } from '../components/customer/TrackingTimeline';
import { RescheduleModal } from '../components/customer/RescheduleModal';
import { Modal } from '../components/common/Modal';
import { 
  Package, 
  Search, 
  Truck, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard, 
  Share2, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface TrackingPageProps {
  initialTrackingNumber?: string;
  onBack: () => void;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({
  initialTrackingNumber = 'TRK-2026-MUM901',
  onBack,
}) => {
  const { showToast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [searchInput, setSearchInput] = useState(initialTrackingNumber);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const fetchTracking = async (trkNum: string) => {
    setLoading(true);
    try {
      const res: any = await orderApi.trackOrder(trkNum);
      if (res.success && res.data) {
        setOrder(res.data);
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Tracking Lookup Failed', message: err.message || 'Order not found' });
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrackingNumber) {
      setTrackingNumber(initialTrackingNumber);
      setSearchInput(initialTrackingNumber);
      fetchTracking(initialTrackingNumber);
    }
  }, [initialTrackingNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTrackingNumber(searchInput.trim());
      fetchTracking(searchInput.trim());
    }
  };

  const copyTrackingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast({ type: 'success', title: 'Link Copied', message: 'Tracking link copied to clipboard.' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      
      {/* Top Search & Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-3xl border border-slate-800">
        <button
          onClick={onBack}
          className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1.5 self-start"
        >
          ← Back to Dashboard
        </button>

        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by tracking # (e.g. TRK-2026-MUM901)"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition"
          >
            Track
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Fetching live satellite & carrier telemetry...
        </div>
      ) : !order ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <h4 className="text-base font-semibold text-slate-300">Shipment Not Found</h4>
          <p className="text-xs mt-1">Please verify the tracking number and try again.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-xl text-white">
                    {order.trackingNumber}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
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
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Booked on {new Date(order.createdAt).toLocaleString()} • {order.orderType} Shipment
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={copyTrackingLink}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Tracking
                </button>

                {order.status === 'FAILED' && (
                  <button
                    onClick={() => setIsRescheduleOpen(true)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-rose-500/25 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reschedule
                  </button>
                )}
              </div>
            </div>

            {/* Live Interactive Leaflet Map */}
            <LiveTrackingMap
              pickupLat={order.pickupLat}
              pickupLng={order.pickupLng}
              pickupAddress={order.pickupAddress}
              dropLat={order.dropLat}
              dropLng={order.dropLng}
              dropAddress={order.dropAddress}
              agentLat={order.agent?.currentLat}
              agentLng={order.agent?.currentLng}
              agentName={order.agent?.user?.name}
              vehicleNumber={order.agent?.vehicleNumber}
              status={order.status}
              height="h-80"
            />

            {/* Quick Driver Card & Charges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Driver Details */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20 text-lg">
                    🛵
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Assigned Delivery Partner
                    </span>
                    <h4 className="font-bold text-sm text-white">
                      {order.agent?.user?.name || 'Assigning nearest partner...'}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {order.agent?.vehicleType || 'Vehicle'} • {order.agent?.vehicleNumber || 'En Route'}
                    </p>
                  </div>
                </div>

                {order.agent?.user?.phone && (
                  <a
                    href={`tel:${order.agent.user.phone}`}
                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1 text-xs font-semibold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Partner
                  </a>
                )}
              </div>

              {/* Package & Payment Summary */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Package Details</span>
                  <p className="font-medium text-slate-200 mt-0.5">{order.packageCategory}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Weight: <b className="text-white">{order.chargeableWeightKg} kg</b> ({order.actualWeightKg} kg actual)
                  </p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount</span>
                  <span className="text-base font-bold text-white block">₹{order.totalAmount.toFixed(2)}</span>
                  <span className="text-[10px] text-brand-300 font-semibold">{order.paymentType}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Timeline Section */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl">
            <TrackingTimeline
              order={order}
              onRescheduleClick={() => setIsRescheduleOpen(true)}
            />
          </div>

        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && order && (
        <Modal
          isOpen={true}
          onClose={() => setIsRescheduleOpen(false)}
          title="Reschedule Failed Delivery"
          subtitle={`Order #${order.trackingNumber}`}
        >
          <RescheduleModal
            orderId={order.id}
            trackingNumber={order.trackingNumber}
            onSuccess={() => {
              setIsRescheduleOpen(false);
              fetchTracking(trackingNumber);
            }}
            onClose={() => setIsRescheduleOpen(false)}
          />
        </Modal>
      )}

    </div>
  );
};
