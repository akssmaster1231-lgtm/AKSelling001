/**
 * Preset Model Avatars for Virtual Try-On
 * High-fidelity SVG vector portraits allowing instant on-body preview
 * without requiring camera access or network downloads.
 */

export interface ModelAvatar {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'unisex';
  badge: string;
  dataUrl: string;
  defaultScale: number;
  defaultYOffset: number;
}

// 1. Male Streetwear Model Portrait
const MALE_MODEL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960" width="720" height="960">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d49a6a" />
      <stop offset="50%" stop-color="#c58652" />
      <stop offset="100%" stop-color="#a86e3d" />
    </linearGradient>
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Studio Background -->
  <rect width="720" height="960" fill="url(#bgGrad)" />
  <circle cx="360" cy="380" r="280" fill="#3b82f6" opacity="0.08" />

  <!-- Torso Base / Shoulders (Athletic V-Taper) -->
  <path d="M 140 960 L 140 520 Q 140 400 240 340 L 300 320 Q 360 340 420 320 L 480 340 Q 580 400 580 520 L 580 960 Z" fill="url(#skinGrad)" filter="url(#shadow)" />

  <!-- Neck -->
  <path d="M 310 260 L 310 330 Q 360 350 410 330 L 410 260 Z" fill="url(#skinGrad)" />
  <path d="M 330 310 Q 360 325 390 310" stroke="#8b572a" stroke-width="3" fill="none" opacity="0.6" />

  <!-- Head & Jawline -->
  <ellipse cx="360" cy="210" rx="90" ry="110" fill="url(#skinGrad)" filter="url(#shadow)" />
  <!-- Hair / Fade Cut -->
  <path d="M 270 190 Q 270 90 360 85 Q 450 90 450 190 Q 420 140 360 135 Q 300 140 270 190 Z" fill="url(#hairGrad)" />
  <path d="M 265 190 Q 260 230 275 250 Q 280 200 290 180 Z" fill="url(#hairGrad)" />
  <path d="M 455 190 Q 460 230 445 250 Q 440 200 430 180 Z" fill="url(#hairGrad)" />

  <!-- Minimal Facial Proportions -->
  <!-- Eyebrows -->
  <path d="M 305 180 Q 330 172 345 180" stroke="#18181b" stroke-width="5" stroke-linecap="round" fill="none" />
  <path d="M 375 180 Q 390 172 415 180" stroke="#18181b" stroke-width="5" stroke-linecap="round" fill="none" />
  <!-- Eyes -->
  <ellipse cx="325" cy="195" rx="10" ry="6" fill="#18181b" />
  <ellipse cx="395" cy="195" rx="10" ry="6" fill="#18181b" />
  <!-- Nose -->
  <path d="M 360 190 L 355 225 Q 360 230 368 225" stroke="#8b572a" stroke-width="3.5" stroke-linecap="round" fill="none" />
  <!-- Confident Smile -->
  <path d="M 335 255 Q 360 270 385 255" stroke="#713f12" stroke-width="4" stroke-linecap="round" fill="none" />

  <!-- Collarbones & Pec Contours -->
  <path d="M 240 360 Q 300 375 350 360" stroke="#8b572a" stroke-width="3.5" fill="none" opacity="0.4" />
  <path d="M 480 360 Q 420 375 370 360" stroke="#8b572a" stroke-width="3.5" fill="none" opacity="0.4" />
  <path d="M 280 440 Q 360 460 440 440" stroke="#8b572a" stroke-width="3" fill="none" opacity="0.3" />

  <!-- Studio Rim Light -->
  <circle cx="680" cy="120" r="4" fill="#ffffff" opacity="0.4" />
  <text x="360" y="920" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" fill="#64748b" text-anchor="middle" letter-spacing="2">
    AKSELLING AI FIT STUDIO • MALE ATHLETIC POSE
  </text>
</svg>
`.trim();

// 2. Female Aesthetic Drop-Shoulder Model Portrait
const FEMALE_MODEL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960" width="720" height="960">
  <defs>
    <linearGradient id="femBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#31103f" />
      <stop offset="50%" stop-color="#1a0b2e" />
      <stop offset="100%" stop-color="#0a0518" />
    </linearGradient>
    <linearGradient id="femSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f2be9b" />
      <stop offset="50%" stop-color="#e3a77f" />
      <stop offset="100%" stop-color="#c9895e" />
    </linearGradient>
    <linearGradient id="femHairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#261815" />
      <stop offset="100%" stop-color="#120a08" />
    </linearGradient>
    <filter id="femShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Studio Background -->
  <rect width="720" height="960" fill="url(#femBgGrad)" />
  <circle cx="360" cy="380" r="260" fill="#ec4899" opacity="0.08" />

  <!-- Long Flowing Hair (Back layer) -->
  <path d="M 230 200 Q 180 380 200 620 Q 260 640 270 540 L 260 300 Z" fill="url(#femHairGrad)" />
  <path d="M 490 200 Q 540 380 520 620 Q 460 640 450 540 L 460 300 Z" fill="url(#femHairGrad)" />

  <!-- Shoulders & Torso -->
  <path d="M 160 960 L 160 520 Q 170 410 260 350 L 320 330 Q 360 345 400 330 L 460 350 Q 550 410 560 520 L 560 960 Z" fill="url(#femSkinGrad)" filter="url(#femShadow)" />

  <!-- Neck -->
  <path d="M 325 260 L 325 330 Q 360 345 395 330 L 395 260 Z" fill="url(#femSkinGrad)" />
  <!-- Dainty Necklace -->
  <path d="M 335 320 Q 360 338 385 320" stroke="#f59e0b" stroke-width="2.5" fill="none" />
  <circle cx="360" cy="336" r="3.5" fill="#f59e0b" />

  <!-- Head & Jawline -->
  <ellipse cx="360" cy="205" rx="80" ry="100" fill="url(#femSkinGrad)" filter="url(#femShadow)" />

  <!-- Hair (Front layer & Bangs) -->
  <path d="M 270 190 Q 275 80 360 75 Q 445 80 450 190 Q 410 130 360 130 Q 310 130 270 190 Z" fill="url(#femHairGrad)" />

  <!-- Face details -->
  <!-- Brows -->
  <path d="M 310 180 Q 330 170 345 178" stroke="#261815" stroke-width="3.5" stroke-linecap="round" fill="none" />
  <path d="M 375 178 Q 390 170 410 180" stroke="#261815" stroke-width="3.5" stroke-linecap="round" fill="none" />
  <!-- Winged Eyeliner Eyes -->
  <path d="M 315 192 Q 330 186 345 194" stroke="#18181b" stroke-width="4" fill="none" />
  <circle cx="330" cy="193" r="5" fill="#18181b" />
  <path d="M 375 194 Q 390 186 405 192" stroke="#18181b" stroke-width="4" fill="none" />
  <circle cx="390" cy="193" r="5" fill="#18181b" />
  <!-- Nose -->
  <path d="M 360 190 L 357 218 Q 360 222 366 218" stroke="#a36338" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <!-- Rosy Lips -->
  <path d="M 340 248 Q 360 242 380 248 Q 360 262 340 248 Z" fill="#e11d48" opacity="0.85" />

  <!-- Delicate Collarbones -->
  <path d="M 260 360 Q 310 370 348 358" stroke="#a36338" stroke-width="2.5" fill="none" opacity="0.4" />
  <path d="M 460 360 Q 410 370 372 358" stroke="#a36338" stroke-width="2.5" fill="none" opacity="0.4" />

  <text x="360" y="920" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="2">
    AKSELLING AI FIT STUDIO • FEMALE AESTHETIC POSE
  </text>
</svg>
`.trim();

// 3. Unisex Studio Mannequin Display
const MANNEQUIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960" width="720" height="960">
  <defs>
    <linearGradient id="manBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1e24" />
      <stop offset="100%" stop-color="#0d0d11" />
    </linearGradient>
    <linearGradient id="linenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0" />
      <stop offset="50%" stop-color="#cbd5e1" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>
    <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#78350f" />
      <stop offset="50%" stop-color="#92400e" />
      <stop offset="100%" stop-color="#451a03" />
    </linearGradient>
  </defs>

  <rect width="720" height="960" fill="url(#manBg)" />
  <circle cx="360" cy="400" r="260" fill="#64748b" opacity="0.06" />

  <!-- Wooden Neck Top Cap -->
  <ellipse cx="360" cy="230" rx="42" ry="16" fill="url(#woodGrad)" />
  <ellipse cx="360" cy="225" rx="36" ry="12" fill="#b45309" />
  <cylinder />

  <!-- Tailor Torso Body -->
  <path d="M 170 960 L 180 500 Q 185 380 270 300 L 325 245 L 395 245 L 450 300 Q 535 380 540 500 L 550 960 Z" fill="url(#linenGrad)" />

  <!-- Tailor Seam Stitch Lines -->
  <path d="M 360 245 L 360 960" stroke="#64748b" stroke-width="2.5" stroke-dasharray="6,6" opacity="0.6" />
  <path d="M 230 460 Q 360 500 490 460" stroke="#64748b" stroke-width="2" stroke-dasharray="4,4" opacity="0.4" />
  <path d="M 210 660 Q 360 700 510 660" stroke="#64748b" stroke-width="2" stroke-dasharray="4,4" opacity="0.4" />

  <!-- Cast Iron Stand Pole -->
  <rect x="345" y="860" width="30" height="100" fill="#334155" />

  <text x="360" y="920" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" fill="#64748b" text-anchor="middle" letter-spacing="2">
    AKSELLING AI FIT STUDIO • TAILOR DRESS FORM
  </text>
</svg>
`.trim();

export const PRESET_MODEL_AVATARS: ModelAvatar[] = [
  {
    id: 'model_male',
    name: 'Rohit (Athletic Streetwear)',
    gender: 'male',
    badge: '🏋️ MALE ATHLETIC',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(MALE_MODEL_SVG)}`,
    defaultScale: 104,
    defaultYOffset: 41,
  },
  {
    id: 'model_female',
    name: 'Priya (Aesthetic Drop-Shoulder)',
    gender: 'female',
    badge: '✨ FEMALE OVERSIZED',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(FEMALE_MODEL_SVG)}`,
    defaultScale: 100,
    defaultYOffset: 43,
  },
  {
    id: 'model_mannequin',
    name: 'Studio Dress Form (Mannequin)',
    gender: 'unisex',
    badge: '🏛️ STUDIO FORM',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(MANNEQUIN_SVG)}`,
    defaultScale: 98,
    defaultYOffset: 42,
  },
];
