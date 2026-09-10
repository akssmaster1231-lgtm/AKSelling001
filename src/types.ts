export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  mrp: number;
  discount: number;
  category: string;
  images: string[];
  rating: number;
  ratingCount: number;
  brand: string;
  inStock: boolean;
  delivery: string;
  sizes?: string[];
  colors?: string[];
  neckType?: string;
  sleeveType?: string;
  fitType?: string;
  fabric?: string;
  selectedSize?: string;
  selectedColor?: string;
  pickupLocation?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
}

export interface CartItem {
  product: Product;
  quantity: number;
  savedForLater: boolean;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface VideoReel {
  id: string;
  title: string;
  product?: Product;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  thumbnail: string;
  description: string;
  videoUrl?: string;
  sellerStoreName?: string;
  sellerId?: string;
  createdAt?: string;
  views?: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  gradient: string;
}
