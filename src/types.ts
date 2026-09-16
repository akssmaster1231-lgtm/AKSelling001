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
  tags?: string[];
  keywords?: string[];
  selectedSize?: string;
  selectedColor?: string;
  pickupLocation?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  productType?: string;
  printDesign?: string;
  weightGsm?: string | number;
  shippingCharge?: number;
  isFreeShipping?: boolean;
  pickupAddress?: {
    businessName?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
  variants?: Array<{
    id?: string;
    size: string;
    color: string;
    sku: string;
    stock: number;
    price?: number;
  }>;
  storefrontPlacement?: {
    homepage?: boolean;
    categoryPages?: boolean;
    bestDeals?: boolean;
  };
}

export interface CartItem {
  id?: string;
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

export type OrderTrackingStepId = 'ordered' | 'shipped' | 'out_for_delivery' | 'delivered';

export interface OrderTrackingCheckpoint {
  id: string;
  stepId: OrderTrackingStepId;
  title: string;
  location: string;
  time: string;
  completed: boolean;
  active?: boolean;
}

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  initialPrice: number;
  currentPrice: number;
  targetPrice?: number;
  notifyEmail?: string;
  notifyPush?: boolean;
  notifyEmailPref?: boolean;
  fcmToken?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastNotifiedAt?: string;
}
