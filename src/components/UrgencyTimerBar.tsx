import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface UrgencyTimerBarProps {
  className?: string;
  variant?: 'banner' | 'compact' | 'productDetail';
  initialSeconds?: number;
}

export const UrgencyTimerBar: React.FC<UrgencyTimerBarProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const getRemainingSeconds = () => {
    const now = new Date();
    // Daily deal window ending at 23:59:59 or end of 3-hour flash cycle
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000);
    return Math.max(0, diff);
  };

  const [secondsLeft, setSecondsLeft] = useState(getRemainingSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(getRemainingSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (variant === 'productDetail') {
    return (
      <div className={`bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-red-500/10 border border-orange-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs ${className}`}>
        <div className="flex items-center gap-1.5 font-bold text-orange-950">
          <Clock size={14} className="text-orange-600 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
          <span>Special Deal Ends in:</span>
        </div>
        <div className="flex items-center gap-1 font-mono font-black text-slate-900 bg-white/90 border border-orange-200 px-2 py-0.5 rounded-lg shadow-2xs">
          <span className="text-orange-600">{pad(hours)}h</span>
          <span className="text-slate-400">:</span>
          <span className="text-orange-600">{pad(minutes)}m</span>
          <span className="text-slate-400">:</span>
          <span className="text-red-600 animate-pulse">{pad(seconds)}s</span>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-amber-400 text-slate-950 px-3 py-1.5 flex items-center justify-between text-xs font-black ${className}`}>
        <div className="flex items-center gap-1.5 truncate">
          <span className="animate-pulse">⚡</span>
          <span className="uppercase tracking-wider text-[11px]">FLASHSALE LIVE: EXTRA ₹50 OFF VIA WALLET</span>
        </div>
        <div className="flex items-center gap-1 font-mono shrink-0 bg-slate-950 text-amber-300 px-2 py-0.5 rounded">
          <span>{pad(hours)}h</span>:<span>{pad(minutes)}m</span>:<span className="text-white">{pad(seconds)}s</span>
        </div>
      </div>
    );
  }

  // Compact variant for Product Cards & small widgets
  return (
    <div className={`flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50/90 border border-amber-200/80 px-1.5 py-0.5 rounded-md ${className}`}>
      <Clock size={10} className="text-amber-600 shrink-0" />
      <span>Ends in {pad(hours)}h : {pad(minutes)}m : {pad(seconds)}s</span>
    </div>
  );
};

export default UrgencyTimerBar;
