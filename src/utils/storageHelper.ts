import { DEFAULT_PRODUCT_IMAGE, getProductFallbackImage } from './productImageMapper';

/**
 * Safe localStorage utilities with automatic quota handling and graceful mitigation
 */

export const DEFAULT_PRODUCT_PLACEHOLDER = DEFAULT_PRODUCT_IMAGE;

export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`localStorage quota exceeded while saving ${key}. Attempting mitigation...`, err);
    try {
      // If saving seller products, do NOT replace valid images with placeholders, keep them intact
      if (key === 'akselling_seller_products') {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((item) => ({
            ...item,
            images: (item.images || []).map((img: string) => {
              if (
                typeof img === 'string' &&
                (img.includes('8532616') || img.startsWith('data:image/svg'))
              ) {
                return getProductFallbackImage(item);
              }
              return img;
            }),
          }));
          localStorage.setItem(key, JSON.stringify(sanitized));
          return true;
        }
      }

      // Try clearing obsolete / temporary keys if any
      try {
        localStorage.removeItem('akselling_seller_regs');
      } catch {
        // ignore
      }

      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.warn(`Could not persist ${key} in localStorage:`, e2);
      return false;
    }
  }
}

export function safeLocalStorageGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Extracts a clean, human-readable store name from localStorage
 * even if stored as a raw JSON registration object
 */
export function getCleanSellerStoreName(): string {
  try {
    const raw = localStorage.getItem('akselling_active_seller');
    if (!raw || typeof raw !== 'string') return 'AK Yadav Prints';
    const trimmed = raw.trim();
    if (!trimmed) return 'AK Yadav Prints';
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return (
            parsed.business_name ||
            parsed.businessName ||
            parsed.storeName ||
            parsed.name ||
            'AK Yadav Prints'
          );
        }
      } catch {
        // ignore JSON parse error
      }
    }
    return trimmed;
  } catch {
    return 'AK Yadav Prints';
  }
}
