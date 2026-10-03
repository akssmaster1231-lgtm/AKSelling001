import React, { useEffect, useRef, useState } from 'react';

interface SalesMaster3DAvatarProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioAmplitude?: number; // 0 to 1
  size?: 'banner' | 'modal' | 'mini';
  className?: string;
  onTap?: () => void;
}

export const SalesMaster3DAvatar: React.FC<SalesMaster3DAvatarProps> = ({
  state,
  audioAmplitude = 0.5,
  size = 'banner',
  className = '',
  onTap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Avatar animation states
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [handGesture, setHandGesture] = useState<'welcome' | 'explain' | 'listen' | 'rest'>('rest');

  // Eye blinking controller
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const scheduleBlink = () => {
      const delay = Math.random() * 3200 + 2000; // blink every 2-5 seconds
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 160); // 160ms blink duration
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Gesture & Head Motion controller based on state
  useEffect(() => {
    if (state === 'speaking') {
      setHandGesture('explain');
      // Natural expressive head nod rhythm
      const interval = setInterval(() => {
        setHeadTilt((prev) => (prev === 0 ? 1 : prev === 1 ? -1 : 0));
      }, 700);
      return () => clearInterval(interval);
    } else if (state === 'listening') {
      setHandGesture('listen');
      setHeadTilt(1.5); // lean in with ear towards user
      setMouthOpen(0);
    } else if (state === 'thinking') {
      setHandGesture('rest');
      setHeadTilt(-1.2); // thoughtful upward tilt
      setMouthOpen(0);
    } else {
      setHandGesture('welcome');
      setHeadTilt(0);
      setMouthOpen(0);
    }
  }, [state]);

  // Real-time lip-sync mouth animation when speaking
  useEffect(() => {
    if (state !== 'speaking') {
      setMouthOpen(0);
      return;
    }

    let forward = true;
    let currentOpen = 0.2;
    const interval = setInterval(() => {
      const speed = 0.25 * (0.8 + audioAmplitude * 0.4);
      if (forward) {
        currentOpen += speed;
        if (currentOpen >= 0.85) forward = false;
      } else {
        currentOpen -= speed;
        if (currentOpen <= 0.1) forward = true;
      }
      setMouthOpen(Math.max(0.05, Math.min(0.95, currentOpen)));
    }, 60);

    return () => clearInterval(interval);
  }, [state, audioAmplitude]);

  // Procedural 3D Canvas Visualizer for ambient soundwaves, counter depth & light aura
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const render = () => {
      time += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 1. Draw glowing soundwave aura during active states
      if (state === 'speaking' || state === 'listening') {
        const numRings = state === 'speaking' ? 4 : 3;
        const color = state === 'speaking' ? 'rgba(16, 185, 129, ' : 'rgba(239, 68, 68, ';
        for (let i = 0; i < numRings; i++) {
          const radius = (w * 0.3) + Math.sin(time * 2 + i * 1.5) * 12 + (i * 18);
          const opacity = Math.max(0, 0.4 - (i * 0.1) + Math.sin(time * 3) * 0.1);
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.42, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `${color}${opacity})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      // 2. Draw equalizer bars on the bottom counter edge when speaking
      if (state === 'speaking') {
        const barCount = 18;
        const barWidth = 4;
        const spacing = (w * 0.5) / barCount;
        const startX = w * 0.25;
        const bottomY = h * 0.95;

        for (let b = 0; b < barCount; b++) {
          const height = Math.abs(Math.sin(time * 4 + b * 0.5)) * 24 + 6;
          const grad = ctx.createLinearGradient(0, bottomY - height, 0, bottomY);
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(0.5, '#10b981');
          grad.addColorStop(1, '#059669');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(startX + b * spacing, bottomY - height, barWidth, height, 2);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, audioAmplitude]);

  return (
    <div
      onClick={onTap}
      className={`relative select-none overflow-hidden ${
        size === 'banner'
          ? 'w-full h-full'
          : size === 'modal'
          ? 'w-full aspect-[4/3] max-w-[340px] rounded-3xl shadow-2xl border border-amber-400/50'
          : 'w-24 h-24 rounded-full border-2 border-amber-400'
      } ${className}`}
    >
      {/* Real Counter Photo Base Layer */}
      <img
        src="/ai_sales_master_counter.jpg"
        alt="Bhaiya ji - 3D AI Sales Master"
        className="w-full h-full object-cover object-center transition-transform duration-700 pointer-events-none"
      />

      {/* Dynamic 3D Head & Expression Overlay */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center transition-transform duration-300"
        style={{
          transform: `rotate(${headTilt * 1.5}deg) translateY(${
            state === 'speaking' ? Math.sin(Date.now() / 150) * 1.5 : 0
          }px)`,
        }}
      >
        {/* Procedural Canvas Layer for Auras & Equalizers */}
        <canvas
          ref={canvasRef}
          width={size === 'banner' ? 600 : 340}
          height={size === 'banner' ? 320 : 255}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Dynamic Eye Blink Overlay (Positioned around eye region in counter image) */}
        {isBlinking && (
          <div className="absolute top-[37.5%] left-[45%] w-[11%] h-[2.5%] flex items-center justify-between opacity-95">
            <span className="w-2.5 h-[3px] bg-[#3a2012] rounded-full shadow-xs" />
            <span className="w-2.5 h-[3px] bg-[#3a2012] rounded-full shadow-xs" />
          </div>
        )}

        {/* Dynamic Lip-Sync Mouth Overlay (Synchronized to deep male voice audio) */}
        {state === 'speaking' && mouthOpen > 0.1 && (
          <div
            className="absolute top-[46.8%] left-[48.2%] -translate-x-1/2 w-4 bg-[#2b140b] rounded-full border border-amber-800/60 shadow-inner transition-all duration-75"
            style={{
              height: `${Math.max(3, mouthOpen * 9)}px`,
              opacity: 0.92,
            }}
          >
            {/* Upper Teeth highlight */}
            <span className="block w-2.5 h-[1.5px] bg-white/90 mx-auto rounded-xs mt-[0.5px]" />
          </div>
        )}

        {/* Natural Hand & Gesture Indicator Badges */}
        {handGesture === 'explain' && state === 'speaking' && (
          <div className="absolute bottom-5 right-6 bg-slate-950/85 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/60 text-[10px] font-black shadow-lg flex items-center gap-1.5 animate-bounce">
            <span className="text-xs">👋</span>
            <span>Bhai samjho...</span>
          </div>
        )}

        {handGesture === 'listen' && state === 'listening' && (
          <div className="absolute bottom-5 right-6 bg-rose-950/85 backdrop-blur-md text-rose-300 px-2.5 py-1 rounded-full border border-rose-400/60 text-[10px] font-black shadow-lg flex items-center gap-1.5 animate-pulse">
            <span className="text-xs">👂</span>
            <span>Boliye bhai, sun raha hu</span>
          </div>
        )}
      </div>

      {/* Ambient Lighting Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />
    </div>
  );
};
