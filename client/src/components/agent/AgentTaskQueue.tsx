import React, { useState } from 'react';
import { orderApi, agentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';
import { FailDeliveryModal } from './FailDeliveryModal';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  Navigation, 
  FileCheck, 
  XCircle,
  PackageCheck
} from 'lucide-react';

interface AgentTaskQueueProps {
  orders: any[];
  onOrdersUpdated: () => void;
}

export const AgentTaskQueue: React.FC<AgentTaskQueueProps> = ({
  orders,
  onOrdersUpdated,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedOrderForPod, setSelectedOrderForPod] = useState<any>(null);
  const [selectedOrderForFail, setSelectedOrderForFail] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleSimpleTransition = async (orderId: string, nextStatus: string, label: string) => {
    setUpdatingId(orderId);
    try {
      const res: any = await orderApi.updateStatus(orderId, {
        status: nextStatus,
        remarks: `Agent progressed status to ${nextStatus}`,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: `Status Updated: ${label}`,
          message: `Order #${res.data.trackingNumber} is now ${nextStatus}`,
        });
        onOrdersUpdated();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Status Update Failed',
        message: err.message || 'Could not update order status',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteDelivery = async (proofData: any) => {
    if (!selectedOrderForPod) return;
    setUpdatingId(selectedOrderForPod.id);
    try {
      const res: any = await orderApi.updateStatus(selectedOrderForPod.id, {
        status: 'DELIVERED',
        proofSignature: proofData.signature,
        proofOtp: proofData.otp,
        remarks: proofData.remarks,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: '🎉 Delivery Successfully Completed!',
          message: `Order #${res.data.trackingNumber} marked DELIVERED with proof.`,
        });
        setSelectedOrderForPod(null);
        onOrdersUpdated();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Complete Delivery',
        message: err.message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFailDelivery = async (failData: any) => {
    if (!selectedOrderForFail) return;
    setUpdatingId(selectedOrderForFail.id);
    try {
      const res: any = await orderApi.updateStatus(selectedOrderForFail.id, {
        status: 'FAILED',
        failureReason: failData.failureReason,
        remarks: failData.remarks,
      });

      if (res.success) {
        showToast({
          type: 'warning',
          title: 'Delivery Marked Failed',
          message: `Customer automatically notified with reschedule link.`,
        });
        setSelectedOrderForFail(null);
        onOrdersUpdated();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Record Failure',
        message: err.message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const activeOrders = orders.filter((o) =>
    ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)
  );

  return (
    <div className="space-y-4">
      {activeOrders.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
          <Truck className="w-10 h-10 mx-auto mb-2 opacity-40 text-brand-400" />
          <h4 className="text-sm font-semibold text-slate-300">No Active Deliveries in Queue</h4>
          <p className="text-xs mt-1">You are currently available to receive new automated assignments.</p>
        </div>
      ) : (
        activeOrders.map((order) => (
          <div
            key={order.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-slate-700 transition space-y-4"
          >
            {/* Order Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-sm text-white">{order.trackingNumber}</span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    order.status === 'OUT_FOR_DELIVERY'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : order.status === 'PICKED_UP'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  }`}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Payment Badge */}
              <div className="text-right">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    order.paymentType === 'COD'
                      ? 'bg-amber-950 text-amber-300 border border-amber-600/50'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                  }`}
                >
                  {order.paymentType === 'COD' ? `Collect ₹${order.totalAmount} (COD)` : 'Prepaid (₹0 Collect)'}
                </span>
              </div>
            </div>

            {/* Addresses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-[10px] font-bold text-brand-400 block uppercase">Pickup Origin</span>
                <p className="font-medium text-slate-200 mt-0.5">{order.pickupAddress}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Contact: {order.pickupContactName} • {order.pickupContactPhone}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-400 block uppercase">Drop Destination</span>
                <p className="font-medium text-slate-200 mt-0.5">{order.dropAddress}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] text-slate-400">
                    Recipient: {order.dropContactName} • {order.dropContactPhone}
                  </p>
                  <a
                    href={`tel:${order.dropContactPhone}`}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-brand-400 text-[10px] flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    Call
                  </a>
                </div>
              </div>
            </div>

            {/* Step-by-Step Transition Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
              
              <div className="text-[11px] text-slate-400">
                Weight: <b className="text-slate-200">{order.chargeableWeightKg} kg</b> • Cat: <b className="text-slate-200">{order.packageCategory}</b>
              </div>

              <div className="flex items-center gap-2">
                
                {order.status === 'ASSIGNED' && (
                  <button
                    disabled={updatingId === order.id}
                    onClick={() => handleSimpleTransition(order.id, 'PICKED_UP', 'Picked Up')}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    Confirm Package Pickup
                  </button>
                )}

                {order.status === 'PICKED_UP' && (
                  <button
                    disabled={updatingId === order.id}
                    onClick={() => handleSimpleTransition(order.id, 'IN_TRANSIT', 'In Transit')}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Depart / In Transit
                  </button>
                )}

                {order.status === 'IN_TRANSIT' && (
                  <button
                    disabled={updatingId === order.id}
                    onClick={() => handleSimpleTransition(order.id, 'OUT_FOR_DELIVERY', 'Out for Delivery')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Start Out for Delivery
                  </button>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <>
                    <button
                      onClick={() => setSelectedOrderForFail(order)}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Failed Attempt
                    </button>

                    <button
                      onClick={() => setSelectedOrderForPod(order)}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete Delivery (POD)
                    </button>
                  </>
                )}

              </div>
            </div>

          </div>
        ))
      )}

      {/* Proof of Delivery Modal */}
      {selectedOrderForPod && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrderForPod(null)}
          title="Digital Proof of Delivery"
          subtitle={`Capture customer signature for order #${selectedOrderForPod.trackingNumber}`}
        >
          <ProofOfDeliveryModal
            order={selectedOrderForPod}
            onConfirm={handleCompleteDelivery}
            onClose={() => setSelectedOrderForPod(null)}
          />
        </Modal>
      )}

      {/* Fail Delivery Modal */}
      {selectedOrderForFail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrderForFail(null)}
          title="Report Delivery Failure"
          subtitle={`Order #${selectedOrderForFail.trackingNumber}`}
        >
          <FailDeliveryModal
            order={selectedOrderForFail}
            onConfirm={handleFailDelivery}
            onClose={() => setSelectedOrderForFail(null)}
          />
        </Modal>
      )}

    </div>
  );
};
