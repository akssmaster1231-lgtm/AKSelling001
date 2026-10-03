import React, { useState } from 'react';
import { Download, Share, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode or dismissed, don't show the sticky banner
  if (isInstalled || dismissed) {
    return null;
  }

  // Only render if installable (Android/Chromium) or on iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-[#1b365d] via-[#10223b] to-slate-900 text-white px-3.5 py-2.5 shadow-md border-b border-amber-400/30 flex items-center justify-between gap-2.5 z-40 transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/ak_brand_logo.jpg"
            alt="AKSelling App"
            className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-amber-400/50 shadow-xs shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-300 truncate">Install AKSelling App</span>
              <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-400/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              Faster shopping, offline access & live notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable && (
            <button
              type="button"
              onClick={install}
              className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-transform flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} className="stroke-[2.5]" />
              <span>Install</span>
            </button>
          )}

          {isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-transform flex items-center gap-1.5 cursor-pointer"
            >
              <Share size={13} className="stroke-[2.5]" />
              <span>Add to Home</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
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
                  Scroll down the action sheet and select{' '}
                  <strong className="text-slate-900 font-semibold">"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Tap <strong className="font-bold">Add</strong> in the top right. AKSelling will appear as a native app on your home screen!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-[#1b365d] py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
