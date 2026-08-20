import React, { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';

interface FailDeliveryModalProps {
  order: any;
  onConfirm: (data: { failureReason: string; remarks: string }) => void;
  onClose: () => void;
}

export const FailDeliveryModal: React.FC<FailDeliveryModalProps> = ({
  order,
  onConfirm,
  onClose,
}) => {
  const commonReasons = [
    'Customer Unavailable / Door Locked',
    'Incorrect / Incomplete Delivery Address',
    'Customer Refused Delivery / Cancelled',
    'Payment Not Ready for COD',
    'Customer Requested Future Reschedule',
    'Security / Gated Community Access Denied',
  ];

  const [selectedReason, setSelectedReason] = useState(commonReasons[0]);
  const [remarks, setRemarks] = useState('Attempted contact 3 times via phone, no response.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      failureReason: selectedReason,
      remarks,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
        <span className="font-bold block mb-0.5">Flag Delivery Attempt as Failed</span>
        This will immediately notify the customer with an automated reschedule link and free up your active delivery queue.
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1.5">
          Select Primary Failure Reason
        </label>
        <div className="space-y-2">
          {commonReasons.map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                selectedReason === reason
                  ? 'bg-rose-500/15 border-rose-500 text-rose-200 font-semibold'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <input
                type="radio"
                name="failureReason"
                value={reason}
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
                className="accent-rose-500"
              />
              <span>{reason}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1">
          Detailed Agent Field Notes
        </label>
        <textarea
          rows={2}
          required
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full px-3 py-2 rounded-xl glass-input text-xs"
          placeholder="Describe attempt details (e.g. guard refused entry, phoned at 2:15pm)"
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
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Mark as Failed Attempt
        </button>
      </div>
    </form>
  );
};
