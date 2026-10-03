import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import type { Product } from '@/types';
import { SalesMaster3DAvatar } from './SalesMaster3DAvatar';

const WELCOME_SPEECH =
  'Namaste Boss, main AKSelling ki taraf se aapke liye kya seva pradan kar sakta hoon aur kya madad kar sakta hoon?';

interface SalesMasterCounterBannerProps {
  onOpenVoice?: (initialVoicePrompt?: string) => void;
  onProductClick?: (product: Product) => void;
}

export const SalesMasterCounterBanner: React.FC<SalesMasterCounterBannerProps> = () => {
  const [isSpeakingGreeting, setIsSpeakingGreeting] = useState(false);

  const speakGreeting = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeakingGreeting) {
      setIsSpeakingGreeting(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(WELCOME_SPEECH);
    utterance.lang = 'hi-IN';
    utterance.pitch = 0.8; // Deep, heavy male resonance
    utterance.rate = 0.92;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const maleVoice = voices.find(
        (v) =>
          (v.lang.includes('hi') || v.lang.includes('IN')) &&
          !v.name.toLowerCase().includes('female') &&
          !v.name.toLowerCase().includes('zira') &&
          !v.name.toLowerCase().includes('kalpana')
      );
      if (maleVoice) utterance.voice = maleVoice;
    }

    utterance.onend = () => setIsSpeakingGreeting(false);
    utterance.onerror = () => setIsSpeakingGreeting(false);
    setIsSpeakingGreeting(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-amber-400/40 bg-slate-950 text-white group">
      {/* 3D Human-like AI Sales Master Shopkeeper Counter Avatar */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2.1/1] overflow-hidden bg-slate-900">
        <SalesMaster3DAvatar
          state={isSpeakingGreeting ? 'speaking' : 'idle'}
          size="banner"
          onTap={speakGreeting}
        />

        {/* Ambient Dark Gradient for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Top Status Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/50 shadow-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-black text-amber-300 tracking-wide uppercase">
              AI Sales Master • Bhaiya ji
            </span>
          </div>

          <span className="bg-[#1b365d]/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 hidden xs:inline-flex items-center gap-1">
            <ShieldCheck size={12} className="text-amber-400" />
            <span>AKSelling</span>
          </span>
        </div>

        {/* Clean Speaker Action Button (Sole Action Button on Banner) */}
        <div className="absolute bottom-3 right-3">
          <button
            type="button"
            onClick={speakGreeting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl backdrop-blur-md border transition-all cursor-pointer shadow-xl active:scale-95 ${
              isSpeakingGreeting
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/40 animate-pulse'
                : 'bg-slate-950/90 hover:bg-slate-900 text-amber-300 border-amber-400/70 hover:text-white hover:border-amber-300'
            }`}
            title={isSpeakingGreeting ? 'Speaker Band Karein' : 'Bhaiya ji ki aawaz sunein'}
          >
            {isSpeakingGreeting ? (
              <VolumeX size={18} className="text-white" />
            ) : (
              <Volume2 size={18} className="text-amber-300 animate-pulse" />
            )}
            <span className="text-xs font-black tracking-wide">
              {isSpeakingGreeting ? 'Stop Speaker' : 'Speaker'}
            </span>
          </button>
        </div>
      </div>

      {/* Sleek Minimalist Counter Bottom Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-[#1b365d] to-slate-950 px-4 py-2 flex items-center justify-between gap-2 border-t border-amber-400/30">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] text-amber-200 font-bold">
            Live Voice Counter • Background AI Assistance Active
          </span>
        </div>

        <button
          type="button"
          onClick={speakGreeting}
          className="text-[11px] font-bold text-amber-300 hover:text-white cursor-pointer"
        >
          {isSpeakingGreeting ? 'Speaking...' : 'Listen'}
        </button>
      </div>
    </div>
  );
};
