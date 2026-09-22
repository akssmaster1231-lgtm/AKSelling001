import React from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/data';

interface GroupBuyTriggerButtonProps {
  price: number;
  onClick: () => void;
}

export default function GroupBuyTriggerButton({ price, onClick }: GroupBuyTriggerButtonProps) {
  const discountAmount = Math.round((price * 15) / 100);
  const finalPrice = price - discountAmount;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white p-3 rounded-xl shadow-md border border-emerald-400/30 flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer select-none group"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-amber-300">
          <Users size={20} />
        </div>
        <div className="text-left min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
              Saath Mein Khareedo
            </span>
            <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded shadow-xs">
              FLAT 15% EXTRA OFF
            </span>
          </div>
          <p className="text-[11px] text-emerald-100 truncate mt-0.5">
            Buy with a friend on WhatsApp at only <span className="font-bold text-white">{formatPrice(finalPrice)}</span> (Save ₹{discountAmount})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white text-emerald-800 text-xs font-black px-3 py-1.5 rounded-lg shadow-xs shrink-0 group-hover:bg-emerald-50 transition-colors">
        <span>Team Buy</span>
        <ArrowRight size={13} />
      </div>
    </button>
  );
}
