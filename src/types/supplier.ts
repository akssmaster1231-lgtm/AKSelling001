export interface SellerProduct {
  id: string;
  catalogId?: string;
  sku?: string;
  title: string;
  description: string;
  price: number;
  mrp: number;
  discount: number;
  category: string;
  subCategory?: string;
  images: string[];
  stock: number;
  brand: string;
  status: 'live' | 'draft' | 'out_of_stock';
  salesCount?: number;
  views?: number;
  rating?: number;
  sizes?: string[];
  colors?: string[];
  neckType?: string;
  sleeveType?: string;
  fitType?: string;
  fabric?: string;
  pattern?: string;
  occasion?: string;
  pickupLocation?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  gstRate?: number;
  hsnCode?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  sizeStock?: { size: string; stock: number; sku?: string }[];
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerCity: string;
  customerAddress?: string;
  customerPincode?: string;
  customerPhone?: string;
  pickupLocation?: string;
  courierName?: string;
  awbCode?: string;
  items: {
    title: string;
    quantity: number;
    price: number;
    image: string;
    sku?: string;
    size?: string;
    color?: string;
  }[];
  totalAmount: number;
  paymentMethod: string;
  status: 'pending' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  dispatchDeadline?: string;
  trackingId?: string;
}

export interface ReturnItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerCity: string;
  productTitle: string;
  productImage: string;
  sku: string;
  size?: string;
  returnType: 'customer_return' | 'rto_courier';
  reason: string;
  status: 'in_transit' | 'delivered_to_seller' | 'claim_approved' | 'claim_rejected' | 'claim_pending';
  trackingNumber: string;
  courierPartner: string;
  initiatedDate: string;
  refundAmount: number;
  claimId?: string;
}

export interface SPFClaim {
  id: string;
  returnId: string;
  orderNumber: string;
  productTitle: string;
  productImage: string;
  claimReason: string;
  claimedAmount: number;
  approvedAmount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'settled';
  submittedDate: string;
  proofImages: string[];
  remarks?: string;
}

export interface PayoutRecord {
  id: string;
  payoutDate: string;
  amount: number;
  status: 'processed' | 'upcoming' | 'processing';
  utrNumber?: string;
  ordersCount: number;
  deductions: number;
  bankAccount: string;
}

export type SupplierTab = 'home' | 'orders' | 'returns' | 'inventory' | 'menu';
