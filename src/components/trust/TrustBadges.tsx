import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Award, Lock, CheckCircle2 } from 'lucide-react';

interface TrustBadgesProps {
  variant?: 'compact' | 'full' | 'banner' | 'checkout';
  className?: string;
}

export default function TrustBadges({ variant = 'full', className = '' }: TrustBadgesProps) {
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-[#0a192f] via-[#112240] to-[#0a192f] text-white p-3 rounded-2xl border border-amber-400/20 shadow-lg ${className}`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-400 shrink-0" />
            <div>
              <p className="font-black text-amber-300 tracking-wide text-[11px] uppercase">100% Secure Marketplace Guarantee</p>
              <p className="text-[10px] text-slate-300">Verified Merchant • 7-Day Easy Returns • Direct UPI</p>
            </div>
          </div>
          <span className="text-[9px] font-black bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
            SSL 256-BIT
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'checkout') {
    return (
      <div className={`p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Buyer Protection & Authentic Guarantee</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
            <span className="truncate">100% Genuine Apparel</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock size={12} className="text-emerald-600 shrink-0" />
            <span className="truncate">Encrypted UPI Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <RotateCcw size={12} className="text-emerald-600 shrink-0" />
            <span className="truncate">Free Doorstep Return</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 gap-2 text-xs ${className}`}>
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
          <ShieldCheck size={16} className="text-blue-600 shrink-0" />
          <div>
            <p className="font-bold text-[11px] text-slate-900">100% Secure Checkout</p>
            <p className="text-[9px] text-slate-500">256-Bit SSL Encrypted</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Award size={16} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-bold text-[11px] text-slate-900">Verified Merchant</p>
            <p className="text-[9px] text-slate-500">AKSelling Direct Factory</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-xs ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>AKSelling Trust & Security Promise</span>
        </h4>
        <span className="text-[10px] font-bold text-slate-400">Verified Seller Hub</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
            <Lock size={14} />
          </div>
          <h5 className="text-[11px] font-bold text-slate-900 leading-tight">100% Secure Checkout</h5>
          <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">Bank-grade 256-bit encryption & UPI verification</p>
        </div>

        <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
            <Award size={14} />
          </div>
          <h5 className="text-[11px] font-bold text-slate-900 leading-tight">Verified Manufacturer</h5>
          <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">Authentic AKSelling direct factory pricing</p>
        </div>

        <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
            <RotateCcw size={14} />
          </div>
          <h5 className="text-[11px] font-bold text-slate-900 leading-tight">Easy 7-Day Returns</h5>
          <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">Hassle-free size exchange & doorstep pickup</p>
        </div>

        <div className="p-2.5 bg-purple-50/60 border border-purple-100 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
            <Truck size={14} />
          </div>
          <h5 className="text-[11px] font-bold text-slate-900 leading-tight">Express Logistics</h5>
          <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">Shiprocket & NimbusPost automated live dispatch</p>
        </div>
      </div>
    </div>
  );
}
