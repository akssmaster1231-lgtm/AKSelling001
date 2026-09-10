import type { VideoReel, Product } from '@/types';
import { videoReels as defaultReels } from '@/data';

const REELS_STORAGE_KEY = 'akselling_custom_video_reels';

// Sample curated royalty-free product video loops
export const SAMPLE_PRODUCT_VIDEOS = [
  {
    name: 'Fashion / Apparel Reel',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-posing-with-a-fashionable-look-41604-large.mp4',
    thumbnail: 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    name: 'Earbuds / Audio Showcase',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-pair-of-wireless-earbuds-42995-large.mp4',
    thumbnail: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    name: 'Footwear & Sneakers Loop',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-running-shoes-in-motion-42526-large.mp4',
    thumbnail: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    name: 'Smartwatch / Gadget Unboxing',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-smartwatch-on-a-mans-wrist-43403-large.mp4',
    thumbnail: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    name: 'Beauty & Cosmetics Glow',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-applying-makeup-with-a-brush-42998-large.mp4',
    thumbnail: 'https://images.pexels.com/photos/3018845/pexels-photo-3018845.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];

export function getCustomReels(): VideoReel[] {
  try {
    const raw = localStorage.getItem(REELS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }
  return [];
}

export function saveCustomReels(reels: VideoReel[]): void {
  try {
    localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(reels));
    window.dispatchEvent(new CustomEvent('akselling_reels_updated'));
  } catch (err) {
    console.warn('Error saving custom reels:', err);
  }
}

export function getAllReels(): VideoReel[] {
  const custom = getCustomReels();
  // Custom uploaded reels show at the top
  return [...custom, ...defaultReels];
}

export function addSellerReel(input: {
  title: string;
  description: string;
  product: Product;
  thumbnail: string;
  videoUrl?: string;
  sellerStoreName?: string;
}): VideoReel {
  const newReel: VideoReel = {
    id: `reel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: input.title.trim() || `${input.product.title} - Showcase`,
    description: input.description.trim() || `Explore ${input.product.title} on AKSelling #shopping #deals`,
    product: input.product,
    thumbnail: input.thumbnail || input.product.images[0] || 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg',
    videoUrl: input.videoUrl,
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
    sellerStoreName: input.sellerStoreName || 'AK Yadav Prints',
    createdAt: new Date().toISOString(),
    views: 0,
  };

  const current = getCustomReels();
  const updated = [newReel, ...current];
  saveCustomReels(updated);
  return newReel;
}

export function deleteSellerReel(reelId: string): void {
  const current = getCustomReels();
  const updated = current.filter(r => r.id !== reelId);
  saveCustomReels(updated);
}
