import React, { useState, useEffect } from 'react';
import { rateApi, zoneApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Calculator, Sparkles, ArrowRight, ShieldCheck, Scale, Box, MapPin, CheckCircle2 } from 'lucide-react';

interface QuickQuoteCalculatorProps {
  onSelectBookWithQuote?: (quoteData: any) => void;
}

export const QuickQuoteCalculator: React.FC<QuickQuoteCalculatorProps> = ({ onSelectBookWithQuote }) => {
  const { showToast } = useToast();

  const [pickupPincode, setPickupPincode] = useState('400021');
  const [dropPincode, setDropPincode] = useState('400013');
  const [lengthCm, setLengthCm] = useState(25);
  const [widthCm, setWidthCm] = useState(15);
  const [heightCm, setHeightCm] = useState(10);
  const [actualWeightKg, setActualWeightKg] = useState(1.2);
  const [orderType, setOrderType] = useState<'B2C' | 'B2B'>('B2C');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');

  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<any>(null);

  const calculateEstimate = async () => {
    setLoading(true);
    try {
      const res: any = await rateApi.calculateQuote({
        pickupPincode,
        dropPincode,
        lengthCm,
        widthCm,
        heightCm,
        actualWeightKg,
        orderType,
        paymentType,
      });

      if (res.success && res.data) {
        setQuoteResult(res.data);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Quote Calculation Error',
        message: err.message || 'Failed to compute delivery rate',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateEstimate();
  }, [pickupPincode, dropPincode, lengthCm, widthCm, heightCm, actualWeightKg, orderType, paymentType]);

  const presetExamples = [
    { label: 'Smartphone / Gadget (B2C)', L: 20, W: 12, H: 6, weight: 0.6, type: 'B2C', pay: 'PREPAID' },
    { label: 'Laptop / Fragile Box (B2C)', L: 40, W: 30, H: 10, weight: 2.5, type: 'B2C', pay: 'COD' },
    { label: 'Bulk Commercial Server (B2B)', L: 50, W: 40, H: 30, weight: 4.5, type: 'B2B', pay: 'PREPAID' },
    { label: 'Heavy Industrial Carton (B2B)', L: 60, W: 50, H: 40, weight: 15.0, type: 'B2B', pay: 'COD' },
  ];

  return (
    <div className="p-1 space-y-6">
      
      {/* Preset Quick Chips */}
      <div>
        <label className="text-xs font-semibold text-slate-400 block mb-2">⚡ Quick Sample Packages:</label>
        <div className="flex flex-wrap gap-2">
          {presetExamples.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setLengthCm(preset.L);
                setWidthCm(preset.W);
                setHeightCm(preset.H);
                setActualWeightKg(preset.weight);
                setOrderType(preset.type as any);
                setPaymentType(preset.pay as any);
              }}
              className="text-xs px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-brand-500/40 transition flex items-center gap-1.5"
            >
              <span>📦</span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Inputs */}
        <div className="space-y-4">
          
          {/* Order Type & Payment Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Order Type</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderType('B2C')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    orderType === 'B2C'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  B2C Retail
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('B2B')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    orderType === 'B2B'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  B2B Freight
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentType('PREPAID')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    paymentType === 'PREPAID'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Prepaid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('COD')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    paymentType === 'COD'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  COD
                </button>
              </div>
            </div>
          </div>

          {/* Postal Codes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                Pickup Pincode
              </label>
              <input
                type="text"
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                placeholder="e.g. 400021"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Drop Pincode
              </label>
              <input
                type="text"
                value={dropPincode}
                onChange={(e) => setDropPincode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                placeholder="e.g. 400013"
              />
            </div>
          </div>

          {/* Package Dimensions */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-brand-400" />
                Dimensions (cm)
              </span>
              <span className="text-xs font-mono text-brand-300">
                {lengthCm} × {widthCm} × {heightCm} cm
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Length: {lengthCm}cm</span>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(parseInt(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Width: {widthCm}cm</span>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={widthCm}
                  onChange={(e) => setWidthCm(parseInt(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Height: {heightCm}cm</span>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Actual Weight */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-400" />
                Actual Package Weight
              </span>
              <span className="text-xs font-mono text-emerald-300 font-bold">{actualWeightKg} kg</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="50"
              step="0.1"
              value={actualWeightKg}
              onChange={(e) => setActualWeightKg(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

        </div>

        {/* Right Live Calculation Output */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/90 flex flex-col justify-between shadow-xl">
          {loading && !quoteResult ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Calculating dynamic rate...
            </div>
          ) : quoteResult ? (
            <div className="space-y-4">
              
              {/* Grand Total Header */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-brand-950/80 via-slate-900 to-slate-900 border border-brand-500/30 text-center">
                <span className="text-[11px] uppercase font-bold tracking-wider text-brand-300">
                  Estimated Delivery Charge
                </span>
                <div className="text-3xl font-extrabold text-white mt-1">
                  ₹{quoteResult.totalAmount.toFixed(2)}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      quoteResult.isIntraZone
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {quoteResult.isIntraZone ? 'Intra-Zone Delivery' : 'Inter-Zone Delivery'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {quoteResult.rateCard.name}
                  </span>
                </div>
              </div>

              {/* Weight Comparison Card */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`p-3 rounded-xl border ${
                    quoteResult.billedOn === 'ACTUAL_WEIGHT'
                      ? 'bg-brand-950/40 border-brand-500/40 text-brand-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] block opacity-80">Actual Weight</span>
                  <span className="font-mono font-bold text-sm">{quoteResult.actualWeightKg} kg</span>
                  {quoteResult.billedOn === 'ACTUAL_WEIGHT' && (
                    <span className="text-[9px] block text-brand-300 font-semibold mt-0.5">★ Billed Weight</span>
                  )}
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    quoteResult.billedOn === 'VOLUMETRIC_WEIGHT'
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] block opacity-80">Volumetric (L×B×H÷5000)</span>
                  <span className="font-mono font-bold text-sm">{quoteResult.volumetricWeightKg} kg</span>
                  {quoteResult.billedOn === 'VOLUMETRIC_WEIGHT' && (
                    <span className="text-[9px] block text-amber-300 font-semibold mt-0.5">★ Billed Weight</span>
                  )}
                </div>
              </div>

              {/* Itemized Cost Breakdown */}
              <div className="space-y-1.5 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-slate-300">
                  <span>Base Fare (up to {quoteResult.rateCard.baseWeightKg} kg)</span>
                  <span className="font-mono">₹{quoteResult.baseCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>
                    Excess Weight ({quoteResult.excessWeightKg} kg • {quoteResult.incrementalSlabs} slab(s))
                  </span>
                  <span className="font-mono">₹{quoteResult.incrementalCharge.toFixed(2)}</span>
                </div>
                {paymentType === 'COD' && (
                  <div className="flex justify-between text-amber-300 font-medium">
                    <span>COD Surcharge</span>
                    <span className="font-mono">₹{quoteResult.codSurcharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between font-bold text-white text-sm">
                  <span>Total Amount</span>
                  <span className="font-mono text-brand-300">₹{quoteResult.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Auto-detected Zones */}
              <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                <span>📍 From: <b className="text-slate-200">{quoteResult.pickupZone.name}</b></span>
                <span>➔ To: <b className="text-slate-200">{quoteResult.dropZone.name}</b></span>
              </div>

              {onSelectBookWithQuote && (
                <button
                  type="button"
                  onClick={() => onSelectBookWithQuote(quoteResult)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>Proceed to Book Delivery with this Rate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

            </div>
          ) : null}
        </div>

      </div>

    </div>
  );
};
