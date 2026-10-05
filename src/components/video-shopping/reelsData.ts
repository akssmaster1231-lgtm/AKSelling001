export interface VideoReelItem {
  id: string;
  productId: string;
  videoUrl: string;
  posterUrl: string;
  creatorName: string;
  creatorAvatar: string;
  caption: string;
  songTitle: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  tag: string;
  audioEnabled?: boolean;
  product?: {
    id: string;
    title: string;
    brand: string;
    price: number;
    mrp: number;
    discount: number;
    rating: number;
    image: string;
    sizes: string[];
    colors: string[];
  };
}

export const FASHION_REELS: VideoReelItem[] = [
  {
    id: 'reel_1',
    productId: 'AKY-01',
    videoUrl: '/videos/reel_1.mp4',
    posterUrl: '/uploads/prod_AKY-01_0.jpg',
    creatorName: 'Aman Sharma @stylewithaman',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    caption: 'Best 240 GSM Pure Cotton Oversized Tee for College & Outings! Fabric quality is insane 🔥 #OOTD #AKSelling',
    songTitle: 'Trending Beats • Urban Vibe',
    likesCount: 1420,
    commentsCount: 88,
    sharesCount: 312,
    tag: 'Oversized Tees',
    product: {
      id: 'AKY-01',
      title: 'Heavy Duty Oversized Black T-Shirt | Built For The Long Run',
      brand: 'AKSelling',
      price: 499,
      mrp: 999,
      discount: 50,
      rating: 4.9,
      image: '/uploads/prod_AKY-01_0.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Jet Black'],
    },
  },
  {
    id: 'reel_2',
    productId: 'AKY-TTP-WHT-05',
    videoUrl: '/videos/reel_2.mp4',
    posterUrl: '/uploads/prod_AKY-TTP-WHT-05_0.jpg',
    creatorName: 'Rhea Kapoor @rhea_fits',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    caption: 'Pure 180 GSM Bio-Wash Combed Cotton White Tee! Zero shrinkage and so soft ✨ #AKSelling',
    songTitle: 'Desi Dhol Beats • AKSelling Drop',
    likesCount: 2840,
    commentsCount: 142,
    sharesCount: 620,
    tag: 'Cotton Tees',
    product: {
      id: 'AKY-TTP-WHT-05',
      title: 'AKY Trust The Process Premium Cotton Oversized T-Shirt (White)',
      brand: 'AKSelling',
      price: 399,
      mrp: 999,
      discount: 60,
      rating: 4.9,
      image: '/uploads/prod_AKY-TTP-WHT-05_0.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Classic White'],
    },
  },
  {
    id: 'reel_3',
    productId: 'AKY-CZX-BLK-03',
    videoUrl: '/videos/reel_3.mp4',
    posterUrl: '/uploads/prod_AKY-CZX-BLK-03_0.jpg',
    creatorName: 'Kabir Verma @kabir_drips',
    creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    caption: 'Cyber ZX Future Is Built Oversized Tee! High definition durable DTF graphics ⚡ #Streetwear',
    songTitle: 'Trap Synth 808 • Night Drips',
    likesCount: 3190,
    commentsCount: 215,
    sharesCount: 780,
    tag: 'Streetwear',
    product: {
      id: 'AKY-CZX-BLK-03',
      title: 'AKY Cyber ZX Future Is Built Premium Cotton Oversized T-Shirt (Black)',
      brand: 'AKSelling',
      price: 449,
      mrp: 999,
      discount: 55,
      rating: 4.8,
      image: '/uploads/prod_AKY-CZX-BLK-03_0.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black'],
    },
  },
  {
    id: 'reel_4',
    productId: 'AKY-FF-NVY-01',
    videoUrl: '/videos/reel_4.mp4',
    posterUrl: '/uploads/prod_AKY-FF-NVY-01_0.jpg',
    creatorName: 'Vikram Patel @sneaker_guy',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    caption: 'Focused & Fearless Navy Blue Drop Shoulder Tee! Pure combed cotton factory direct 🔥',
    songTitle: 'Hip Hop Lo-fi • Step Up',
    likesCount: 1980,
    commentsCount: 94,
    sharesCount: 410,
    tag: 'Drop Shoulder',
    product: {
      id: 'AKY-FF-NVY-01',
      title: 'AKY Focused & Fearless Premium Cotton Oversized T-Shirt (Navy Blue)',
      brand: 'AKSelling',
      price: 499,
      mrp: 999,
      discount: 50,
      rating: 4.8,
      image: '/uploads/prod_AKY-FF-NVY-01_0.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Navy Blue'],
    },
  },
];
