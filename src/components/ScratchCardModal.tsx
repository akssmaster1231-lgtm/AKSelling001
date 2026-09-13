import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, Gift, CheckCircle2 } from 'lucide-react';

interface ScratchCardModalProps {
  isOpen: boolean;
  cashbackAmount: number;
  milestoneAmount?: number;
  orderId?: string;
  onDismiss: () => void;
}

export const ScratchCardModal: React.FC<ScratchCardModalProps> = ({
  isOpen,
  cashbackAmount,
  milestoneAmount = 0,
  orderId,
  onDismiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  const totalReward = cashbackAmount + milestoneAmount;

  // Initialize Canvas scratch coating
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    // Elegant gold-brass scratch coating
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#D4AF37');
    gradient.addColorStop(0.3, '#F3E5AB');
    gradient.addColorStop(0.5, '#AA771C');
    gradient.addColorStop(0.7, '#FFDF73');
    gradient.addColorStop(1, '#8B6508');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative patterned grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 15; x < width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 15; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Border highlight
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Scratch instruction text
    ctx.fillStyle = '#4A2E00';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ SCRATCH TO REVEAL ✦', width / 2, height / 2 - 12);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#684506';
    ctx.fillText('Swipe or drag here', width / 2, height / 2 + 14);

    setIsScratched(false);
    setScratchPercent(0);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Allow DOM to paint canvas
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initCanvas]);

  const checkScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      let transparentPixels = 0;
      const totalPixels = data.length / 4;

      // Sample every 8th pixel for fast calculation
      for (let i = 3; i < data.length; i += 32) {
        if (data[i] === 0) {
          transparentPixels++;
        }
      }

      const percent = Math.round((transparentPixels / (totalPixels / 8)) * 100);
      setScratchPercent(percent);

      // Auto reveal once scratched more than 35%
      if (percent >= 35 && !isScratched) {
        setIsScratched(true);
        ctx.clearRect(0, 0, width, height);
      }
    } catch {
      // Fallback
    }
  }, [isScratched]);

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2, false);
    ctx.fill();

    checkScratchPercentage();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    scratch(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    scratch(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleQuickReveal = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setIsScratched(true);
    setScratchPercent(100);
  };

  if (!isOpen) return null;

  return (
    <div
      id="akselling-scratch-card-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="akselling-scratch-card-modal"
        className="w-full max-w-sm bg-gradient-to-b from-stone-900 via-stone-900 to-black border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden"
      >
        {/* Glow ambient decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Ribbon */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
            Order Reward Unlocked
          </span>
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Scratch Your Cashback</h2>
        <p className="text-xs text-stone-400 mb-5">
          {orderId ? `Order #${orderId.slice(-8)} confirmed` : 'Payment successfully confirmed'}
        </p>

        {/* Scratch Card Container */}
        <div
          ref={containerRef}
          id="scratch-card-box"
          className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-inner border border-amber-500/40 bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-200 flex flex-col items-center justify-center p-4 select-none"
        >
          {/* UNDERLYING REVEALED CONTENT (Strict user requirement: Welcome + Exact Cashback + AKSelling brand) */}
          <div className="flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-xs font-bold text-amber-800 tracking-wider uppercase">
              ✦ Exclusive Reward ✦
            </span>

            {/* Exact Welcome Text */}
            <h3 className="text-3xl font-black text-amber-950 tracking-tight">
              Welcome
            </h3>

            {/* Exact Cashback Amount based on price slab */}
            <div className="py-1">
              <div className="text-4xl font-extrabold text-emerald-700 tracking-tight flex items-center justify-center gap-1">
                <span>₹{totalReward > 0 ? totalReward : 30}</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-800">
                Cashback Added to Wallet
              </p>
            </div>

            {/* Brand Name "AKSelling" displayed right below */}
            <div className="pt-1">
              <span className="text-lg font-black tracking-wider text-amber-950 uppercase border-t border-amber-300/80 pt-1 block">
                AKSelling
              </span>
            </div>

            {milestoneAmount > 0 && (
              <span className="text-[10px] font-bold text-amber-900 bg-amber-300/60 px-2 py-0.5 rounded-full mt-1">
                Includes ₹{milestoneAmount} 3rd Order Milestone Bonus!
              </span>
            )}
          </div>

          {/* CANVAS OVERLAY FOR TOUCH-TO-SCRATCH */}
          <canvas
            ref={canvasRef}
            width={300}
            height={225}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`absolute inset-0 w-full h-full cursor-pointer touch-none transition-opacity duration-500 ${
              isScratched ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />
        </div>

        {/* Scratch status / quick reveal */}
        <div className="mt-3 flex items-center justify-between px-2 text-xs text-stone-400">
          {!isScratched ? (
            <>
              <span className="flex items-center gap-1 text-[11px]">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                {scratchPercent > 0 ? `${scratchPercent}% scratched` : 'Swipe to scratch'}
              </span>
              <button
                type="button"
                onClick={handleQuickReveal}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
              >
                Quick Reveal
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 text-emerald-400 font-medium py-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cashback successfully credited!</span>
            </div>
          )}
        </div>

        {/* OK BUTTON - Dismissal button as explicitly specified */}
        <div className="mt-5">
          <button
            id="scratch-card-ok-btn"
            type="button"
            onClick={onDismiss}
            className="w-full py-3 px-6 rounded-xl font-bold text-sm text-stone-900 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.98] shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
