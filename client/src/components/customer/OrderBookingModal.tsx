import React, { useState, useEffect } from 'react';
import { orderApi, rateApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';
import { 
  Package, 
  MapPin, 
  User, 
  Phone, 
  Box, 
  Scale, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Info
} from 'lucide-react';

interface OrderBookingModalProps {
  initialQuoteData?: any;
  onSuccess: (newOrder: any) => void;
  onClose: () => void;
}

export const OrderBookingModal: React.FC<OrderBookingModalProps> = ({
  initialQuoteData,
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orderType, setOrderType] = useState<'B2C' | 'B2B'>(
    initialQuoteData?.rateCard?.orderType || (user?.companyName?.includes('Apex') ? 'B2B' : 'B2C')
  );
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');

  // Pickup Details
  const [pickupAddress, setPickupAddress] = useState('Flat 402, Sea Green Apts, Nariman Point');
  const [pickupPincode, setPickupPincode] = useState('400021');
  const [pickupCity, setPickupCity] = useState('Mumbai');
  const [pickupContactName, setPickupContactName] = useState(user?.name || 'John Fernandes');
  const [pickupContactPhone, setPickupContactPhone] = useState(user?.phone || '+91-9876543210');

  // Drop Details
  const [dropAddress, setDropAddress] = useState('Tower 3, Peninsula Business Park, Lower Parel');
  const [dropPincode, setDropPincode] = useState('400013');
  const [dropCity, setDropCity] = useState('Mumbai');
  const [dropContactName, setDropContactName] = useState('Rohan Mehta');
  const [dropContactPhone, setDropContactPhone] = useState('+91-9819001122');

  // Package Details
  const [lengthCm, setLengthCm] = useState(initialQuoteData ? initialQuoteData.actualWeightKg : 25);
  const [widthCm, setWidthCm] = useState(15);
  const [heightCm, setHeightCm] = useState(10);
  const [actualWeightKg, setActualWeightKg] = useState(1.2);
  const [packageCategory, setPackageCategory] = useState('Electronics & Gadgets');
  const [specialInstructions, setSpecialInstructions] = useState('Handle with care - fragile electronics');
  const [autoAssignAgent, setAutoAssignAgent] = useState(true);

  const [loading, setLoading] = useState(false);
  const [calculatingRate, setCalculatingRate] = useState(false);
  const [liveRate, setLiveRate] = useState<any>(initialQuoteData || null);

  // Re-calculate live rate whenever dimensions or pincodes change
  const refreshRate = async () => {
    setCalculatingRate(true);
    try {
      const res: any = await rateApi.calculateQuote({
        pickupPincode,
        dropPincode,
        lengthCm: parseFloat(String(lengthCm)) || 10,
        widthCm: parseFloat(String(widthCm)) || 10,
        heightCm: parseFloat(String(heightCm)) || 10,
        actualWeightKg: parseFloat(String(actualWeightKg)) || 1,
        orderType,
        paymentType,
      });

      if (res.success && res.data) {
        setLiveRate(res.data);
      }
    } catch (e) {
      // Graceful fallback
    } finally {
      setCalculatingRate(false);
    }
  };

  useEffect(() => {
    refreshRate();
  }, [pickupPincode, dropPincode, lengthCm, widthCm, heightCm, actualWeightKg, orderType, paymentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res: any = await orderApi.createOrder({
        pickupAddress,
        pickupPincode,
        pickupCity,
        pickupContactName,
        pickupContactPhone,
        dropAddress,
        dropPincode,
        dropCity,
        dropContactName,
        dropContactPhone,
        lengthCm: parseFloat(String(lengthCm)),
        widthCm: parseFloat(String(widthCm)),
        heightCm: parseFloat(String(heightCm)),
        actualWeightKg: parseFloat(String(actualWeightKg)),
        orderType,
        paymentType,
        packageCategory,
        specialInstructions,
        autoAssignAgent,
      });

      if (res.success && res.data) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        showToast({
          type: 'success',
          title: '🎉 Order Successfully Booked!',
          message: `Tracking Number: ${res.data.order.trackingNumber}. Total Charged: ₹${res.data.order.totalAmount}`,
        });

        onSuccess(res.data.order);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Order Placement Failed',
        message: err.message || 'Could not create delivery order',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Order Type & Payment Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">1. Order Classification</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderType('B2C')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                orderType === 'B2C'
                  ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>👤 B2C Consumer</span>
              <span className="text-[10px] opacity-75 font-normal">Standard 0.5kg Slabs</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType('B2B')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                orderType === 'B2B'
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🏢 B2B Commercial</span>
              <span className="text-[10px] opacity-75 font-normal">Heavy 2.0kg Base Freight</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">2. Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType('PREPAID')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                paymentType === 'PREPAID'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>💳 Prepaid</span>
              <span className="text-[10px] opacity-75 font-normal">Zero COD Surcharge</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('COD')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                paymentType === 'COD'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>💵 Cash on Delivery</span>
              <span className="text-[10px] opacity-75 font-normal">COD Surcharge Applied</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pickup & Destination Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Origin Pickup Card */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            Pickup Origin Location
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Pickup Address</label>
            <input
              type="text"
              required
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              placeholder="Full address, building, landmark"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Pincode</label>
              <input
                type="text"
                required
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">City</label>
              <input
                type="text"
                required
                value={pickupCity}
                onChange={(e) => setPickupCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Sender Name</label>
              <input
                type="text"
                required
                value={pickupContactName}
                onChange={(e) => setPickupContactName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Sender Phone</label>
              <input
                type="text"
                required
                value={pickupContactPhone}
                onChange={(e) => setPickupContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Destination Drop Card */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            Destination Drop Location
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Delivery Address</label>
            <input
              type="text"
              required
              value={dropAddress}
              onChange={(e) => setDropAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              placeholder="Recipient address, flat/unit, street"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Pincode</label>
              <input
                type="text"
                required
                value={dropPincode}
                onChange={(e) => setDropPincode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">City</label>
              <input
                type="text"
                required
                value={dropCity}
                onChange={(e) => setDropCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Recipient Name</label>
              <input
                type="text"
                required
                value={dropContactName}
                onChange={(e) => setDropContactName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Recipient Phone</label>
              <input
                type="text"
                required
                value={dropContactPhone}
                onChange={(e) => setDropContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Package Specs & Volumetric Info */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Box className="w-4 h-4 text-cyan-400" />
            Package Dimensions & Weight
          </span>
          <span className="text-[11px] text-slate-400">
            Formula: (L × W × H) ÷ 5000 = Volumetric Wt
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Length (cm)</label>
            <input
              type="number"
              min="1"
              required
              value={lengthCm}
              onChange={(e) => setLengthCm(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Width (cm)</label>
            <input
              type="number"
              min="1"
              required
              value={widthCm}
              onChange={(e) => setWidthCm(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Height (cm)</label>
            <input
              type="number"
              min="1"
              required
              value={heightCm}
              onChange={(e) => setHeightCm(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] text-emerald-400 font-bold block mb-1">Actual Wt (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={actualWeightKg}
              onChange={(e) => setActualWeightKg(parseFloat(e.target.value) || 0.1)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-emerald-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Package Category</label>
            <input
              type="text"
              value={packageCategory}
              onChange={(e) => setPackageCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Special Handling Notes</label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>
        </div>
      </div>

      {/* Auto-Assignment Option Checkbox */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
        <input
          type="checkbox"
          id="autoAssign"
          checked={autoAssignAgent}
          onChange={(e) => setAutoAssignAgent(e.target.checked)}
          className="h-4 w-4 rounded accent-brand-500 cursor-pointer"
        />
        <label htmlFor="autoAssign" className="text-xs text-slate-300 cursor-pointer">
          <span className="font-bold text-white">Enable Intelligent Auto-Assignment:</span> Automatically match the nearest available agent on booking confirmation using Haversine scoring.
        </label>
      </div>

      {/* Live Calculated Charge Banner (Mandatory Requirement) */}
      {liveRate && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/80 via-slate-900 to-emerald-950/80 border border-brand-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Live Auto-Calculated Charge
              </span>
              <span className="text-xs text-slate-400">
                Billed on: <b className="text-slate-200">{liveRate.chargeableWeightKg} kg</b> ({liveRate.billedOn === 'VOLUMETRIC_WEIGHT' ? 'Volumetric Wt' : 'Actual Wt'})
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Base Fare: ₹{liveRate.baseCharge} + Incremental: ₹{liveRate.incrementalCharge} {paymentType === 'COD' ? `+ COD Fee: ₹${liveRate.codSurcharge}` : ''}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Final Payable Amount</span>
            <span className="text-2xl font-extrabold text-white">
              ₹{liveRate.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || calculatingRate}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center gap-2 transform active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <span>Booking Delivery...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Place Order</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
