export interface FontDefinition {
  id: string;
  name: string;
  fontFamily: string;
  category: 'cursive' | 'streetwear' | 'retro' | 'luxury' | 'athletic' | 'minimal';
  sampleText: string;
  designerTip: string;
  isPopular?: boolean;
}

export interface ApparelColor {
  id: string;
  name: string;
  hex: string;
  tshirtHex: string;
  contrastTextHex: string;
}

export interface GraphicTemplate {
  id: string;
  name: string;
  category: string;
  defaultText: string;
  subText?: string;
  prefixSymbol?: string;
  suffixSymbol?: string;
  svgDecorTop?: string;
  svgDecorBottom?: string;
  recommendedFontId: string;
}

export const APPAREL_COLORS: ApparelColor[] = [
  { id: 'black', name: 'Jet Black (180 GSM)', hex: '#111827', tshirtHex: '#18181b', contrastTextHex: '#FFFFFF' },
  { id: 'white', name: 'Pure White (180 GSM)', hex: '#F9FAFB', tshirtHex: '#f4f4f5', contrastTextHex: '#18181b' },
  { id: 'navy', name: 'Midnight Navy', hex: '#1e293b', tshirtHex: '#1e293b', contrastTextHex: '#FBBF24' },
  { id: 'charcoal', name: 'Heather Charcoal', hex: '#374151', tshirtHex: '#334155', contrastTextHex: '#F8FAFC' },
  { id: 'olive', name: 'Military Olive', hex: '#3f4f34', tshirtHex: '#3f4f34', contrastTextHex: '#FEF08A' },
  { id: 'maroon', name: 'Deep Burgundy', hex: '#581c24', tshirtHex: '#581c24', contrastTextHex: '#FDE047' },
  { id: 'lavender', name: 'Street Lavender', hex: '#7c6da8', tshirtHex: '#7c6da8', contrastTextHex: '#FFFFFF' },
  { id: 'sand', name: 'Oversized Sand/Khaki', hex: '#c5b497', tshirtHex: '#c5b497', contrastTextHex: '#1C1917' },
];

export const PRINT_PALETTE = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Onyx Black', hex: '#111111' },
  { name: 'Metallic Gold', hex: '#EAB308' },
  { name: 'Cyber Neon Green', hex: '#22C55E' },
  { name: 'Crimson Flame', hex: '#EF4444' },
  { name: 'Vibrant Orange', hex: '#F97316' },
  { name: 'Sky Cyan', hex: '#06B6D4' },
  { name: 'Royal Violet', hex: '#8B5CF6' },
  { name: 'Bubblegum Pink', hex: '#EC4899' },
  { name: 'Pastel Yellow', hex: '#FDE047' },
  { name: 'Cool Silver', hex: '#94A3B8' },
  { name: 'Rose Gold', hex: '#F472B6' },
];

export const FONT_COLLECTION: FontDefinition[] = [
  // --- 1. CURSIVE, CALLIGRAPHY & SIGNATURE (12 Fonts) ---
  { id: 'pacifico', name: 'Pacifico Beach', fontFamily: "'Pacifico', cursive", category: 'cursive', sampleText: 'Signature', designerTip: 'Iconic relaxed coastal cursive, ideal for names & travel quotes.', isPopular: true },
  { id: 'great_vibes', name: 'Great Vibes Luxe', fontFamily: "'Great Vibes', cursive", category: 'cursive', sampleText: 'Royal Elegance', designerTip: 'High-flair wedding & luxury signature script.', isPopular: true },
  { id: 'dancing_script', name: 'Dancing Script', fontFamily: "'Dancing Script', cursive", category: 'cursive', sampleText: 'Free Spirit', designerTip: 'Bouncy, expressive brush script with natural rhythm.' },
  { id: 'sacramento', name: 'Sacramento Delicate', fontFamily: "'Sacramento', cursive", category: 'cursive', sampleText: 'Handwritten', designerTip: 'Monoline clean vintage signature style.' },
  { id: 'alex_brush', name: 'Alex Brush Flow', fontFamily: "'Alex Brush', cursive", category: 'cursive', sampleText: 'Customized', designerTip: 'Smooth brush pen calligraphy for chest signatures.' },
  { id: 'caveat', name: 'Caveat Casual', fontFamily: "'Caveat', cursive", category: 'cursive', sampleText: 'Authentic', designerTip: 'Natural marker handwriting, trending on oversized drop tees.' },
  { id: 'satisfy', name: 'Satisfy Brush', fontFamily: "'Satisfy', cursive", category: 'cursive', sampleText: 'Unstoppable', designerTip: 'Bold fluid cursive with upright energy.' },
  { id: 'allura', name: 'Allura Script', fontFamily: "'Allura', cursive", category: 'cursive', sampleText: 'Aesthetic', designerTip: 'Ultra-refined script for minimalist left-chest prints.' },
  { id: 'kaushan_script', name: 'Kaushan Dry Brush', fontFamily: "'Kaushan Script', cursive", category: 'cursive', sampleText: 'Raw Energy', designerTip: 'Dry brush strokes for authentic handmade street apparel.' },
  { id: 'parisienne', name: 'Parisienne Chic', fontFamily: "'Parisienne', cursive", category: 'cursive', sampleText: 'Haute Couture', designerTip: 'French fashion editorial cursive typography.' },
  { id: 'yellowtail', name: 'Yellowtail Retro', fontFamily: "'Yellowtail', cursive", category: 'cursive', sampleText: 'Speedway', designerTip: 'Flat-brush cafe and diner script with heavy presence.' },
  { id: 'bad_script', name: 'Bad Script Notes', fontFamily: "'Bad Script', cursive", category: 'cursive', sampleText: 'Wild Hearts', designerTip: 'Edgy raw penmanship for alternative fashion.' },

  // --- 2. STREETWEAR, URBAN & GOTHIC (12 Fonts) ---
  { id: 'bebas_neue', name: 'Bebas Heavy Bold', fontFamily: "'Bebas Neue', sans-serif", category: 'streetwear', sampleText: 'STREET LUXE', designerTip: 'The #1 heavyweight condensed font for streetwear brand titles.', isPopular: true },
  { id: 'anton', name: 'Anton Block Impact', fontFamily: "'Anton', sans-serif", category: 'streetwear', sampleText: 'OVERSIZED', designerTip: 'Ultra-dense grotesque sans that maximizes DTF chest coverage.', isPopular: true },
  { id: 'russo_one', name: 'Russo Military', fontFamily: "'Russo One', sans-serif", category: 'streetwear', sampleText: 'TACTICAL', designerTip: 'Modern constructivist geometric bold typography.' },
  { id: 'bungee', name: 'Bungee Vertical Block', fontFamily: "'Bungee', sans-serif", category: 'streetwear', sampleText: 'TOKYO 99', designerTip: 'All-caps urban sign-maker font with industrial attitude.' },
  { id: 'black_ops_one', name: 'Black Ops Stencil', fontFamily: "'Black Ops One', cursive", category: 'streetwear', sampleText: 'SPECIAL FORCES', designerTip: 'Military tactical stencil for grunge & utility fashion.' },
  { id: 'orbitron', name: 'Orbitron Cyber Tech', fontFamily: "'Orbitron', sans-serif", category: 'streetwear', sampleText: 'CYBERPUNK', designerTip: 'Futuristic sci-fi display font for high-tech graphic tees.' },
  { id: 'audiowide', name: 'Audiowide Synth', fontFamily: "'Audiowide', cursive", category: 'streetwear', sampleText: 'SYNTHWAVE', designerTip: 'Y2K techno typography with curved corner cuts.' },
  { id: 'faster_one', name: 'Faster Drag Race', fontFamily: "'Faster One', cursive", category: 'streetwear', sampleText: 'SPEED DEMON', designerTip: 'Horizontal velocity lines for motorsport & drift tees.' },
  { id: 'permanent_marker', name: 'Permanent Marker Tag', fontFamily: "'Permanent Marker', cursive", category: 'streetwear', sampleText: 'NO APOLOGIES', designerTip: 'Authentic graffiti subway tag marker pen.' },
  { id: 'special_elite', name: 'Special Elite Typewriter', fontFamily: "'Special Elite', cursive", category: 'streetwear', sampleText: 'EVIDENCE 001', designerTip: 'Gritty ink-splattered vintage typewriter keys.' },
  { id: 'press_start_2p', name: '8-Bit Arcade Pixel', fontFamily: "'Press Start 2P', monospace", category: 'streetwear', sampleText: 'GAME OVER', designerTip: 'Nostalgic retro gaming pixel art for arcade drops.' },
  { id: 'impact_gothic', name: 'Gothic Old English', fontFamily: "'UnifrakturMaguntia', 'Cinzel', serif", category: 'streetwear', sampleText: 'CHOPPER SOUL', designerTip: 'Dark medieval blackletter for heavyweight back prints.' },

  // --- 3. RETRO & VINTAGE (10 Fonts) ---
  { id: 'lobster', name: 'Lobster Classic 70s', fontFamily: "'Lobster', cursive", category: 'retro', sampleText: 'Vintage Soul', designerTip: 'Beloved bold retro script for surf, automotive & cafe tees.', isPopular: true },
  { id: 'righteous', name: 'Righteous Disco 80s', fontFamily: "'Righteous', cursive", category: 'retro', sampleText: 'RETRO WAVE', designerTip: 'Deco-inspired bold geometry for synthwave aesthetics.' },
  { id: 'monoton', name: 'Monoton Multi-Line', fontFamily: "'Monoton', cursive", category: 'retro', sampleText: 'DISCOTHEQUE', designerTip: 'Striking multi-line neon typography, mesmerizing on black tees.' },
  { id: 'shrikhand', name: 'Shrikhand Bombay Retro', fontFamily: "'Shrikhand', cursive", category: 'retro', sampleText: 'MASALA GROOVE', designerTip: 'Vibrant hand-painted signage font inspired by Indian street typography.' },
  { id: 'bangers', name: 'Bangers Comic Pop', fontFamily: "'Bangers', cursive", category: 'retro', sampleText: 'POW! BOOM!', designerTip: 'Mid-century superhero comic book dialogue lettering.' },
  { id: 'rye', name: 'Rye Wild West', fontFamily: "'Rye', serif", category: 'retro', sampleText: 'OUTLAW 1888', designerTip: 'Spurred Western saloon typography with rodeo flair.' },
  { id: 'vast_shadow', name: 'Vast Shadow Poster', fontFamily: "'Vast Shadow', serif", category: 'retro', sampleText: 'CIRCUS ROYALE', designerTip: 'Victorian wood-type block with built-in drop shadow.' },
  { id: 'abril_fatface', name: 'Abril Fatface Vogue', fontFamily: "'Abril Fatface', serif", category: 'retro', sampleText: 'VOGUE MEMORIES', designerTip: 'Extreme contrast Didone display font with glamorous curls.' },
  { id: 'fredoka', name: 'Fredoka Bubble Modern', fontFamily: "'Fredoka One', 'Righteous', sans-serif", category: 'retro', sampleText: 'GOOD VIBES', designerTip: 'Warm rounded bubbly typeface for playful streetwear.' },
  { id: 'creepster', name: 'Creepster Horror Grunge', fontFamily: "'Creepster', cursive", category: 'retro', sampleText: 'NIGHTMARE', designerTip: 'Slime & bone dripping horror font for Halloween & gothic tees.' },

  // --- 4. LUXURY, ROYAL & HIGH-FASHION SERIF (8 Fonts) ---
  { id: 'playfair', name: 'Playfair Display Serif', fontFamily: "'Playfair Display', serif", category: 'luxury', sampleText: 'ESTABLISHED 1998', designerTip: 'High-editorial Roman serif seen on luxury Paris & Milan apparel.', isPopular: true },
  { id: 'cinzel', name: 'Cinzel Roman Imperial', fontFamily: "'Cinzel', serif", category: 'luxury', sampleText: 'IMPERIAL LEGACY', designerTip: 'Classical Roman stone-carved inscriptions with majestic dignity.' },
  { id: 'cormorant', name: 'Cormorant Garamond', fontFamily: "'Cormorant Garamond', serif", category: 'luxury', sampleText: 'Monogram Atelier', designerTip: 'Ultra-thin elegant serifs for quiet luxury minimalist embroidery.' },
  { id: 'dm_serif', name: 'DM Serif Heavy Editorial', fontFamily: "'DM Serif Display', serif", category: 'luxury', sampleText: 'HARPERS ARCHIVE', designerTip: 'Weighty contrast serif for front magazine-cover style layouts.' },
  { id: 'prata', name: 'Prata Chic Didone', fontFamily: "'Prata', serif", category: 'luxury', sampleText: 'L’AMOUR FOREVER', designerTip: 'Teardrop terminals and high contrast for aesthetic French typography.' },
  { id: 'bodoni', name: 'Bodoni Moda Bold', fontFamily: "'Bodoni Moda', serif", category: 'luxury', sampleText: 'MILANO LUXE', designerTip: 'The definitive haute-couture fashion masthead typeface.' },
  { id: 'marcellus', name: 'Marcellus Classical', fontFamily: "'Marcellus', serif", category: 'luxury', sampleText: 'VALHALLA', designerTip: 'Roman proportioned flared serif with regal subtlety.' },
  { id: 'forum', name: 'Forum Roman Antique', fontFamily: "'Forum', serif", category: 'luxury', sampleText: 'PANTHEON', designerTip: 'Antiquarian Roman capitals with timeless architectural poise.' },

  // --- 5. ATHLETIC, VARSITY & COLLEGIATE (4 Fonts) ---
  { id: 'varsity_block', name: 'Varsity Collegiate Block', fontFamily: "'Alfa Slab One', sans-serif", category: 'athletic', sampleText: 'CHAMPIONS 88', designerTip: 'Classic American college football block slab with heavy power.', isPopular: true },
  { id: 'bungee_shade', name: 'Bungee 3D Shade', fontFamily: "'Bungee Shade', cursive", category: 'athletic', sampleText: 'ALL-STAR', designerTip: 'Inherent 3D extrusion effect that saves DTF color separations.' },
  { id: 'graduate', name: 'Graduate Campus League', fontFamily: "'Graduate', 'Alfa Slab One', serif", category: 'athletic', sampleText: 'STATE ATHLETICS', designerTip: 'Crisp collegiate octagonal slab for baseball & basketball uniforms.' },
  { id: 'changa_one', name: 'Changa Heavy League', fontFamily: "'Changa One', sans-serif", category: 'athletic', sampleText: 'TEAM CAPTAIN', designerTip: 'Thick chunky block numbers and short uppercase words.' },

  // --- 6. MINIMALIST, SWISS & CONTEMPORARY (6 Fonts) ---
  { id: 'montserrat_extrabold', name: 'Montserrat ExtraBold', fontFamily: "'Montserrat', sans-serif", category: 'minimal', sampleText: 'METROPOLIS', designerTip: 'The king of modern geometric clean prints, razor sharp at 300 DPI.', isPopular: true },
  { id: 'oswald_bold', name: 'Oswald Condensed', fontFamily: "'Oswald', sans-serif", category: 'minimal', sampleText: 'MINIMAL STATEMENT', designerTip: 'Tall, space-efficient condensed sans for vertical sleeve & spine prints.' },
  { id: 'space_grotesk', name: 'Space Grotesk Tech', fontFamily: "'Space Grotesk', sans-serif", category: 'minimal', sampleText: 'SYSTEM ARCHIVE', designerTip: 'Neo-grotesque with monospace quirks for developer & startup swag.' },
  { id: 'syne', name: 'Syne Avant-Garde', fontFamily: "'Syne', sans-serif", category: 'minimal', sampleText: 'AVANT GARDE', designerTip: 'Exaggerated wide letterforms popular on European runway merch.' },
  { id: 'poppins_bold', name: 'Poppins Bold Geometric', fontFamily: "'Poppins', sans-serif", category: 'minimal', sampleText: 'PURE COMEDIC', designerTip: 'Friendly circular geometric letters with high visual clarity.' },
  { id: 'inter_heavy', name: 'Inter Heavy UI', fontFamily: "'Inter', sans-serif", category: 'minimal', sampleText: 'INTERFACE DESIGN', designerTip: 'Ultra-refined Swiss precision, flawless on monochrome micro-prints.' },
];

export const GRAPHIC_TEMPLATES: GraphicTemplate[] = [
  {
    id: 'varsity_heritage',
    name: 'Varsity Heritage Arch',
    category: 'Athletic',
    defaultText: 'MICHIGAN',
    subText: '1998 ATHLETICS',
    recommendedFontId: 'bebas_neue',
    svgDecorTop: '★ ★ ★',
    svgDecorBottom: 'DIVISION ONE CHAMPIONS',
  },
  {
    id: 'tokyo_drift',
    name: 'Tokyo Cyberpunk Katakana',
    category: 'Streetwear',
    defaultText: 'TOKYO 99',
    subText: 'SHIBUYA DISTRICT • 東京',
    recommendedFontId: 'bungee',
    svgDecorTop: '/// SYSTEM READY ///',
    svgDecorBottom: '03-5456-5111 • TOKYO SPEED LAB',
  },
  {
    id: 'royal_signature',
    name: 'Royal Signature Monogram',
    category: 'Luxury',
    defaultText: 'Alexander',
    subText: 'COUTURE ATELIER',
    recommendedFontId: 'great_vibes',
    svgDecorTop: '♛',
    svgDecorBottom: '— MILANO • PARIS • LONDON —',
  },
  {
    id: 'barcode_aesthetic',
    name: 'Industrial Barcode Spec',
    category: 'Minimal',
    defaultText: 'HUMAN ERROR',
    subText: 'SERIAL NO: 4902-8819-AKY',
    recommendedFontId: 'anton',
    svgDecorTop: '||||| ||||||| ||| |||||||||||',
    svgDecorBottom: '100% COMBED BIO-WASH COTTON',
  },
  {
    id: 'coastal_surf',
    name: 'Pacific Surf & Sunset',
    category: 'Retro',
    defaultText: 'Malibu Club',
    subText: 'CALIFORNIA DREAMING',
    recommendedFontId: 'pacifico',
    svgDecorTop: '☼ SURF WAVES & PALMS ☼',
    svgDecorBottom: 'ESTABLISHED NINETEEN SEVENTY',
  },
  {
    id: 'gothic_rock',
    name: 'Heavy Metal Outlaw',
    category: 'Gothic',
    defaultText: 'IMMORTAL',
    subText: 'NO APOLOGIES • WORLD TOUR',
    recommendedFontId: 'black_ops_one',
    svgDecorTop: '☠ REBEL SOULS ☠',
    svgDecorBottom: 'HEAVYWEIGHT 240 GSM COTTON',
  },
];
