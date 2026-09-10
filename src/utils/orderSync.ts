import type { SellerOrder } from '@/types/supplier';
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from './storageHelper';

export interface CustomerOrderItem {
  product_id: string;
  product_title: string;
  product_image: string;
  quantity: number;
  price: number;
  sku?: string;
  size?: string;
  color?: string;
}

export interface CustomerPlacedOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: CustomerOrderItem[];
  total_amount: number;
  payment_method?: string;
  status: string;
  created_at: string;
}

/**
 * Places an order synchronously into customer local orders AND pushes
 * it as a pending order in the Supplier Hub so the seller receives live orders.
 */
export function recordPlacedOrder(order: CustomerPlacedOrder): void {
  try {
    // 1. Record to customer local orders list
    const customerOrdersRaw = safeLocalStorageGetItem('akselling_local_orders') || '[]';
    let customerOrders: CustomerPlacedOrder[] = [];
    try {
      customerOrders = JSON.parse(customerOrdersRaw);
      if (!Array.isArray(customerOrders)) customerOrders = [];
    } catch {
      customerOrders = [];
    }
    customerOrders.unshift(order);
    safeLocalStorageSetItem('akselling_local_orders', JSON.stringify(customerOrders));

    // 2. Convert to SellerOrder for Supplier Hub
    const sellerOrder: SellerOrder = {
      id: order.id,
      orderNumber: order.id.startsWith('ORD-') ? order.id : `ORD-${order.id.slice(-6).toUpperCase()}`,
      customerName: order.customer_name || 'Customer',
      customerCity: order.customer_address?.split(',').slice(-2, -1)[0]?.trim() || 'New Delhi',
      customerAddress: order.customer_address,
      customerPhone: order.customer_phone,
      customerPincode: order.customer_address?.match(/\b\d{6}\b/)?.[0] || '110001',
      items: order.items.map(item => ({
        title: item.product_title,
        quantity: item.quantity,
        price: item.price,
        image: item.product_image,
        sku: item.sku || `AK-${item.product_id.slice(0, 8).toUpperCase()}`,
        size: item.size,
        color: item.color,
      })),
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method || 'Prepaid (UPI / Card)',
      status: 'pending',
      orderDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      dispatchDeadline: 'Within 24 Hours (NDD)',
    };

    const supplierOrdersRaw = safeLocalStorageGetItem('akselling_supplier_orders') || '[]';
    let supplierOrders: SellerOrder[] = [];
    try {
      supplierOrders = JSON.parse(supplierOrdersRaw);
      if (!Array.isArray(supplierOrders)) supplierOrders = [];
    } catch {
      supplierOrders = [];
    }
    supplierOrders.unshift(sellerOrder);
    safeLocalStorageSetItem('akselling_supplier_orders', JSON.stringify(supplierOrders));

    // 3. Dispatch global cross-tab event
    window.dispatchEvent(new CustomEvent('akselling_orders_updated', { detail: sellerOrder }));
  } catch (err) {
    console.error('Error synchronizing customer order to supplier hub:', err);
  }
}

export interface DynamicProductRating {
  rating: number;
  ratingCount: number;
  formattedRating: string;
}

/**
 * Calculates a dynamic rating starting at 0.00 for new items and growing proportionally
 * with business volume, placed orders, and verified customer reviews.
 */
export function calculateProductDynamicRating(product?: {
  id?: string;
  rating?: number;
  ratingCount?: number;
  views?: number;
}): DynamicProductRating {
  if (!product || !product.id) {
    return { rating: 0.0, ratingCount: 0, formattedRating: '0.00' };
  }

  let salesCount = 0;
  try {
    // 1. Check customer placed orders
    const localOrdersRaw = safeLocalStorageGetItem('akselling_local_orders') || '[]';
    if (localOrdersRaw) {
      const localOrders = JSON.parse(localOrdersRaw);
      if (Array.isArray(localOrders)) {
        for (const ord of localOrders) {
          if (ord.items && Array.isArray(ord.items)) {
            for (const itm of ord.items) {
              if (itm.product_id === product.id || itm.id === product.id) {
                salesCount += Number(itm.quantity) || 1;
              }
            }
          }
        }
      }
    }

    // 2. Check supplier hub orders
    const suppOrdersRaw = safeLocalStorageGetItem('akselling_supplier_orders') || '[]';
    if (suppOrdersRaw) {
      const suppOrders = JSON.parse(suppOrdersRaw);
      if (Array.isArray(suppOrders)) {
        for (const ord of suppOrders) {
          if (ord.items && Array.isArray(ord.items)) {
            for (const itm of ord.items) {
              if (itm.sku?.includes(product.id.slice(0, 6)) || itm.title === product.id) {
                salesCount += Number(itm.quantity) || 1;
              }
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Check customer submitted reviews
  let reviewsCount = 0;
  let reviewsSum = 0;
  try {
    const revRaw = safeLocalStorageGetItem(`akselling_reviews_${product.id}`);
    if (revRaw) {
      const revs = JSON.parse(revRaw);
      if (Array.isArray(revs) && revs.length > 0) {
        reviewsCount = revs.length;
        reviewsSum = revs.reduce(
          (acc: number, r: { rating?: number }) => acc + (Number(r.rating) || 5),
          0
        );
      }
    }
  } catch {
    // ignore
  }

  const totalVolume = salesCount + reviewsCount;

  // Base state: If 0 sales & 0 reviews, star rating is strictly 0.00 (0 reviews)
  if (totalVolume === 0) {
    return {
      rating: 0.0,
      ratingCount: 0,
      formattedRating: '0.00',
    };
  }

  // Dynamically grows as sales and reviews increase:
  // Starts with positive growth from 4.0 upwards to 5.0 as sales occur
  let calculatedScore = 4.0;
  if (reviewsCount > 0) {
    calculatedScore = (reviewsSum + salesCount * 4.8) / totalVolume;
  } else {
    calculatedScore = Math.min(5.0, 4.0 + Math.min(0.95, salesCount * 0.12));
  }

  const finalScore = Number(calculatedScore.toFixed(2));
  return {
    rating: finalScore,
    ratingCount: totalVolume,
    formattedRating: finalScore.toFixed(2),
  };
}

