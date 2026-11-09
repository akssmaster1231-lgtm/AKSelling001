import { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, Volume2, VolumeX, Eye, EyeOff, Rocket, Flame } from 'lucide-react';
import { diwaliSound } from './diwaliSound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  flickerSpeed: number;
  sparklePhase: number;
  type: 'rain' | 'burst' | 'smoke' | 'trail';
  gravity: number;
}

interface RocketEntity {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  trailTimer: number;
}

// Royal Diwali celebratory color palette: Golden Saffron, Deep Amber, Ruby Red, Emerald Green, Electric Cyan, Royal Violet
const FESTIVE_COLORS = [
  '#FFD700', // Royal Gold
  '#FFA500', // Amber Saffron
  '#FF4500', // Deep Orange
  '#FF1493', // Rani Pink
  '#00FF7F', // Emerald Green
  '#00E5FF', // Electric Cyan
  '#FFF8DC', // Pearl Golden
  '#FFE4B5', // Soft Moccasin
];

export default function DiwaliFestiveOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('akselling_diwali_overlay');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('akselling_diwali_sound');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [burstCount, setBurstCount] = useState<number>(0);

  const particlesRef = useRef<Particle[]>([]);
  const rocketsRef = useRef<RocketEntity[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const isEnabledRef = useRef<boolean>(isEnabled);
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  useEffect(() => {
    isEnabledRef.current = isEnabled;
    try {
      localStorage.setItem('akselling_diwali_overlay', String(isEnabled));
    } catch {
      // ignore
    }
  }, [isEnabled]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    diwaliSound.setMuted(!soundEnabled);
    try {
      localStorage.setItem('akselling_diwali_sound', String(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // Create fireworks burst at (x, y)
  const createFireworkBurst = useCallback((x: number, y: number, colorPreset?: string, count: number = 48) => {
    const baseColor = colorPreset || FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)];
    const goldColor = '#FFD700';

    if (soundEnabledRef.current) {
      diwaliSound.playCrackerBurst();
    }

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 4.5 + 1.8;
      const useGold = Math.random() > 0.45;

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: useGold ? goldColor : baseColor,
        alpha: 1,
        decay: Math.random() * 0.018 + 0.014,
        size: Math.random() * 2.8 + 1.4,
        flickerSpeed: Math.random() * 0.2 + 0.1,
        sparklePhase: Math.random() * Math.PI,
        type: 'burst',
        gravity: 0.065,
      });
    }

    // Add extra golden sparks (फुलझड़ी sparks around burst)
    for (let j = 0; j < 18; j++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6.5 + 2.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#FFF8DC',
        alpha: 1,
        decay: Math.random() * 0.025 + 0.02,
        size: Math.random() * 1.8 + 0.8,
        flickerSpeed: 0.3,
        sparklePhase: Math.random() * Math.PI,
        type: 'burst',
        gravity: 0.08,
      });
    }
  }, []);

  // Launch a celebratory sky rocket (रॉकेट)
  const launchRocket = useCallback((startX?: number, targetHeight?: number) => {
    if (!isEnabledRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = typeof startX === 'number' ? startX : Math.random() * (canvas.width * 0.7) + canvas.width * 0.15;
    const targetY = typeof targetHeight === 'number' ? targetHeight : Math.random() * (canvas.height * 0.35) + canvas.height * 0.12;

    rocketsRef.current.push({
      x,
      y: canvas.height + 10,
      targetY,
      vy: -(Math.random() * 3 + 8),
      color: FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)],
      trailTimer: 0,
    });

    if (soundEnabledRef.current) {
      diwaliSound.playRocketWhoosh();
    }
    setBurstCount((c) => c + 1);
  }, []);

  // Shower of Golden Sparklers (झड़ी की बारिश)
  const showerSparklerRain = useCallback((burstIntense: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = burstIntense ? 35 : 12;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * canvas.width;
      const y = -10 - Math.random() * 40;
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: Math.random() * 2.2 + 1.2,
        color: Math.random() > 0.3 ? '#FFD700' : '#FFA500',
        alpha: Math.random() * 0.5 + 0.5,
        decay: Math.random() * 0.006 + 0.003,
        size: Math.random() * 2.2 + 1.0,
        flickerSpeed: Math.random() * 0.15 + 0.08,
        sparklePhase: Math.random() * Math.PI * 2,
        type: 'rain',
        gravity: 0.012,
      });
    }

    if (burstIntense && soundEnabledRef.current) {
      diwaliSound.playSparklerFizz();
    }
  }, []);

  // Set up canvas sizing & main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let lastRocketTime = Date.now();
    let lastRainTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();

      if (isEnabledRef.current) {
        // Continuous gentle golden rain (झड़ी)
        if (now - lastRainTime > 280) {
          showerSparklerRain(false);
          lastRainTime = now;
        }

        // Periodic celebratory fireworks rocket every 6-8 seconds
        if (now - lastRocketTime > 6500) {
          launchRocket();
          lastRocketTime = now;
        }
      }

      // 1. Update and draw Rockets
      for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
        const r = rocketsRef.current[i];
        r.y += r.vy;
        r.trailTimer++;

        // Add tail sparks
        if (r.trailTimer % 2 === 0) {
          particlesRef.current.push({
            x: r.x + (Math.random() - 0.5) * 4,
            y: r.y + 6,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 2 + 1.5,
            color: '#FFD700',
            alpha: 0.9,
            decay: 0.045,
            size: Math.random() * 2.5 + 1.2,
            flickerSpeed: 0.2,
            sparklePhase: 0,
            type: 'trail',
            gravity: 0.05,
          });
        }

        // Rocket head glow
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Burst trigger when target altitude reached or velocity flips
        if (r.y <= r.targetY) {
          createFireworkBurst(r.x, r.y, r.color, 54);
          rocketsRef.current.splice(i, 1);
        }
      }

      // 2. Update and draw Particles (rain, burst, trail)
      const maxParticles = 260; // Cap to keep zero lag on low-end mobiles
      if (particlesRef.current.length > maxParticles) {
        particlesRef.current.splice(0, particlesRef.current.length - maxParticles);
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;
        p.sparklePhase += p.flickerSpeed;

        if (p.alpha <= 0 || p.y > height + 20) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        // Twinkle factor for golden sparkler sparkle effect
        const twinkle = Math.sin(p.sparklePhase) * 0.35 + 0.65;
        const currentAlpha = Math.max(0, Math.min(1, p.alpha * twinkle));

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = p.color;

        if (p.type === 'burst') {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // 4-pointed star glitter for brightest particles
          if (p.size > 2.0 && currentAlpha > 0.4) {
            ctx.fillStyle = '#FFFFFF';
            const s = p.size * 1.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - s);
            ctx.lineTo(p.x, p.y + s);
            ctx.moveTo(p.x - s, p.y);
            ctx.lineTo(p.x + s, p.y);
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
          }
        } else if (p.type === 'rain') {
          // Elongated droplet for rain effect
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 0.7, p.size * 1.4, Math.PI * 0.05, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Trail
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [createFireworkBurst, launchRocket, showerSparklerRain]);

  // Global click-to-burst trigger: when clicking outside interactive buttons
  useEffect(() => {
    if (!isEnabled) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Don't trigger if clicking on inputs, select, or buttons
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      // Small joyful burst on empty clicks
      if (Math.random() > 0.6) {
        createFireworkBurst(e.clientX, e.clientY, undefined, 24);
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [isEnabled, createFireworkBurst]);

  // Launch celebratory rocket triggered by external custom event
  useEffect(() => {
    const handleCustomRocket = () => {
      launchRocket();
    };
    const handleCustomShower = () => {
      showerSparklerRain(true);
    };

    window.addEventListener('akselling_launch_rocket', handleCustomRocket);
    window.addEventListener('akselling_shower_sparkler', handleCustomShower);

    return () => {
      window.removeEventListener('akselling_launch_rocket', handleCustomRocket);
      window.removeEventListener('akselling_shower_sparkler', handleCustomShower);
    };
  }, [launchRocket, showerSparklerRain]);

  return (
    <>
      {/* Non-blocking transparent particle canvas covering viewport */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[45]"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Floating Diwali Festive Celebration Action Pill */}
      <div className="fixed bottom-20 right-3.5 z-[55] flex flex-col items-end gap-1.5 select-none print:hidden">
        {isMinimized ? (
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-slate-950 shadow-xl flex items-center justify-center border-2 border-yellow-200 hover:scale-110 active:scale-95 transition-all cursor-pointer animate-bounce"
            title="दिवाली धमाका मेनू खोलें (Open Diwali Cracker Bar)"
          >
            <Sparkles size={20} className="animate-spin text-slate-950" />
          </button>
        ) : (
          <div className="bg-slate-950/90 backdrop-blur-md border border-amber-400/40 rounded-2xl p-2 shadow-2xl flex flex-col gap-1.5 min-w-[160px] animate-scale-up">
            {/* Top Bar with Title & Close/Minimize */}
            <div className="flex items-center justify-between gap-2 px-1 pb-1 border-b border-amber-400/20">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🪔</span>
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
                  दिवाली धमाका
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="text-slate-400 hover:text-white text-xs p-0.5 rounded cursor-pointer"
                title="Minimize"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => launchRocket()}
                className="flex-1 py-1.5 px-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                title="रॉकेट फोड़ें (Burst Sky Rocket)"
              >
                <Rocket size={12} className="rotate-45" />
                <span>रॉकेट 🚀</span>
              </button>

              <button
                type="button"
                onClick={() => showerSparklerRain(true)}
                className="flex-1 py-1.5 px-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                title="फुलझड़ी जलाएं (Golden Rain Sparkler Shower)"
              >
                <Flame size={12} />
                <span>फुलझड़ी ✨</span>
              </button>
            </div>

            {/* Sound & Animation Toggles */}
            <div className="flex items-center justify-between gap-1 pt-0.5 text-[10px] text-slate-300 px-0.5">
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) {
                    diwaliSound.playAuspiciousChime();
                  }
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  soundEnabled
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title={soundEnabled ? 'आवाज बंद करें' : 'पटाखों की आवाज चालू करें'}
              >
                {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                <span>{soundEnabled ? 'आवाज On' : 'Mute'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  isEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title={isEnabled ? 'पटाखे व झड़ी रोकें' : 'पटाखे व झड़ी चालू करें'}
              >
                {isEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>{isEnabled ? 'झड़ी On' : 'Off'}</span>
              </button>
            </div>

            {burstCount > 0 && (
              <div className="text-[9px] text-center text-amber-400/80 font-mono tracking-tight">
                💥 {burstCount} पटाखे फोड़े गए!
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
