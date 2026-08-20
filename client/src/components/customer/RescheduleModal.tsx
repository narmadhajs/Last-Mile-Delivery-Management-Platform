import React, { useState } from 'react';
import { orderApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Calendar, Clock, RotateCcw, CheckCircle2 } from 'lucide-react';

interface RescheduleModalProps {
  orderId: string;
  trackingNumber: string;
  onSuccess: (updatedOrder: any) => void;
  onClose: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  orderId,
  trackingNumber,
  onSuccess,
  onClose,
}) => {
  const { showToast } = useToast();

  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
  const [rescheduledDate, setRescheduledDate] = useState(tomorrow);
  const [timeSlot, setTimeSlot] = useState('14:00 - 18:00 (Afternoon)');
  const [remarks, setRemarks] = useState('Please deliver after 2:30 PM, call upon arrival.');
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    { label: 'Morning Slot (09:00 AM - 01:00 PM)', value: '09:00 - 13:00' },
    { label: 'Afternoon Slot (02:00 PM - 06:00 PM)', value: '14:00 - 18:00' },
    { label: 'Evening Slot (06:00 PM - 09:00 PM)', value: '18:00 - 21:00' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res: any = await orderApi.reschedule(orderId, {
        rescheduledDate,
        timeSlot,
        remarks,
      });

      if (res.success && res.data) {
        showToast({
          type: 'success',
          title: 'Delivery Rescheduled',
          message: `Order #${trackingNumber} rescheduled to ${rescheduledDate} (${timeSlot}). Nearest partner will be allocated.`,
        });
        onSuccess(res.data.order);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rescheduling Failed',
        message: err.message || 'Could not reschedule delivery slot',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200">
        <span className="font-bold block text-sm mb-1">Reschedule Delivery Attempt</span>
        Select your preferred delivery date and time window. We will allocate the best delivery partner for your slot.
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
          <Calendar className="w-4 h-4 text-brand-400" />
          Preferred Delivery Date
        </label>
        <input
          type="date"
          required
          min={tomorrow}
          value={rescheduledDate}
          onChange={(e) => setRescheduledDate(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
          <Clock className="w-4 h-4 text-brand-400" />
          Preferred Time Window
        </label>
        <div className="space-y-2">
          {timeSlots.map((slot) => (
            <label
              key={slot.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                timeSlot === slot.value
                  ? 'bg-brand-500/15 border-brand-500 text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <input
                type="radio"
                name="timeSlot"
                value={slot.value}
                checked={timeSlot === slot.value}
                onChange={() => setTimeSlot(slot.value)}
                className="accent-brand-500"
              />
              <span className="text-xs font-medium">{slot.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1">
          Special Delivery Instructions (Optional)
        </label>
        <textarea
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full px-3 py-2 rounded-xl glass-input text-xs"
          placeholder="e.g. Leave with security, doorbell broken, call on arrival"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-600 hover:to-brand-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
        >
          {loading ? 'Rescheduling...' : 'Confirm Rescheduled Slot'}
        </button>
      </div>
    </form>
  );
};
