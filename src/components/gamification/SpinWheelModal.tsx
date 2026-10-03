import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Trophy,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { fireConfetti } from '@/utils/confetti';
import {
  canSpinToday,
  getRemainingDailySpins,
  deductSpinChance,
  setActiveSpinDiscount,
} from '@/utils/gamificationService';
import { setLocalWalletCache, getLocalWalletCache } from '@/utils/walletService';
import { useAuth } from '@/auth-context';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseCoupon?: (couponCode: string, discount: number) => void;
  onShopCoupon?: () => void;
}

interface WheelSegment {
  id: string;
  label: string;
  subLabel: string;
  color: string;
  textColor: string;
  rewardType: 'cash' | 'discount' | 'voucher';
  amount: number;
  couponCode?: string;
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { id: 'seg_1', label: '10% OFF', subLabel: 'Sitewide', color: '#8B5CF6', textColor: '#FFFFFF', rewardType: 'discount', amount: 10, couponCode: 'SPIN10' },
  { id: 'seg_2', label: '15% OFF', subLabel: 'Coupon', color: '#10B981', textColor: '#FFFFFF', rewardType: 'discount', amount: 15, couponCode: 'SPIN15' },
  { id: 'seg_3', label: '₹25 Cash', subLabel: 'Wallet', color: '#F59E0B', textColor: '#1E293B', rewardType: 'cash', amount: 25 },
  { id: 'seg_4', label: '20% OFF', subLabel: 'Checkout', color: '#06B6D4', textColor: '#FFFFFF', rewardType: 'discount', amount: 20, couponCode: 'SPIN20' },
  { id: 'seg_5', label: '₹30 Cash', subLabel: 'Wallet', color: '#EC4899', textColor: '#FFFFFF', rewardType: 'cash', amount: 30 },
  { id: 'seg_6', label: '25% OFF', subLabel: 'Super Deal', color: '#6366F1', textColor: '#FFFFFF', rewardType: 'discount', amount: 25, couponCode: 'SPIN25' },
  { id: 'seg_7', label: '₹50 Voucher', subLabel: 'On Orders', color: '#EF4444', textColor: '#FFFFFF', rewardType: 'voucher', amount: 50, couponCode: 'FLAT50' },
  { id: 'seg_8', label: '30% JACKPOT', subLabel: 'Max Save', color: '#FBBF24', textColor: '#0F172A', rewardType: 'discount', amount: 30, couponCode: 'SPIN30' },
];

export default function SpinWheelModal({ isOpen, onClose, onUseCoupon, onShopCoupon }: SpinWheelModalProps) {
  const { user } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState<WheelSegment | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(() => getRemainingDailySpins());
  const [isEligibleToday, setIsEligibleToday] = useState(() => canSpinToday());

  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSpinsLeft(getRemainingDailySpins());
      setIsEligibleToday(canSpinToday());
      setWinningSegment(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const segmentAngle = 360 / WHEEL_SEGMENTS.length; // 45 degrees

  const handleSpin = () => {
    if (isSpinning) return;

    if (!canSpinToday()) {
      return; // Strictly restricted to 1 spin per user per day
    }

    const success = deductSpinChance(user?.id || 'guest');
    if (!success) return;

    setSpinsLeft((prev) => Math.max(0, prev - 1));
    setIsEligibleToday(false);
    setIsSpinning(true);
    setWinningSegment(null);

    // Pick winning index
    const winningIdx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const targetSegment = WHEEL_SEGMENTS[winningIdx];

    // Calculate total rotation
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = 360 - winningIdx * segmentAngle - segmentAngle / 2;
    const finalRotation = rotation + fullSpins * 360 + (targetAngle - (rotation % 360));

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinningSegment(targetSegment);

      // Trigger Confetti
      try {
        fireConfetti({ particleCount: 90 });
      } catch {
        // ignore
      }

      // If reward is discount percentage or voucher, automatically store & apply to checkout
      if (targetSegment.rewardType === 'discount' || targetSegment.rewardType === 'voucher') {
        const couponCode = targetSegment.couponCode || `SPIN${targetSegment.amount}`;
        const discountObj = {
          couponCode,
          discountPercent: targetSegment.amount,
          rewardType: targetSegment.rewardType,
          label: targetSegment.label,
          wonAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        setActiveSpinDiscount(discountObj);
        if (onUseCoupon) {
          onUseCoupon(couponCode, targetSegment.amount);
        }
      }

      // If reward is cash, add to Cash Wallet balance
      if (targetSegment.rewardType === 'cash') {
        const uid = user?.id || 'guest';
        const wallet = getLocalWalletCache(uid);
        const newBal = wallet.walletBalance + targetSegment.amount;
        setLocalWalletCache(uid, {
          walletBalance: newBal,
          totalCashbackEarned: wallet.totalCashbackEarned + targetSegment.amount,
        });
        window.dispatchEvent(new Event('akselling_wallet_updated'));
      }
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-700 overflow-hidden relative animate-scale-up">
        {/* Header */}
        <div className="p-4 text-center relative border-b border-slate-800 bg-gradient-to-b from-indigo-950 to-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>

          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Trophy size={14} className="text-amber-400" />
            <span>Strict Daily Spin Wheel • 1 Spin / Day</span>
          </div>

          <h3 className="text-xl font-black text-white">Win Instant Discounts & Cash</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEligibleToday ? (
              <span className="font-bold text-emerald-400">{spinsLeft} Free Daily Spin Available Today!</span>
            ) : (
              <span className="font-medium text-amber-400">Today&apos;s spin used. Next free spin tomorrow!</span>
            )}
          </p>
        </div>

        {/* Wheel Container */}
        <div className="p-4 flex flex-col items-center">
          <div className="relative w-64 h-64 my-2 flex items-center justify-center">
            {/* Top Wheel Pointer Marker */}
            <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-md" />
              <div className="w-3 h-3 rounded-full bg-slate-950 -mt-1 border-2 border-amber-400 shadow-sm" />
            </div>

            {/* Rotating Wheel Circle */}
            <div
              ref={wheelRef}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 4s cubic-bezier(0.15, 0.9, 0.25, 1)'
                  : 'none',
              }}
              className="w-full h-full rounded-full border-4 border-amber-400 shadow-2xl relative overflow-hidden bg-slate-800"
            >
              {/* SVG Sectors */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {WHEEL_SEGMENTS.map((seg, i) => {
                  const angle = segmentAngle;
                  const startAngle = i * angle - 90;
                  const endAngle = (i + 1) * angle - 90;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;

                  const x1 = 50 + 50 * Math.cos(startRad);
                  const y1 = 50 + 50 * Math.sin(startRad);
                  const x2 = 50 + 50 * Math.cos(endRad);
                  const y2 = 50 + 50 * Math.sin(endRad);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  // Text position
                  const midAngle = startAngle + angle / 2;
                  const midRad = (midAngle * Math.PI) / 180;
                  const tx = 50 + 33 * Math.cos(midRad);
                  const ty = 50 + 33 * Math.sin(midRad);

                  return (
                    <g key={seg.id}>
                      <path d={pathData} fill={seg.color} stroke="#0F172A" strokeWidth="0.8" />
                      <text
                        x={tx}
                        y={ty}
                        fill={seg.textColor}
                        fontSize="4"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Center Hub Button */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning || !isEligibleToday}
              className={`absolute z-20 w-16 h-16 rounded-full font-black text-xs uppercase shadow-xl flex items-center justify-center border-4 border-slate-900 transition-all ${
                !isEligibleToday
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-80'
                  : isSpinning
                  ? 'bg-amber-500 text-slate-950 opacity-90 cursor-not-allowed'
                  : 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              {isSpinning ? '...' : isEligibleToday ? 'SPIN' : 'LOCK'}
            </button>
          </div>

          {/* Winner Showcase Banner */}
          {winningSegment && (
            <div className="w-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 rounded-2xl p-3.5 mt-3 text-center animate-scale-up">
              <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-black uppercase">
                <Sparkles size={16} />
                <span>Congratulations!</span>
              </div>
              <h4 className="text-xl font-black text-white mt-1">
                You Won {winningSegment.label}!
              </h4>
              <p className="text-xs text-amber-200 mt-0.5">
                {winningSegment.rewardType === 'cash'
                  ? `₹${winningSegment.amount} has been added directly to your Cash Wallet!`
                  : `🎉 ${winningSegment.amount}% OFF has been automatically applied to your checkout!`}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onShopCoupon) onShopCoupon();
                    onClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs px-3 py-2 rounded-xl shadow-md cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                >
                  <span>Auto-Applied! Go to Cart</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Daily Spin Status / Trigger Button */}
          {!winningSegment && (
            <div className="w-full mt-4">
              {isEligibleToday ? (
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:opacity-95 active:scale-[0.99] text-slate-950 font-black text-sm py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  id="spin-wheel-btn"
                >
                  <Sparkles size={16} className="fill-slate-950" />
                  <span>{isSpinning ? 'Spinning Lucky Wheel...' : 'Spin 1x Free Daily Wheel'}</span>
                </button>
              ) : (
                <div className="bg-slate-800/80 border border-slate-700 text-slate-300 p-3 rounded-xl text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400">
                    <Clock size={14} />
                    <span>Daily Limit Reached (1 Spin / Day)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    You have completed today&apos;s lucky spin! Come back tomorrow at 12:00 AM for your next spin.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
