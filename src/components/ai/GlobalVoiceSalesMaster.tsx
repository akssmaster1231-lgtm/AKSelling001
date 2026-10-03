import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  ArrowRight,
  Package,
  X,
} from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/data';
import { getCachedProducts } from '@/firebase';

const WELCOME_GREETING =
  'Namaste Boss, main AKSelling ki taraf se aapke liye kya seva pradan kar sakta hoon aur kya madad kar sakta hoon?';

interface GlobalVoiceSalesMasterProps {
  onSelectProduct: (product: Product) => void;
}

export const GlobalVoiceSalesMaster: React.FC<GlobalVoiceSalesMasterProps> = ({
  onSelectProduct,
}) => {
  const [activeRecommendedProduct, setActiveRecommendedProduct] = useState<Product | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [engineState, setEngineState] = useState<'idle' | 'listening' | 'speaking'>('idle');

  const recognitionRef = useRef<unknown>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const hasInitializedRef = useRef<boolean>(false);

  const stopAllAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }
  };

  // Heavy, Mature Masculine Male Web Speech Synthesis
  const speakWithDeepMaleVoice = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onDone?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_~`#[\]]/g, '').slice(0, 320);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'hi-IN';

      // Pick Indian Hindi male voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const maleHindiVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          const isHindi = v.lang.includes('hi') || v.lang.includes('IN') || v.lang.includes('hin');
          const isNotFemale =
            !name.includes('female') &&
            !name.includes('woman') &&
            !name.includes('girl') &&
            !name.includes('zira') &&
            !name.includes('kalpana') &&
            !name.includes('kavya');
          return isHindi && isNotFemale;
        });

        if (maleHindiVoice) {
          utterance.voice = maleHindiVoice;
        }
      }

      // Heavy, mature masculine pitch and steady pace
      utterance.pitch = 0.8;
      utterance.rate = 0.92;

      utterance.onstart = () => setEngineState('speaking');
      utterance.onend = () => {
        setEngineState('idle');
        onDone?.();
      };
      utterance.onerror = () => {
        setEngineState('idle');
        onDone?.();
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setEngineState('idle');
      onDone?.();
    }
  }, []);

  // Speaks Bhaiya ji's reply through phone speaker using Gemini TTS or Deep Male Web Speech
  const speakText = useCallback(
    (text: string, serverAudioBase64?: string | null, onDone?: () => void) => {
      if (isAudioMuted || typeof window === 'undefined') {
        onDone?.();
        return;
      }
      stopAllAudio();

      if (serverAudioBase64) {
        try {
          const audio = new Audio(`data:audio/wav;base64,${serverAudioBase64}`);
          activeAudioRef.current = audio;
          setEngineState('speaking');
          audio.onended = () => {
            setEngineState('idle');
            activeAudioRef.current = null;
            onDone?.();
          };
          audio.onerror = () => {
            setEngineState('idle');
            activeAudioRef.current = null;
            speakWithDeepMaleVoice(text, onDone);
          };
          audio.play().catch(() => {
            speakWithDeepMaleVoice(text, onDone);
          });
          return;
        } catch {
          // fallback
        }
      }

      speakWithDeepMaleVoice(text, onDone);
    },
    [isAudioMuted, speakWithDeepMaleVoice]
  );

  // Background Speech-to-Text Listener
  const startBackgroundListening = useCallback(() => {
    if (typeof window === 'undefined' || isListeningRef.current) return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try {
          (recognitionRef.current as { stop: () => void }).stop();
        } catch {
          // ignore
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = async (event: any) => {
        let finalStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          }
        }

        const query = finalStr.trim();
        if (query) {
          // Temporarily pause recognition while processing & speaking
          try {
            recognition.stop();
          } catch {
            // ignore
          }
          isListeningRef.current = false;
          setEngineState('idle');

          try {
            const liveCatalog = getCachedProducts();
            const res = await fetch('/api/sales-master/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: query,
                generateVoice: !isAudioMuted,
                liveProducts: liveCatalog.slice(0, 25),
              }),
            });

            const data = await res.json();
            const reply =
              data.reply ||
              'Bhai bilkul sahi! AKSelling mein pure 100% combed cotton aur premium 240 GSM drop shoulder prints ready hain. Batayein kaunsa color pack karwa du?';

            // Check if product recommendation matched
            if (Array.isArray(data.recommendedProducts) && data.recommendedProducts.length > 0) {
              setActiveRecommendedProduct(data.recommendedProducts[0]);
            } else if (liveCatalog.length > 0) {
              const lowerReply = reply.toLowerCase();
              const matched = liveCatalog.find((p) =>
                lowerReply.includes(p.title.toLowerCase())
              );
              if (matched) {
                setActiveRecommendedProduct(matched);
              }
            }

            // Speak answer over device speaker and resume listening upon completion
            speakText(reply, data.audioBase64, () => {
              if (isMountedRef.current) {
                setTimeout(() => {
                  startBackgroundListening();
                }, 500);
              }
            });
          } catch {
            // Resume listening on network error
            setTimeout(() => {
              startBackgroundListening();
            }, 1000);
          }
        }
      };

      recognition.onerror = () => {
        isListeningRef.current = false;
        setEngineState('idle');
        // Restart after short delay
        setTimeout(() => {
          if (isMountedRef.current && !isListeningRef.current) {
            startBackgroundListening();
          }
        }, 1500);
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setEngineState('idle');
        // Keep listening in continuous background mode
        setTimeout(() => {
          if (isMountedRef.current && !isListeningRef.current && engineState !== 'speaking') {
            startBackgroundListening();
          }
        }, 800);
      };

      recognitionRef.current = recognition;
      recognition.start();
      isListeningRef.current = true;
      setEngineState('listening');
    } catch {
      isListeningRef.current = false;
      setEngineState('idle');
    }
  }, [engineState, isAudioMuted, speakText]);

  // Direct Background Native Microphone Permission & Welcome Audio on App Mount
  useEffect(() => {
    isMountedRef.current = true;

    const requestNativeMicAndGreet = async () => {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      // 1. Request native browser/mobile microphone permission immediately
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());

          // 2. Permission granted: speak startup welcome audio immediately in heavy male voice
          speakText(WELCOME_GREETING, null, () => {
            // 3. Immediately start background listening once greeting finishes
            if (isMountedRef.current) {
              startBackgroundListening();
            }
          });
        } catch {
          // If browser policy requires user interaction first, listen for the first click/tap
          const handleFirstInteraction = async () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach((track) => track.stop());
              speakText(WELCOME_GREETING, null, () => {
                if (isMountedRef.current) {
                  startBackgroundListening();
                }
              });
            } catch {
              // ignore
            }
          };

          window.addEventListener('click', handleFirstInteraction, { once: true });
          window.addEventListener('touchstart', handleFirstInteraction, { once: true });
        }
      }
    };

    // Auto-prompt permission after slight mount delay
    const timer = setTimeout(requestNativeMicAndGreet, 800);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      stopAllAudio();
      if (recognitionRef.current) {
        try {
          (recognitionRef.current as { stop: () => void }).stop();
        } catch {
          // ignore
        }
      }
    };
  }, [speakText, startBackgroundListening]);

  return (
    <>
      {/* Discreet Minimalist Voice Status Pill (No Chat Boxes!) */}
      <div className="fixed top-14 right-3 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            stopAllAudio();
            setIsAudioMuted(!isAudioMuted);
          }}
          className={`px-2.5 py-1 rounded-full backdrop-blur-md border text-[11px] font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
            engineState === 'speaking'
              ? 'bg-emerald-600/90 text-white border-emerald-400 animate-pulse'
              : engineState === 'listening'
              ? 'bg-slate-900/90 text-amber-300 border-amber-400/60'
              : 'bg-slate-950/80 text-slate-300 border-slate-700'
          }`}
          title={isAudioMuted ? 'Unmute Bhaiya ji' : 'Mute Bhaiya ji'}
        >
          {isAudioMuted ? (
            <VolumeX size={13} className="text-rose-400" />
          ) : (
            <Volume2 size={13} className="text-amber-400" />
          )}
          <span>
            {engineState === 'speaking'
              ? 'Bhaiya ji bol rahe hain'
              : engineState === 'listening'
              ? 'Live Voice Active'
              : 'AI Voice'}
          </span>
        </button>
      </div>

      {/* Smart Product Recommendation Deal Card (Pops up only when product is recommended) */}
      {activeRecommendedProduct && (
        <div className="fixed bottom-20 inset-x-4 max-w-sm mx-auto z-50 animate-fade-in pointer-events-auto">
          <div className="bg-white rounded-2xl p-3 shadow-2xl border-2 border-amber-400 flex items-center justify-between gap-3 text-slate-900">
            <div className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
              {activeRecommendedProduct.image || activeRecommendedProduct.imageUrl ? (
                <img
                  src={activeRecommendedProduct.image || activeRecommendedProduct.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Package size={20} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-900 truncate">
                {activeRecommendedProduct.title}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-black text-[#1b365d]">
                  {formatPrice(activeRecommendedProduct.price)}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded">
                  {activeRecommendedProduct.fabric || '180 GSM Bio-Wash'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  stopAllAudio();
                  onSelectProduct(activeRecommendedProduct);
                  setActiveRecommendedProduct(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-md cursor-pointer"
              >
                <span>Buy Now</span>
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={() => setActiveRecommendedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
