import React, { useState } from 'react';
import { Download, Share, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{
  className?: string;
  variant?: 'compact' | 'full';
}> = ({ className = '', variant = 'full' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          type="button"
          onClick={install}
          className={`flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 text-xs font-bold shadow-xs transition cursor-pointer ${className}`}
          title="Install AKSelling App"
        >
          <Download size={13} className="stroke-[2.5]" />
          <span>Install App</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className={`w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-[#1b365d] to-[#10223b] text-white rounded-2xl shadow-sm border border-amber-400/40 hover:opacity-95 transition cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
            <Smartphone size={20} />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-amber-300">Install AKSelling App</h4>
            <p className="text-[11px] text-slate-300">Fast 1-tap launcher, offline sync & full screen</p>
          </div>
        </div>
        <div className="bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1">
          <Download size={13} />
          <span>Install</span>
        </div>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        {variant === 'compact' ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 text-xs font-bold shadow-xs transition cursor-pointer ${className}`}
          >
            <Share size={12} className="stroke-[2.5]" />
            <span>Install on iOS</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-[#1b365d] to-[#10223b] text-white rounded-2xl shadow-sm border border-amber-400/40 hover:opacity-95 transition cursor-pointer ${className}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Smartphone size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-amber-300">Install on iPhone / iPad</h4>
                <p className="text-[11px] text-slate-300">Add to Home Screen for native experience</p>
              </div>
            </div>
            <div className="bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1">
              <Share size={13} />
              <span>Guide</span>
            </div>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img
                    src="/ak_brand_logo.jpg"
                    alt="AKSelling"
                    className="w-7 h-7 rounded-md object-contain bg-slate-950"
                  />
                  <h3 className="text-sm font-bold text-slate-900">Install on iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Tap the <strong className="text-blue-600">Share</strong> icon{' '}
                    <Share size={13} className="inline mx-0.5 align-text-bottom" /> in Safari’s bottom toolbar.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Scroll down and select <strong className="text-slate-900 font-semibold">"Add to Home Screen"</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Tap <strong className="font-bold">Add</strong> to launch AKSelling directly from your home screen.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#1b365d] py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
