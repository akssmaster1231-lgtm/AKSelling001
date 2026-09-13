import React from 'react';
import { Award, Sparkles, X, ArrowRight } from 'lucide-react';

interface MilestoneCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet?: () => void;
  milestoneBonus?: number;
  message?: string;
}

export const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  isOpen,
  onClose,
  onOpenWallet,
  milestoneBonus = 20,
  message = 'Congratulations! You have completed 3 shopping orders with AKSelling. Enjoy a special flat ₹20 cashback!',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-amber-200 animate-scale-in overflow-hidden">
        {/* Decorative Golden Ambient Glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-orange-200/50 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Milestone Icon & Badge */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-300/40 mb-4 animate-bounce">
          <Award size={44} className="text-amber-950" />
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles size={13} className="text-amber-600" />
          3rd Order Milestone Unlocked
        </div>

        <h3 className="text-xl font-black text-gray-900 leading-snug">
          Special Reward Added!
        </h3>

        <div className="my-3 py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200">
          <span className="text-3xl font-extrabold text-amber-800">+₹{milestoneBonus}</span>
          <p className="text-xs font-semibold text-amber-700 mt-0.5">Credited into your AKSelling Wallet</p>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-6 font-medium">
          {message}
        </p>

        <div className="flex flex-col gap-2">
          {onOpenWallet && (
            <button
              onClick={() => {
                onClose();
                onOpenWallet();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-[0.98] transition-transform"
            >
              <span>View AKSelling Rewards Wallet</span>
              <ArrowRight size={16} />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
