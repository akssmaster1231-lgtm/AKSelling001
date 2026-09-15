/**
 * Safe localStorage utilities with automatic quota handling and graceful mitigation
 */

export const DEFAULT_PRODUCT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Cpath d='M200 130 L270 170 L270 250 L200 290 L130 250 L130 170 Z' fill='none' stroke='%239ca3af' stroke-width='8' stroke-linejoin='round'/%3E%3Cpath d='M200 130 L200 290' stroke='%239ca3af' stroke-width='8'/%3E%3Cpath d='M130 170 L200 210 L270 170' fill='none' stroke='%239ca3af' stroke-width='8'/%3E%3C/svg%3E";

export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`localStorage quota exceeded while saving ${key}. Attempting mitigation...`, err);
    try {
      // If saving seller products, sanitize by trimming huge base64 strings or keeping the most recent items
      if (key === 'akselling_seller_products') {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((item) => ({
            ...item,
            images: (item.images || []).map((img: string) => {
              if (typeof img === 'string' && (img.includes('8532616') || (img.startsWith('data:') && img.length > 50000))) {
                return DEFAULT_PRODUCT_PLACEHOLDER;
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
