import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  AlertTriangle, 
  User, 
  ShieldCheck, 
  Calendar, 
  FileCheck,
  RotateCcw
} from 'lucide-react';

interface TrackingTimelineProps {
  order: any;
  onRescheduleClick?: () => void;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  order,
  onRescheduleClick,
}) => {
  const steps = [
    { key: 'CONFIRMED', label: 'Order Confirmed' },
    { key: 'ASSIGNED', label: 'Agent Assigned' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const statusOrder = ['CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIndex = statusOrder.indexOf(order.status);
  const isFailed = order.status === 'FAILED';
  const isRescheduled = order.status === 'RESCHEDULED';

  return (
    <div className="space-y-6">
      
      {/* Progress Stepper */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between relative">
          
          {/* Connector Line */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
          
          {steps.map((step, idx) => {
            const isCompleted = !isFailed && currentIndex >= idx;
            const isCurrent = !isFailed && currentIndex === idx;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 shadow-lg shadow-brand-500/50'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isFailed && idx === currentIndex
                      ? 'bg-rose-500 text-white ring-4 ring-rose-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-medium text-center max-w-[65px] ${
                    isCurrent
                      ? 'text-brand-300 font-bold'
                      : isCompleted
                      ? 'text-emerald-400'
                      : isFailed && idx === currentIndex
                      ? 'text-rose-400 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failed Delivery Reschedule Alert Callout */}
      {isFailed && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-200">Delivery Attempt Failed</h4>
              <p className="text-xs text-rose-300/90 mt-0.5">
                Reason: <b className="text-white">"{order.failureReason || 'Customer Unavailable'}"</b>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                You can reschedule this delivery for a new date & preferred time slot without any extra charge.
              </p>
            </div>
          </div>

          {onRescheduleClick && (
            <button
              onClick={onRescheduleClick}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reschedule Delivery
            </button>
          )}
        </div>
      )}

      {/* Rescheduled Confirmation Banner */}
      {isRescheduled && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-200">Delivery Rescheduled:</span>
            <p className="text-slate-300 mt-0.5">
              Scheduled for <b className="text-white">{order.rescheduledDeliveryDate ? new Date(order.rescheduledDeliveryDate).toLocaleDateString() : 'Upcoming Slot'}</b> ({order.rescheduleTimeSlot || 'Standard Slot'}).
            </p>
          </div>
        </div>
      )}

      {/* Proof of Delivery (Delivered state) */}
      {order.status === 'DELIVERED' && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-xs font-bold text-emerald-200">Delivery Completed Successfully</h4>
              <p className="text-[11px] text-slate-400">
                Delivered on {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'Today'}
              </p>
            </div>
          </div>
          {order.proofSignature && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Digital Signature Verified ✓
            </span>
          )}
        </div>
      )}

      {/* Chronological Append-Only Event Log */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-brand-400" />
          Immutable Audit Tracking History
        </h4>

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
          {order.trackingHistory?.map((event: any, idx: number) => (
            <div key={event.id || idx} className="relative flex items-start gap-4 pl-8">
              
              {/* Timeline Indicator Dot */}
              <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-brand-400" />

              <div className="flex-1 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                      {event.status.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        event.actorRole === 'SYSTEM'
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          : event.actorRole === 'ADMIN'
                          ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                          : event.actorRole === 'AGENT'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                      }`}
                    >
                      Actor: {event.actorRole} ({event.actorName})
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(event.timestamp).toLocaleDateString()}
                  </span>
                </div>

                {event.locationText && (
                  <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    {event.locationText}
                  </p>
                )}

                {event.remarks && (
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    "{event.remarks}"
                  </p>
                )}

                {event.failureReason && (
                  <p className="text-[11px] text-rose-300 mt-1 font-semibold">
                    Failure Cause: {event.failureReason}
                  </p>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
