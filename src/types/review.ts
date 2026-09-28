export interface ProductReview {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  photos: string[]; // Permanent URLs of buyer uploaded apparel photos
  verifiedPurchase: boolean;
  helpfulCount: number;
  sizePurchased?: string;
  createdAt: string;
}
