import React, { useState } from 'react';
import { Sparkles, Bot, Wand2, X, Check, Flame, Dumbbell, ShieldAlert, Zap, Compass, RefreshCw } from 'lucide-react';
import { FONT_COLLECTION } from './customStudioData';

export interface GeneratedSlogan {
  text: string;
  subText?: string;
  category?: string;
  recommendedFontId?: string;
  decorTop?: string;
  decorBottom?: string;
  suggestedInkColor?: string;
  vibe?: string;
}

interface AiSloganGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySlogan: (slogan: GeneratedSlogan) => void;
}

const QUICK_MOODS = [
  { id: 'gym', label: 'Gym & Beast Mode', icon: Dumbbell, query: 'Gym Motivation & Beast Workout' },
  { id: 'hindi_swag', label: 'Hindi Swag & Banna', icon: Flame, query: 'Hindi Swag & Desi Attitude' },
  { id: 'anime', label: 'Anime & Manga Quotes', icon: Zap, query: 'Anime Quotes & Japanese Street' },
  { id: 'biker', label: 'Biker & High RPM', icon: ShieldAlert, query: 'Biker Life & High RPM Attitude' },
  { id: 'devotional', label: 'Mahakal & Mahadev', icon: Sparkles, query: 'Mahakal Shiva Devotional' },
  { id: 'minimal_street', label: 'Urban Minimalist', icon: Compass, query: 'Minimalist Urban Streetwear' },
];

export default function AiSloganGenerator({
  isOpen,
  onClose,
  onApplySlogan,
}: AiSloganGeneratorProps) {
  const [topic, setTopic] = useState('Gym Motivation');
  const [selectedTone, setSelectedTone] = useState<'bold' | 'desi_swag' | 'savage' | 'inspirational' | 'minimal'>('bold');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sourceNote, setSourceNote] = useState<string>('');
  const [results, setResults] = useState<GeneratedSlogan[]>([
    {
      text: 'BEAST MODE: ON',
      subText: 'SWEAT IS WEAKNESS LEAVING THE BODY',
      category: 'Gym Motivation',
      recommendedFontId: 'beast_heavy',
      decorTop: '★ NO EXCUSES • PURE GRIND ★',
      decorBottom: 'HEAVYWEIGHT ATHLETIC DIVISION',
      suggestedInkColor: '#EAB308',
      vibe: 'High Energy Aggressive',
    },
    {
      text: 'PAIN TODAY. PR TOMORROW.',
      subText: 'IRON NEVER LIES • 5AM CLUB',
      category: 'Gym Motivation',
      recommendedFontId: 'chicago_varsity',
      decorTop: 'BARBELL CLUB • EST. 2026',
      decorBottom: 'BUILT IN THE SHADOWS',
      suggestedInkColor: '#FFFFFF',
      vibe: 'Raw Athletic',
    },
    {
      text: 'DON\'T TALK. LIFT.',
      subText: 'CALORIES CRYING • GLORY RISING',
      category: 'Gym Motivation',
      recommendedFontId: 'thunder_heavy',
      decorTop: 'HEAVY REPS ONLY',
      decorBottom: 'UNBREAKABLE MINDSET',
      suggestedInkColor: '#F43F5E',
      vibe: 'Minimal Savage',
    },
  ]);

  const handleGenerate = async (customQuery?: string) => {
    const queryToUse = customQuery || topic;
    if (!queryToUse.trim()) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/ai/slogan-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: queryToUse,
          tone: selectedTone,
          count: 6,
        }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.slogans) && data.slogans.length > 0) {
        const normalized: GeneratedSlogan[] = data.slogans.map((s: Record<string, string | undefined>) => ({
          text: s.text || s.slogan || 'AKSELLING STREET',
          subText: s.subText || s.subtext || '',
          category: s.category || queryToUse,
          recommendedFontId: s.recommendedFontId || s.recommendedFont || 'beast_heavy',
          decorTop: s.decorTop || '★ ORIGINAL FACTORY EDITION ★',
          decorBottom: s.decorBottom || '100% PURE COMBED COTTON',
          suggestedInkColor: s.suggestedInkColor || '#EAB308',
          vibe: s.vibe || s.mood || 'Streetwear Attitude',
        }));
        setResults(normalized);
        if (data.source === 'openai') {
          setSourceNote('Generated via OpenAI ChatGPT (gpt-4o-mini)');
        } else {
          setSourceNote('Generated via AKSelling Curated AI Engine');
        }
      } else {
        throw new Error(data.error || 'Failed to generate slogans');
      }
    } catch {
      setErrorMsg('Could not fetch slogans from server. Showing top creative alternatives.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  AI Slogan & Punchline Generator
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> OpenAI ChatGPT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enter any mood or topic to generate print-ready typography & punchlines
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input & Quick Chips */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Gym Motivation, Hindi Swag, Anime quotes, Mahakal, Cyberpunk..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isLoading || !topic.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  AI Generate
                </>
              )}
            </button>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Vibe:</span>
            {[
              { id: 'bold', label: 'Bold Street' },
              { id: 'desi_swag', label: 'Desi Swag' },
              { id: 'savage', label: 'Savage & Badass' },
              { id: 'inspirational', label: 'Inspirational' },
              { id: 'minimal', label: 'Minimalist' },
            ].map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => setSelectedTone(tone.id as 'bold' | 'desi_swag' | 'savage' | 'inspirational' | 'minimal')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTone === tone.id
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tone.label}
              </button>
            ))}
          </div>

          {/* Quick Mood Topics */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {QUICK_MOODS.map((mood) => {
              const Icon = mood.icon;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => {
                    setTopic(mood.query);
                    handleGenerate(mood.query);
                  }}
                  className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-full cursor-pointer transition-all"
                >
                  <Icon size={12} className="text-amber-400" />
                  <span>{mood.label}</span>
                </button>
              );
            })}
          </div>

          {sourceNote && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Check size={12} /> {sourceNote}
            </p>
          )}
          {errorMsg && <p className="text-[11px] text-amber-400">{errorMsg}</p>}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Generated Suggestions ({results.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Click &quot;Apply to T-Shirt&quot; to transfer instantly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((item, index) => {
              const matchedFont = FONT_COLLECTION.find((f) => f.id === item.recommendedFontId) || FONT_COLLECTION[0];

              return (
                <div
                  key={index}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-amber-400/60 transition-all group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-amber-300">
                        {item.vibe || item.category || 'Streetwear'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Font: {matchedFont.name}
                      </span>
                    </div>

                    {/* Decor Top */}
                    {item.decorTop && (
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1 truncate">
                        {item.decorTop}
                      </p>
                    )}

                    {/* Main Slogan Preview */}
                    <h4
                      className="text-base sm:text-lg font-bold text-white mb-1.5 leading-snug group-hover:text-amber-300 transition-colors"
                      style={{ fontFamily: matchedFont.fontFamily }}
                    >
                      {item.text}
                    </h4>

                    {/* Subtext */}
                    {item.subText && (
                      <p className="text-xs text-slate-400 font-mono tracking-wider mb-2">
                        {item.subText}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-900 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-slate-700"
                        style={{ backgroundColor: item.suggestedInkColor || '#EAB308' }}
                        title="Suggested Ink Color"
                      />
                      <span className="text-[10px] text-slate-500">Print Ink</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onApplySlogan(item);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-sm"
                    >
                      <span>Apply to T-Shirt</span>
                      <Wand2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
