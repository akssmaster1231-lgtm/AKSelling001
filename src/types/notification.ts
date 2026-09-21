export type NotificationType = 'NEW_CATALOG' | 'PRICE_DROP' | 'ORDER_UPDATE' | 'PROMO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  productId?: string;
  productTitle?: string;
  productPrice?: number;
  productImage?: string;
  category?: string;
  createdAt: string;
  read?: boolean;
  link?: string;
  senderName?: string;
}
