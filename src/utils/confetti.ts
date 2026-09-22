/**
 * Lightweight, zero-dependency canvas confetti explosion
 * Safe for iframes, mobile, and SSR
 */
export function fireConfetti(opts?: { particleCount?: number; spread?: number }) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const particleCount = opts?.particleCount || 80;
  const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#FBBF24'];

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    vRot: number;
    opacity: number;
  }

  const particles: Particle[] = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() * Math.PI) - Math.PI / 2 + (Math.random() - 0.5);
    const speed = Math.random() * 12 + 6;
    particles.push({
      x: width / 2,
      y: height * 0.45,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: Math.sin(angle) * speed - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }

  let animationId: number;
  const startTime = Date.now();
  const duration = 2500;

  function render() {
    if (!ctx) return;
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      cancelAnimationFrame(animationId);
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.vRot;
      p.opacity = Math.max(0, 1 - elapsed / duration);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    animationId = requestAnimationFrame(render);
  }

  animationId = requestAnimationFrame(render);
}
