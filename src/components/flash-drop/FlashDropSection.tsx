import React, { useState, useEffect } from 'react';
import { Zap, Clock, ChevronRight } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/data';

interface FlashDropSectionProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onNavigateDeals: () => void;
}

function FlashCountdownClock() {
  const calculateTimeRemaining = () => {
    const now = new Date();
    const endOfHour = new Date(now);
    endOfHour.setMinutes(59, 59, 999);
    return Math.max(0, Math.floor((endOfHour.getTime() - now.getTime()) / 1000));
  };

  const [secondsRemaining, setSecondsRemaining] = useState(calculateTimeRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(calculateTimeRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-red-500/40">
      <Clock size={12} className="text-red-400" />
      <div className="font-mono text-xs font-black text-amber-400">
        <span>{String(hours).padStart(2, '0')}</span>:
        <span>{String(minutes).padStart(2, '0')}</span>:
        <span className="text-white">{String(seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

export default function FlashDropSection({
  products,
  onProductClick,
  onNavigateDeals,
}: FlashDropSectionProps) {
  // Flash drop showcase products (up to 4 products)
  const flashProducts = React.useMemo(() => products.slice(0, 4), [products]);
  if (flashProducts.length === 0) return null;

  return (
    <section className="mt-4 px-3" id="home-flash-drop-section">
      <div className="bg-gradient-to-br from-slate-950 via-red-950 to-amber-950 text-white rounded-2xl p-3.5 shadow-xl border border-red-500/40 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center justify-between gap-2 relative z-10 mb-3 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-red-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Zap size={18} className="fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                  Flash Drop • 1-Hour Rush
                </h3>
                <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                  ENDS SOON
                </span>
              </div>
              <p className="text-[11px] text-amber-300 font-medium">
                Extra 20% off auto-applied at checkout
              </p>
            </div>
          </div>

          {/* Isolated Countdown Clock (Does not trigger parent or image re-renders) */}
          <FlashCountdownClock />
        </div>

        {/* Flash Drop Products Shelf */}
        <div className="grid grid-cols-2 gap-2.5 relative z-10">
          {flashProducts.map((p) => {
            const flashPrice = Math.round(p.price * 0.85);
            return (
              <div
                key={`flash-${p.id}`}
                onClick={() => onProductClick(p)}
                className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-2 border border-white/10 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                    ⚡ {p.discount + 10}% OFF
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] text-amber-300 font-bold uppercase truncate">{p.brand}</p>
                  <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-black text-amber-400">
                      {formatPrice(flashPrice)}
                    </span>
                    <span className="text-[10px] text-white/50 line-through">
                      {formatPrice(p.mrp)}
                    </span>
                  </div>

                  {/* Urgency Progress */}
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[9px] text-slate-300 mb-0.5">
                      <span>Claimed</span>
                      <span className="text-amber-300 font-bold">89%</span>
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full w-[89%]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Flash Deals Button */}
        <button
          type="button"
          onClick={onNavigateDeals}
          className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2 rounded-xl border border-white/20 flex items-center justify-center gap-1 transition-colors"
        >
          <span>Explore All Lightning Deals</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
}
