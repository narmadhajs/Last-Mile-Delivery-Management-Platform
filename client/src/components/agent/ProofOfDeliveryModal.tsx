import React, { useRef, useState } from 'react';
import { CheckCheck, Eraser, ShieldCheck, KeyRound } from 'lucide-react';

interface ProofOfDeliveryModalProps {
  order: any;
  onConfirm: (proofData: { signature?: string; otp?: string; remarks?: string }) => void;
  onClose: () => void;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  order,
  onConfirm,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [otp, setOtp] = useState('8392');
  const [remarks, setRemarks] = useState('Handed over to recipient in person.');

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const signatureData = canvas && hasSignature ? canvas.toDataURL() : undefined;

    onConfirm({
      signature: signatureData,
      otp,
      remarks,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200">
        <span className="font-bold block mb-0.5">Proof of Delivery Capture</span>
        Order: <b className="text-white">{order.trackingNumber}</b> • {order.paymentType === 'COD' ? `Collect ₹${order.totalAmount} (COD)` : 'Prepaid'}
      </div>

      {/* Signature Canvas */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Customer Digital Signature
          </label>
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
          >
            <Eraser className="w-3 h-3" />
            Clear
          </button>
        </div>

        <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950">
          <canvas
            ref={canvasRef}
            width={400}
            height={140}
            className="w-full h-36 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Sign inside the box with finger or mouse</p>
      </div>

      {/* Delivery OTP */}
      <div>
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
          <KeyRound className="w-3.5 h-3.5 text-brand-400" />
          Delivery Verification OTP (Optional)
        </label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
          placeholder="e.g. 8392"
        />
      </div>

      {/* Driver Remarks */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1">
          Agent Remarks
        </label>
        <input
          type="text"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full px-3 py-2 rounded-xl glass-input text-xs"
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
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
        >
          <CheckCheck className="w-4 h-4" />
          Confirm Successful Delivery
        </button>
      </div>
    </form>
  );
};
