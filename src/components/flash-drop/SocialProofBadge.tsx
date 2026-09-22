import React, { useState, useEffect } from 'react';
import { Flame, Zap } from 'lucide-react';

interface SocialProofBadgeProps {
  productId?: string;
  className?: string;
}

export default function SocialProofBadge({ productId, className = '' }: SocialProofBadgeProps) {
  // Deterministic seed based on productId or default
  const baseCount = (productId ? productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 35 : 32) + 24;
  const [viewerCount, setViewerCount] = useState(baseCount);
  const stockRemaining = 7;

  // Subtle natural viewer fluctuations every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(18, Math.min(84, prev + delta));
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Live Active Viewers Badge */}
      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-red-500/10 text-orange-950 px-2.5 py-1 rounded-full text-[11px] font-bold border border-orange-300/60 shadow-2xs">
        <Flame size={13} className="text-orange-600 fill-orange-500 animate-pulse shrink-0" />
        <span>
          <b className="text-orange-700">{viewerCount} people</b> are viewing this right now
        </span>
      </div>

      {/* Stock Scarcity Bar */}
      <div className="bg-amber-50/80 rounded-xl p-2 border border-amber-200/80">
        <div className="flex items-center justify-between text-[11px] font-black text-slate-800 mb-1">
          <span className="flex items-center gap-1 text-red-600">
            <Zap size={12} className="fill-red-600 animate-bounce" />
            <span>Hurry! Only {stockRemaining} pieces left in stock</span>
          </span>
          <span className="text-slate-500 text-[10px]">88% Claimed</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full w-[88%] transition-all duration-500" />
        </div>
      </div>
    </div>
  );
}
