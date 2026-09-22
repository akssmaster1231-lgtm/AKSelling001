import React, { useState, useEffect } from 'react';
import {
  Calendar,
  X,
  Sparkles,
  CheckCircle2,
  Gift,
  Coins,
  Flame,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  STREAK_REWARDS,
  getStreakData,
  canCheckInToday,
  claimTodayStreakReward,
  type DailyStreakState,
} from '@/utils/gamificationService';
import { useAuth } from '@/auth-context';

interface DailyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSpinWheel?: () => void;
}

export default function DailyStreakModal({
  isOpen,
  onClose,
  onOpenSpinWheel,
}: DailyStreakModalProps) {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<DailyStreakState>(() => getStreakData());
  const [claimedReward, setClaimedReward] = useState<{ amount: number; description: string } | null>(
    null
  );
  const [canClaim, setCanClaim] = useState(() => canCheckInToday());

  useEffect(() => {
    if (isOpen) {
      setStreakData(getStreakData());
      setCanClaim(canCheckInToday());
      setClaimedReward(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    const result = claimTodayStreakReward(user?.id || 'guest');
    if (result.success) {
      setStreakData(getStreakData());
      setCanClaim(false);
      setClaimedReward({
        amount: result.reward.amount,
        description: result.reward.description,
      });

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  };

  const currentActiveDay = ((streakData.currentStreak - 1) % 7) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-4 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-900"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 rounded-md bg-slate-950 text-amber-400 font-bold">
              <Calendar size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Roz Check-In • Roz Rewards
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-950 leading-tight">
            7-Day Daily Shopping Streak
          </h3>
          <p className="text-xs font-semibold text-slate-800 mt-0.5">
            Log in daily to earn coins that deduct directly from your order total!
          </p>

          {/* Current Streak Pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-950 text-amber-400 px-3 py-1 rounded-full text-xs font-black shadow-md border border-amber-400/40">
            <Flame size={14} className="fill-amber-400 text-amber-400 animate-bounce" />
            <span>Current Streak: {streakData.currentStreak} Days</span>
          </div>
        </div>

        {/* 7-Day Calendar Grid */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {STREAK_REWARDS.map((item, idx) => {
              const dayNum = idx + 1;
              const isPassed = dayNum < currentActiveDay && !canClaim;
              const isToday = dayNum === currentActiveDay || (canClaim && dayNum === ((streakData.currentStreak % 7) + 1));
              const isJackpot = dayNum === 7;

              return (
                <div
                  key={item.day}
                  className={`rounded-xl p-2.5 flex flex-col items-center justify-center text-center transition-all relative ${
                    isJackpot ? 'col-span-2 bg-gradient-to-tr from-amber-100 to-yellow-200 border-2 border-amber-500' : ''
                  } ${
                    isPassed
                      ? 'bg-slate-100 border border-slate-200 opacity-60'
                      : isToday
                      ? 'bg-amber-50 border-2 border-amber-500 ring-2 ring-amber-300 shadow-sm'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    {item.label}
                  </span>

                  <div className="my-1 text-amber-600">
                    {item.rewardType === 'spin' ? (
                      <Gift size={22} className="text-purple-600 animate-spin-slow" />
                    ) : (
                      <Coins size={22} className="text-amber-500" />
                    )}
                  </div>

                  <span className="text-xs font-black text-slate-900">
                    {item.rewardType === 'spin' ? '1 Spin' : `+₹${item.amount}`}
                  </span>

                  {isPassed && (
                    <div className="absolute top-1 right-1 text-emerald-600">
                      <CheckCircle2 size={12} className="fill-emerald-100" />
                    </div>
                  )}

                  {isToday && canClaim && (
                    <span className="absolute -top-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                      READY
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Success Claim Banner */}
          {claimedReward && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2.5 animate-bounce-short">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950">Reward Claimed!</h4>
                <p className="text-[11px] font-semibold text-emerald-700">
                  {claimedReward.description} credited to your AKSelling wallet balance.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {canClaim ? (
              <button
                type="button"
                onClick={handleClaim}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 active:scale-[0.99] text-slate-950 font-black text-sm py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="claim-streak-reward-btn"
              >
                <Sparkles size={16} className="fill-slate-950" />
                <span>Claim Today's Reward</span>
              </button>
            ) : (
              <div className="w-full bg-slate-100 text-slate-500 font-bold text-xs py-3 px-4 rounded-xl text-center border border-slate-200 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Checked in today! Come back tomorrow for the next reward.</span>
              </div>
            )}

            {onOpenSpinWheel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSpinWheel();
                }}
                className="w-full bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs py-2.5 px-3 rounded-xl border border-purple-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Gift size={14} className="text-purple-600" />
                <span>Have spins left? Try Lucky Spin Wheel ({streakData.spinsAvailable})</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
