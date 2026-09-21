import { safeLocalStorageSetItem, safeLocalStorageGetItem } from './storageHelper';
import type { Product } from '@/types';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export interface RecentlyViewedProduct {
  id: string;
  title: string;
  price: number;
  mrp?: number;
  discount?: number;
  image: string;
  category?: string;
  brand?: string;
  rating?: number;
  viewedAt: number;
}

const SEARCH_HISTORY_KEY = 'akselling_search_history';
const RECENTLY_VIEWED_KEY = 'akselling_recently_viewed_products';
const MAX_SEARCH_HISTORY = 15;
const MAX_RECENTLY_VIEWED = 12;

export const POPULAR_SEARCH_TAGS = [
  'Banarasi Silk Saree',
  'Men Ethnic Kurta',
  'Wireless Earbuds',
  'Running Shoes',
  'Smart Watch',
  'Embroidered Kurti',
  'Leather Wallet',
];

/**
 * Get saved search queries sorted by most recent first
 */
export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = safeLocalStorageGetItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Support backward-compatibility with plain string arrays
      return parsed
        .map((item, index) => {
          if (typeof item === 'string') {
            return {
              id: `sh_${index}_${item}`,
              query: item.trim(),
              timestamp: Date.now() - index * 60000,
            };
          }
          if (item && typeof item === 'object' && typeof item.query === 'string') {
            return {
              id: item.id || `sh_${item.query}_${item.timestamp || Date.now()}`,
              query: item.query.trim(),
              timestamp: Number(item.timestamp) || Date.now(),
            };
          }
          return null;
        })
        .filter((item): item is SearchHistoryItem => Boolean(item && item.query.length > 0))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_SEARCH_HISTORY);
    }
  } catch (err) {
    console.warn('Failed to parse search history:', err);
  }
  return [];
}

/**
 * Add a query to persistent search history and bump to top
 */
export function addSearchQuery(query: string): SearchHistoryItem[] {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return getSearchHistory();

  const current = getSearchHistory();
  // Filter out existing query case-insensitively
  const filtered = current.filter(
    (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
  );

  const newItem: SearchHistoryItem = {
    id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    query: trimmed,
    timestamp: Date.now(),
  };

  const updated = [newItem, ...filtered].slice(0, MAX_SEARCH_HISTORY);
  safeLocalStorageSetItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('akselling_search_history_updated', { detail: updated }));
  }

  return updated;
}

/**
 * Remove an individual search query from history
 */
export function removeSearchQuery(queryToRemove: string): SearchHistoryItem[] {
  const current = getSearchHistory();
  const updated = current.filter(
    (item) => item.query.toLowerCase() !== queryToRemove.toLowerCase() && item.id !== queryToRemove
  );

  safeLocalStorageSetItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('akselling_search_history_updated', { detail: updated }));
  }

  return updated;
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('akselling_search_history_updated', { detail: [] }));
  }
}

/**
 * Get recently viewed products
 */
export function getRecentlyViewedProducts(): RecentlyViewedProduct[] {
  try {
    const raw = safeLocalStorageGetItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((p) => p && typeof p.id === 'string' && typeof p.title === 'string')
        .sort((a, b) => (b.viewedAt || 0) - (a.viewedAt || 0))
        .slice(0, MAX_RECENTLY_VIEWED);
    }
  } catch (err) {
    console.warn('Failed to parse recently viewed products:', err);
  }
  return [];
}

/**
 * Track a viewed product into recently viewed items list
 */
export function addRecentlyViewedProduct(product: Product): RecentlyViewedProduct[] {
  if (!product || !product.id) return getRecentlyViewedProducts();

  const current = getRecentlyViewedProducts();
  const filtered = current.filter((p) => p.id !== product.id);

  const img = Array.isArray(product.images) && product.images[0]
    ? product.images[0]
    : typeof (product as unknown as { image?: string }).image === 'string'
    ? (product as unknown as { image?: string }).image!
    : '';

  const newItem: RecentlyViewedProduct = {
    id: product.id,
    title: product.title || 'Product',
    price: Number(product.price) || 0,
    mrp: Number(product.mrp) || Number(product.price) || 0,
    discount: Number(product.discount) || 0,
    image: img,
    category: product.category,
    brand: product.brand,
    rating: product.rating,
    viewedAt: Date.now(),
  };

  const updated = [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
  safeLocalStorageSetItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('akselling_recently_viewed_updated', { detail: updated }));
  }

  return updated;
}

/**
 * Remove a product from recently viewed
 */
export function removeRecentlyViewedProduct(productId: string): RecentlyViewedProduct[] {
  const current = getRecentlyViewedProducts();
  const updated = current.filter((p) => p.id !== productId);

  safeLocalStorageSetItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('akselling_recently_viewed_updated', { detail: updated }));
  }

  return updated;
}

/**
 * Clear all recently viewed products
 */
export function clearRecentlyViewedProducts(): void {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('akselling_recently_viewed_updated', { detail: [] }));
  }
}
