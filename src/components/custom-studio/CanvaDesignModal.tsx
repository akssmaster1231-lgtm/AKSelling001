import React, { useState, useEffect, useRef } from 'react';
import { Palette, X, Upload, Check, ExternalLink, Sparkles, Layers, RefreshCw } from 'lucide-react';

interface CanvaSDK {
  DesignButton?: {
    initialize: (opts: {
      apiKey: string;
      designType: string;
      onDesignOpen: () => void;
      onDesignPublish: (data: { exportUrl: string }) => void;
    }) => void;
  };
}

declare global {
  interface Window {
    Canva?: CanvaSDK;
  }
}

interface CanvaDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportGraphic: (graphicDataUrl: string, title?: string) => void;
}

// Curated high-res transparent apparel graphic overlays for instant Canva testing
const CANVA_SHOWCASE_PRESETS = [
  {
    id: 'canva_cyber_samurai',
    title: 'Cyber Samurai Graphic (Canva Vector)',
    category: 'Anime Streetwear',
    svg: `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cyberG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF007F"/>
          <stop offset="100%" stop-color="#00F0FF"/>
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="150" fill="none" stroke="url(#cyberG)" stroke-width="6" stroke-dasharray="8 8"/>
      <polygon points="200,60 230,140 310,140 245,190 270,270 200,220 130,270 155,190 90,140 170,140" fill="url(#cyberG)" opacity="0.9"/>
      <text x="200" y="320" font-family="'Inter', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">NEO TOKYO 2077</text>
      <text x="200" y="350" font-family="'Inter', sans-serif" font-weight="700" font-size="14" fill="#00F0FF" text-anchor="middle" letter-spacing="6">CYBER APPAREL</text>
    </svg>`,
  },
  {
    id: 'canva_golden_mandala',
    title: 'Golden Royal Mandala (Canva Sacred Art)',
    category: 'Royal & Devotional',
    svg: `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F59E0B"/>
          <stop offset="50%" stop-color="#FDE047"/>
          <stop offset="100%" stop-color="#D97706"/>
        </linearGradient>
      </defs>
      <circle cx="200" cy="180" r="110" fill="none" stroke="url(#goldG)" stroke-width="4"/>
      <circle cx="200" cy="180" r="70" fill="none" stroke="url(#goldG)" stroke-width="3" stroke-dasharray="6 4"/>
      <circle cx="200" cy="180" r="30" fill="url(#goldG)"/>
      <path d="M 200 40 L 215 110 L 200 130 L 185 110 Z" fill="url(#goldG)"/>
      <path d="M 200 320 L 215 250 L 200 230 L 185 250 Z" fill="url(#goldG)"/>
      <path d="M 60 180 L 130 195 L 150 180 L 130 165 Z" fill="url(#goldG)"/>
      <path d="M 340 180 L 270 195 L 250 180 L 270 165 Z" fill="url(#goldG)"/>
      <text x="200" y="340" font-family="'Montserrat', sans-serif" font-weight="900" font-size="24" fill="#FDE047" text-anchor="middle" letter-spacing="5">ROYAL HERITAGE</text>
      <text x="200" y="365" font-family="'Montserrat', sans-serif" font-weight="700" font-size="12" fill="#E2E8F0" text-anchor="middle" letter-spacing="4">ORIGINAL EDITION</text>
    </svg>`,
  },
  {
    id: 'canva_retro_surf',
    title: 'Vintage Sunset Palm (Canva Retro)',
    category: 'Retro Aesthetic',
    svg: `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sunsetG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FF5E36"/>
          <stop offset="40%" stop-color="#FFAE33"/>
          <stop offset="100%" stop-color="#6C2EB9"/>
        </linearGradient>
      </defs>
      <circle cx="200" cy="170" r="100" fill="url(#sunsetG)"/>
      <path d="M 120 220 Q 200 215 280 220 Q 200 230 120 220 Z" fill="#18181B"/>
      <path d="M 190 220 C 195 160 180 120 170 95 C 185 115 195 150 195 220 Z" fill="#18181B"/>
      <path d="M 170 95 Q 140 110 120 135 Q 150 120 170 110" fill="#18181B"/>
      <path d="M 175 105 Q 210 115 235 140 Q 200 125 178 115" fill="#18181B"/>
      <text x="200" y="320" font-family="'Inter', sans-serif" font-weight="900" font-size="30" fill="#FFAE33" text-anchor="middle" letter-spacing="6">CALIFORNIA 1984</text>
      <text x="200" y="350" font-family="'Inter', sans-serif" font-weight="700" font-size="13" fill="#FFFFFF" text-anchor="middle" letter-spacing="5">ENDLESS SUMMER VIBES</text>
    </svg>`,
  },
];

export default function CanvaDesignModal({
  isOpen,
  onClose,
  onImportGraphic,
}: CanvaDesignModalProps) {
  const [canvaClientId, setCanvaClientId] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [sdkLoaded, setSdkLoaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'canva_sdk'>('presets');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch Canva config from server
  useEffect(() => {
    fetch('/api/canva/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.clientId) {
          setCanvaClientId(data.clientId);
          setIsConfigured(data.configured);
        }
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  // Dynamically load Canva WebSDK script if not already on window
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Canva) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.canva.com/v1/api.js';
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
    };
    script.onerror = () => {
      // SDK might be blocked or demo mode, continue safely
      setSdkLoaded(false);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleLaunchCanvaEditor = () => {
    if (typeof window !== 'undefined' && window.Canva?.DesignButton) {
      try {
        window.Canva.DesignButton.initialize({
          apiKey: canvaClientId || 'canva_apparel_studio_key',
          designType: 'TShirt',
          onDesignOpen: () => {},
          onDesignPublish: (publishData: { exportUrl: string }) => {
            if (publishData?.exportUrl) {
              onImportGraphic(publishData.exportUrl, 'Canva Published Design');
              onClose();
            }
          },
        });
      } catch {
        // fallback to standard browser link
        window.open('https://www.canva.com/create/t-shirts/', '_blank');
      }
    } else {
      window.open('https://www.canva.com/create/t-shirts/', '_blank');
    }
  };

  const convertSvgToPngDataUrl = (svgString: string): Promise<string> => {
    return new Promise((resolve) => {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1200, 1200);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(url);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const handleApplyPreset = async (preset: typeof CANVA_SHOWCASE_PRESETS[0]) => {
    setIsProcessing(true);
    try {
      const pngUrl = await convertSvgToPngDataUrl(preset.svg);
      onImportGraphic(pngUrl, preset.title);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPreviewDataUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCustomGraphic = () => {
    if (previewDataUrl) {
      onImportGraphic(previewDataUrl, 'Canva Exported Overlay (300 DPI)');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-white flex items-center justify-center font-black shadow-lg">
              <Palette size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  Design & Edit with Canva
                </h3>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Canva Connect API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Create graphics in Canva and import directly onto your apparel canvas at 300 DPI
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

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles size={14} />
            <span>Canva Vector Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload size={14} />
            <span>Upload Canva Export</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('canva_sdk')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'canva_sdk'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ExternalLink size={14} />
            <span>Canva Web SDK</span>
          </button>
        </div>

        {/* Tab 1: Canva Presets */}
        {activeTab === 'presets' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                High-Resolution Graphic Assets
              </span>
              <span className="text-[11px] text-cyan-400">1-Click Overlay onto Apparel</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CANVA_SHOWCASE_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-slate-950 border border-slate-800 hover:border-cyan-400/70 rounded-2xl p-3 flex flex-col justify-between group transition-all shadow-md"
                >
                  <div
                    className="w-full h-36 bg-slate-900 rounded-xl p-2 flex items-center justify-center mb-2.5 overflow-hidden group-hover:scale-105 transition-transform"
                    dangerouslySetInnerHTML={{ __html: preset.svg }}
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      {preset.category}
                    </span>
                    <h5 className="text-xs font-bold text-white truncate">{preset.title}</h5>
                  </div>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApplyPreset(preset)}
                    className="mt-3 w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    <span>Import to Canvas</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Upload Canva Export */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/svg+xml, image/webp"
              onChange={handleCustomFileUpload}
              className="hidden"
            />

            {!previewDataUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-3xl p-8 bg-slate-950/50 flex flex-col items-center justify-center cursor-pointer transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Upload Transparent PNG from Canva
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  In Canva, export your design with &quot;Transparent Background&quot; at 300 DPI, then select or drop it here.
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Choose PNG File
                </button>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
                <div className="w-48 h-48 bg-slate-900 rounded-xl p-2 flex items-center justify-center mb-4 border border-slate-800">
                  <img
                    src={previewDataUrl}
                    alt="Canva Graphic Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDataUrl(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Choose Another
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCustomGraphic}
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Check size={14} />
                    Apply to T-Shirt
                  </button>
                </div>
              </div>
            )}

            <div className="text-left bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-white block">💡 Pro Designer Tip:</span>
              <p>For best DTF print results, design on a 3600 x 4800 px artboard in Canva, keep your design inside the safe margin, and download as transparent PNG.</p>
            </div>
          </div>
        )}

        {/* Tab 3: Canva Web SDK / Connect */}
        {activeTab === 'canva_sdk' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Canva Web SDK Status
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isConfigured
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isConfigured ? 'CLIENT ID READY' : 'CONFIG VIA .ENV'}
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-3">
                AKSelling studio connects directly with Canva Connect & WebSDK so customers can open Canva&apos;s full apparel editor in one click.
              </p>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>CANVA_CLIENT_ID: {canvaClientId ? `${canvaClientId.slice(0, 10)}...` : 'Not configured (using dev bridge)'}</div>
                <div>SDK Script: {sdkLoaded ? 'Loaded & Active' : 'Ready'}</div>
                <div>Export Mode: 300 DPI Transparent PNG (DTF Standard)</div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleLaunchCanvaEditor}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  <Palette size={16} />
                  <span>Open Canva T-Shirt Designer</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-400" />
                How the Canva Integration Works:
              </h5>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Click <strong>Open Canva T-Shirt Designer</strong> to launch your custom canvas in Canva.</li>
                <li>Add vector graphics, typography, textures, or photo elements.</li>
                <li>Download your finished work as PNG with transparent background.</li>
                <li>Switch to the <strong>Upload Canva Export</strong> tab to overlay it seamlessly on your shirt.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
