import React, { useState } from 'react';
import { Tag, Sparkles, Check, Gift } from 'lucide-react';
import { formatPrice } from '@/data';

interface EffectivePriceCalculatorProps {
  price: number;
  mrp: number;
  discount: number;
  className?: string;
}

export const EffectivePriceCalculator: React.FC<EffectivePriceCalculatorProps> = ({
  price,
  mrp,
  discount,
  className = '',
}) => {
  const [walletBonusApplied, setWalletBonusApplied] = useState(true);
  const [couponApplied, setCouponApplied] = useState(true);

  // Calculations mirroring Flipkart's combined offer breakout:
  // 1. Instant Wallet Bonus / First Order Discount: Flat ₹30 or ₹50
  const walletDiscount = 30; // AKSelling Guaranteed ₹30 welcome bonus
  // 2. Extra Instant Bank/UPI 5% auto discount: up to ₹25
  const instantUpiDiscount = Math.round(price * 0.05);

  const effectivePrice = Math.max(
    1,
    price - (walletBonusApplied ? walletDiscount : 0) - (couponApplied ? instantUpiDiscount : 0)
  );

  const totalSavings = (mrp - effectivePrice);
  const totalSavingsPercent = Math.min(90, Math.round(((mrp - effectivePrice) / mrp) * 100));

  return (
    <div className={`rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white p-3.5 shadow-sm space-y-2.5 ${className}`}>
      {/* Top Banner: Big Flipkart-Style Effective Price */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500 fill-amber-400" />
            <span>Effective Deal Price</span>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              {formatPrice(effectivePrice)}
            </span>
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(mrp)}
            </span>
            <span className="text-xs font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              {totalSavingsPercent}% OFF
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-500 block">Total Savings</span>
          <span className="text-sm font-black text-emerald-700 block">
            Save {formatPrice(totalSavings)}
          </span>
        </div>
      </div>

      {/* Auto-Calculated Offer Stack (Flipkart Style: Base + Wallet + Bank/UPI) */}
      <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-100/90 space-y-2 text-xs">
        <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
          <Tag size={12} className="text-emerald-600" />
          <span>Includes All Combined Offers:</span>
        </p>

        {/* Offer 1: Special Catalog Price */}
        <div className="flex items-center justify-between text-slate-600">
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-emerald-600 shrink-0" />
            <span>Special Sale Price ({discount}% off)</span>
          </span>
          <span className="font-bold text-slate-900">{formatPrice(price)}</span>
        </div>

        {/* Offer 2: Wallet Bonus Auto-Apply */}
        <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/70 px-2 py-1 rounded-lg border border-emerald-200/70">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={walletBonusApplied}
              onChange={(e) => setWalletBonusApplied(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span className="font-medium">
              🎁 Welcome Wallet Bonus Applied
            </span>
          </label>
          <span className="font-black text-emerald-700">-₹{walletDiscount}</span>
        </div>

        {/* Offer 3: Extra UPI / Prepaid Instant Discount */}
        <div className="flex items-center justify-between text-blue-900 bg-blue-50/60 px-2 py-1 rounded-lg border border-blue-200/60">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={couponApplied}
              onChange={(e) => setCouponApplied(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span className="font-medium">
              ⚡ Extra 5% Instant Online / UPI Offer
            </span>
          </label>
          <span className="font-black text-blue-700">-₹{instantUpiDiscount}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-0.5">
        <span className="flex items-center gap-1 text-emerald-700">
          <Gift size={12} />
          <span>No promo code needed • Applied at checkout</span>
        </span>
        <span className="text-slate-500 font-semibold">Delivery: ₹30 Flat</span>
      </div>
    </div>
  );
};

export default EffectivePriceCalculator;
