import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  Share2,
  Clock,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Flame,
} from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/data';

interface GroupBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onApplyGroupDiscount: (discountPercent: number) => void;
}

export default function GroupBuyModal({
  isOpen,
  onClose,
  product,
  onApplyGroupDiscount,
}: GroupBuyModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7195); // ~1 hr 59 mins in seconds
  const [friendJoined, setFriendJoined] = useState(false);

  // Group Buy Math (15% Extra Off)
  const groupDiscountPercent = 15;
  const originalPrice = product.price;
  const discountAmount = Math.round((originalPrice * groupDiscountPercent) / 100);
  const finalGroupPrice = originalPrice - discountAmount;

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 7200));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const groupCode = `GB-${product.id.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const shareUrl = `${window.location.origin}?productId=${encodeURIComponent(product.id)}&groupBuy=${groupCode}`;
  const shareMessage = `Bhai! AKSelling par mere saath "${product.title}" khareedo! Dono ko Flat 15% EXTRA OFF milega. Deal Price: ${formatPrice(finalGroupPrice)} (MRP ${formatPrice(product.mrp)}). Jaldi tap karo: ${shareUrl}`;

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank');
    // Simulate auto-unlock upon sharing
    setTimeout(() => {
      setFriendJoined(true);
    }, 3000);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleActivateDeal = () => {
    // Store in localStorage for checkout
    try {
      localStorage.setItem(
        'akselling_active_group_buy',
        JSON.stringify({
          productId: product.id,
          discountPercent: groupDiscountPercent,
          discountAmount,
          finalPrice: finalGroupPrice,
          code: groupCode,
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore
    }
    onApplyGroupDiscount(groupDiscountPercent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-[#1b365d] text-white p-4 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white/90"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-400 text-slate-950 font-black shadow-xs">
              <Users size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
              Saath Mein Khareedo • Team Deal
            </span>
          </div>

          <h3 className="text-lg font-black text-white leading-tight mt-1">
            Buy with a Friend & Get Flat 15% OFF
          </h3>
          <p className="text-xs text-emerald-100 mt-1">
            Invite 1 friend on WhatsApp. When both order, both save ₹{discountAmount}!
          </p>

          {/* Urgency Countdown */}
          <div className="mt-3 inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-amber-400/30">
            <Clock size={13} className="animate-spin-slow text-amber-400" />
            <span>
              Deal closes in {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
              {String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Product Comparison Snippet */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <img
              src={product.image}
              alt={product.title}
              className="w-14 h-14 object-cover rounded-lg border border-slate-200"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">{product.title}</h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-slate-400 line-through">
                  Single: {formatPrice(originalPrice)}
                </span>
                <span className="text-sm font-black text-emerald-600">
                  Team Price: {formatPrice(finalGroupPrice)}
                </span>
              </div>
              <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded mt-0.5">
                Save ₹{discountAmount} Instantly
              </span>
            </div>
          </div>

          {/* 2-Member Team Slots */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700">Team Status (1 of 2 Joined):</p>
            <div className="grid grid-cols-2 gap-2">
              {/* Slot 1: Current User */}
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-2.5 text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs mb-1">
                  You
                </div>
                <span className="text-xs font-bold text-slate-900">Ready</span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 size={11} /> Locked In
                </span>
              </div>

              {/* Slot 2: Friend */}
              <div
                className={`border-2 rounded-xl p-2.5 text-center flex flex-col items-center transition-all ${
                  friendJoined
                    ? 'bg-emerald-50 border-emerald-500'
                    : 'bg-amber-50/70 border-dashed border-amber-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-1 ${
                    friendJoined
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-400 text-slate-950 animate-bounce'
                  }`}
                >
                  {friendJoined ? 'Friend' : '+1'}
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {friendJoined ? 'Joined!' : 'Friend Slot'}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
                  {friendJoined ? '15% Unlocked 🎉' : 'Waiting for WhatsApp'}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Live Social Activity */}
          <div className="bg-slate-100/80 rounded-xl p-2.5 text-[11px] text-slate-600 flex items-center gap-2">
            <Flame size={15} className="text-orange-500 shrink-0" />
            <span className="truncate">
              <b>Vikas & Rohit</b> saved ₹240 via Group Buy 4 mins ago!
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Share2 size={16} />
              <span>Invite Friend on WhatsApp (1-Tap Share)</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleActivateDeal}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-300" />
                <span>Claim 15% OFF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
