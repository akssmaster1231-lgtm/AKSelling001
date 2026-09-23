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
  product: {
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
    productId: '1',
    videoUrl: '/videos/reel_1.mp4',
    posterUrl: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=800',
    creatorName: 'Aman Sharma @stylewithaman',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    caption: 'Best 240 GSM Pure Cotton Oversized Tee for College & Outings! Fabric quality is insane 🔥 #OOTD #AKSelling',
    songTitle: 'Trending Beats • Urban Vibe',
    likesCount: 1420,
    commentsCount: 88,
    sharesCount: 312,
    tag: 'Oversized Tees',
    product: {
      id: '1',
      title: 'Dennis Lingo Men Slim Fit Cotton Shirt',
      brand: 'Dennis Lingo',
      price: 649,
      mrp: 1849,
      discount: 65,
      rating: 4.8,
      image: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=800',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Olive Green', 'Classic White', 'Jet Black'],
    },
  },
  {
    id: 'reel_2',
    productId: '2',
    videoUrl: '/videos/reel_2.mp4',
    posterUrl: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=800',
    creatorName: 'Rhea Kapoor @rhea_fits',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    caption: 'This Anarkali Kurta Set under ₹900 looks like designer wear! Pure breathable cotton ✨ #FestiveLook',
    songTitle: 'Desi Dhol Beats • AKSelling Drop',
    likesCount: 2840,
    commentsCount: 142,
    sharesCount: 620,
    tag: 'Ethnic Wear',
    product: {
      id: '2',
      title: 'Libas Women Floral Printed Pure Cotton Kurta Set',
      brand: 'Libas',
      price: 899,
      mrp: 2499,
      discount: 64,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=800',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Powder Blue', 'Peach Blossom', 'Mint Green'],
    },
  },
  {
    id: 'reel_3',
    productId: '3',
    videoUrl: '/videos/reel_3.mp4',
    posterUrl: 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&w=800',
    creatorName: 'Kabir Verma @kabir_drips',
    creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    caption: 'Heavyweight Fleece Winter Hoodie dropped today! Premium drawstrings and metal eyelets ⚡ #Streetwear',
    songTitle: 'Trap Synth 808 • Night Drips',
    likesCount: 3190,
    commentsCount: 215,
    sharesCount: 780,
    tag: 'Streetwear',
    product: {
      id: '3',
      title: 'Roadster Heavyweight Streetwear Fleece Hoodie',
      brand: 'Roadster',
      price: 799,
      mrp: 2199,
      discount: 63,
      rating: 4.7,
      image: 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&w=800',
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Smoke Grey', 'Obsidian Black', 'Desert Camel'],
    },
  },
  {
    id: 'reel_4',
    productId: '4',
    videoUrl: '/videos/reel_4.mp4',
    posterUrl: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800',
    creatorName: 'Vikram Patel @sneaker_guy',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    caption: 'Chunky Sole White Sneakers review! Super lightweight memory foam insole at just ₹899 👟',
    songTitle: 'Hip Hop Lo-fi • Step Up',
    likesCount: 1980,
    commentsCount: 94,
    sharesCount: 410,
    tag: 'Footwear',
    product: {
      id: '4',
      title: 'Red Tape Men Off-White Casual Walking Sneakers',
      brand: 'Red Tape',
      price: 899,
      mrp: 3499,
      discount: 74,
      rating: 4.6,
      image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800',
      sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
      colors: ['Chalk White', 'Ice Grey'],
    },
  },
];
