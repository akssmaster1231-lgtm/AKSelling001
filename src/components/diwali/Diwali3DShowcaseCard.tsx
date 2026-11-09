import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Rocket, Flame, Gift, Copy, Check, ChevronRight, Zap } from 'lucide-react';
import { diwaliSound } from './diwaliSound';

interface Diwali3DShowcaseCardProps {
  onExploreFestiveDeals?: () => void;
  onOpenCustomStudio?: () => void;
}

export default function Diwali3DShowcaseCard({
  onExploreFestiveDeals,
  onOpenCustomStudio,
}: Diwali3DShowcaseCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [diyaIlluminated, setDiyaIlluminated] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // 3D Tilt perspective effect based on mouse/touch
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9;
    const rotateY = ((x - centerX) / centerX) * 9;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // 1-Click Coupon Code Copy with Audio Chime & Firework Shower
  const handleCopyCoupon = () => {
    navigator.clipboard?.writeText('SHUBHLAXMI');
    setCopied(true);
    diwaliSound.playAuspiciousChime();

    // Trigger global celebration fireworks custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('akselling_launch_rocket'));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('akselling_shower_sparkler'));
      }, 350);
    }

    setTimeout(() => setCopied(false), 3000);
  };

  const triggerRocketBurst = (e: React.MouseEvent) => {
    e.stopPropagation();
    diwaliSound.playRocketWhoosh();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('akselling_launch_rocket'));
    }
  };

  const triggerSparklerShower = (e: React.MouseEvent) => {
    e.stopPropagation();
    diwaliSound.playSparklerFizz();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('akselling_shower_sparkler'));
    }
  };

  // High-performance background video/canvas simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 340);

    const stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 45; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.03 + 0.01,
      });
    }

    let animId: number;
    let tick = 0;

    const render = () => {
      tick += 0.03;
      ctx.clearRect(0, 0, width, height);

      // Deep royal festive night gradient with warm Diwali amber horizon
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#09021a'); // Royal night sky
      bg.addColorStop(0.5, '#1e052d'); // Deep plum festive glow
      bg.addColorStop(1, '#3b1202'); // Warm earthen diya ambient horizon
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Draw pulsating Diwali aura behind the 3D Diya
      const aura = ctx.createRadialGradient(
        width * 0.82,
        height * 0.55,
        10,
        width * 0.82,
        height * 0.55,
        width * 0.45
      );
      const pulse = Math.sin(tick * 2) * 0.08 + 0.38;
      aura.addColorStop(0, `rgba(255, 170, 0, ${pulse})`);
      aura.addColorStop(0.5, `rgba(255, 69, 0, ${pulse * 0.5})`);
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      // Twinkling golden stars
      for (const s of stars) {
        s.alpha += s.speed;
        const a = (Math.sin(s.alpha) + 1) / 2;
        ctx.fillStyle = `rgba(255, 235, 180, ${a * 0.85})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating Akash Kandil (Lanterns) drifting in perspective
      const lanternY = height * 0.22 + Math.sin(tick * 1.2) * 6;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 180, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(width * 0.18, lanternY, 18, 0, Math.PI * 2);
      ctx.fill();

      // Golden micro sparklers drifting upward from Diya
      for (let i = 0; i < 6; i++) {
        const sx = width * 0.82 + Math.sin(tick + i) * 22;
        const sy = (height * 0.55 - ((tick * 40 + i * 25) % 110));
        const sa = Math.max(0, 1 - (height * 0.55 - sy) / 110);
        ctx.fillStyle = `rgba(255, 215, 0, ${sa})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const onResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="w-full select-none perspective-[1200px]">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/50 transition-transform duration-200 ease-out will-change-transform group cursor-default"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.015 : 1}, ${isHovered ? 1.015 : 1}, 1)`,
        }}
      >
        {/* Dynamic Motion Video Wall / Canvas Loop Backdrop */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Dynamic Holographic Sheen Overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, rgba(255, 215, 0, 0.22) 0%, rgba(255, 100, 0, 0.08) 40%, transparent 70%)`,
            opacity: isHovered ? 1 : 0.65,
          }}
        />

        {/* Traditional Hanging Marigold Flowers & Festive Toran Border */}
        <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-amber-400/30 to-transparent flex items-center justify-around pointer-events-none z-20 overflow-hidden">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="text-[11px] animate-pulse"
              style={{ animationDelay: `${(i % 5) * 0.2}s` }}
            >
              🌼
            </span>
          ))}
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 text-white">
          {/* LEFT: Diwali Mega Offer Headline & Coupon */}
          <div className="flex-1 text-left space-y-3 max-w-lg">
            {/* Live Festive Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles size={13} className="text-slate-950 animate-spin" />
                <span>शुभ दीपावली धमाका सेल</span>
              </span>

              <span className="bg-red-600/80 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-400/40 animate-pulse">
                LIMITED FESTIVE DROP • 80% OFF
              </span>
            </div>

            {/* Glowing Golden Typography */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 drop-shadow-md leading-tight">
                रोशनी और खुशियों का त्योहार, AKSelling के संग!
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/90 mt-1.5 leading-relaxed font-medium">
                100% Pure Combed Cotton Tees, Festive Gold Print Streetwear & Free Diwali Gift Box on every order!
              </p>
            </div>

            {/* Coupon Code Scratch/Claim Pill */}
            <div className="bg-slate-950/80 backdrop-blur-md border border-amber-400/60 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                  <Gift size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-black text-amber-400 block tracking-wider">
                    FESTIVE CODE: FLAT 20% EXTRA OFF
                  </span>
                  <span className="text-sm sm:text-base font-black tracking-wider text-white font-mono">
                    SHUBHLAXMI
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCoupon}
                className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={14} className="stroke-[3]" />
                    <span>Copied! 🪔</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>कूपन कॉपी करें</span>
                  </>
                )}
              </button>
            </div>

            {/* Interactive Firework Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={triggerRocketBurst}
                className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 hover:brightness-110 active:scale-95 text-white font-black text-xs py-2 px-3.5 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer border border-red-300/40 transition-all"
                title="Click to burst sky rocket"
              >
                <Rocket size={14} className="rotate-45" />
                <span>🚀 रॉकेट फोड़ें</span>
              </button>

              <button
                type="button"
                onClick={triggerSparklerShower}
                className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs py-2 px-3.5 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer border border-yellow-200/50 transition-all"
                title="Click to shower golden sparklers"
              >
                <Flame size={14} />
                <span>✨ फुलझड़ी की बारिश</span>
              </button>

              {onExploreFestiveDeals && (
                <button
                  type="button"
                  onClick={onExploreFestiveDeals}
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs py-2 px-3.5 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Sparkles size={13} />
                  <span>दिवाली डील्स देखें</span>
                  <ChevronRight size={13} />
                </button>
              )}

              {onOpenCustomStudio && (
                <button
                  type="button"
                  onClick={onOpenCustomStudio}
                  className="bg-white/10 hover:bg-white/20 text-white font-black text-xs py-2 px-3.5 rounded-xl border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 backdrop-blur-xs ml-auto"
                >
                  <Zap size={14} className="text-amber-400" />
                  <span>Diwali 3D Print Studio</span>
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: 3D Holographic Diwali Diya & Gold Medallion Podium */}
          <div className="relative w-48 sm:w-56 h-48 sm:h-56 flex items-center justify-center shrink-0">
            {/* Multi-ring rotating festive mandala */}
            <div
              className="absolute inset-0 rounded-full border border-dashed border-amber-400/40 animate-spin"
              style={{ animationDuration: '28s' }}
            />
            <div
              className="absolute inset-2 rounded-full border border-amber-400/20 animate-spin"
              style={{ animationDuration: '18s', animationDirection: 'reverse' }}
            />

            {/* Glowing Golden Lakshmi / Shubh Deepavali 3D Seal */}
            <div className="absolute top-2 right-2 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 rounded-full w-12 h-12 flex flex-col items-center justify-center shadow-xl border-2 border-yellow-100 animate-pulse z-20">
              <span className="text-[10px] font-black leading-none">शुभ</span>
              <span className="text-[9px] font-black leading-none text-orange-950">लाभ</span>
            </div>

            {/* 3D Realistic Glowing Terracotta Clay Diya */}
            <div
              onClick={() => setDiyaIlluminated(!diyaIlluminated)}
              className="relative cursor-pointer transition-transform group-hover:scale-105"
              title="Click to touch the Diya!"
            >
              {/* Outer Golden Corona Glow */}
              {diyaIlluminated && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 bg-amber-400/35 rounded-full blur-xl animate-pulse pointer-events-none" />
              )}

              {/* Realistic Animated Multi-layer Flame */}
              {diyaIlluminated && (
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                  {/* Pulsating outer flame */}
                  <div className="relative w-7 h-12">
                    {/* Outer orange flame */}
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-200 rounded-full filter blur-[1px] animate-flame origin-bottom" />
                    {/* Inner bright yellow body */}
                    <div className="absolute bottom-1 left-1 right-1 top-2 bg-gradient-to-t from-yellow-400 via-yellow-100 to-white rounded-full filter blur-xs animate-flame-inner origin-bottom" />
                    {/* Blue oxidation core at base */}
                    <div className="absolute bottom-0.5 left-2 right-2 h-2.5 bg-blue-500 rounded-full filter blur-2xs opacity-80" />
                    {/* Black wick */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-stone-900 rounded-full" />
                  </div>
                </div>
              )}

              {/* Terracotta Diya Bowl SVG with ornate relief */}
              <svg
                width="140"
                height="80"
                viewBox="0 0 140 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-2xl"
              >
                <defs>
                  <linearGradient id="terracottaG" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#C85A17" />
                    <stop offset="40%" stopColor="#8A3309" />
                    <stop offset="100%" stopColor="#4A1804" />
                  </linearGradient>
                  <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFE066" />
                    <stop offset="100%" stopColor="#FF8C00" />
                  </linearGradient>
                  <radialGradient id="oilGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFA500" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#78350F" stopOpacity="0.3" />
                  </radialGradient>
                </defs>

                {/* Base shadow */}
                <ellipse cx="70" cy="74" rx="48" ry="6" fill="#000000" fillOpacity="0.45" />

                {/* Diya Clay Body */}
                <path
                  d="M 12 36 C 18 64, 122 64, 128 36 C 132 48, 110 72, 70 72 C 30 72, 8 48, 12 36 Z"
                  fill="url(#terracottaG)"
                />

                {/* Diya Upper Bowl Opening */}
                <ellipse cx="70" cy="35" rx="58" ry="14" fill="#6B2D0C" />
                <ellipse cx="70" cy="35" rx="54" ry="11" fill="url(#oilGlow)" />

                {/* Golden rim border */}
                <ellipse
                  cx="70"
                  cy="35"
                  rx="58"
                  ry="14"
                  fill="none"
                  stroke="url(#goldRim)"
                  strokeWidth="2.5"
                />

                {/* Embossed festive dots on clay rim */}
                {[20, 35, 52, 70, 88, 105, 120].map((cx, idx) => (
                  <circle key={idx} cx={cx} cy="45" r="1.8" fill="#FFD700" />
                ))}

                {/* Diya pointed spout for wick */}
                <path d="M 64 36 L 70 26 L 76 36 Z" fill="#451A03" />
              </svg>

              {/* Pedestal Reflection */}
              <div className="w-28 h-3 mx-auto bg-amber-500/25 blur-md rounded-full mt-1" />

              <span className="block text-[10px] font-bold text-amber-300 text-center mt-1">
                🪔 {diyaIlluminated ? 'दिव्य ज्योति प्रज्वलित' : 'दीपक जलाएं'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
