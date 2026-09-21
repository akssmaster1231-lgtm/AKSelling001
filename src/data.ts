import type { Product, Category, Banner } from './types';
import { safeLocalStorageGetItem } from './utils/storageHelper';
import { db, getCachedProducts, setCachedProducts, getCachedCategories, getDeletedCategoryIds } from './firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { deduplicateProducts, getProductDesignKey, DisplayDeduplicator } from './utils/productDeduplication';

export { deduplicateProducts, getProductDesignKey, DisplayDeduplicator };

export const DEFAULT_PRODUCT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f8fafc'/%3E%3Cpath d='M150 160 C150 132 172 110 200 110 C228 110 250 132 250 160 M120 160 L280 160 L295 300 L105 300 Z' fill='none' stroke='%23cbd5e1' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

export async function fetchProducts(): Promise<Product[]> {
  const localSellerProducts = getLocalSellerProducts();
  const localIds = new Set(localSellerProducts.map(p => p.id));
  const cached = getCachedProducts();

  try {
    const productsRef = collection(db, 'products');
    const snap = await getDocs(productsRef);
    if (!snap.empty) {
      const dbItems: Product[] = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (!localIds.has(docSnap.id)) {
          const rawImages = Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.image ? [d.image] : [DEFAULT_PRODUCT_PLACEHOLDER]);
          const sanitizedImages = rawImages.map((img: string) => (typeof img === 'string' && img.includes('8532616') ? DEFAULT_PRODUCT_PLACEHOLDER : img));
          dbItems.push({
            id: docSnap.id,
            title: d.title || '',
            description: d.description || '',
            price: Number(d.price) || 0,
            mrp: Number(d.mrp) || Number(d.price) || 0,
            discount: Number(d.discount) || 0,
            category: d.category || 'fashion',
            images: sanitizedImages,
            rating: typeof d.rating === 'number' ? d.rating : 4.2,
            ratingCount: Number(d.ratingCount || d.rating_count || 120),
            brand: d.brand || 'AKSelling',
            inStock: d.inStock !== false && d.in_stock !== false,
            delivery: d.delivery || 'Free delivery by tomorrow',
            sizes: d.sizes,
            colors: d.colors,
            neckType: d.neckType,
            sleeveType: d.sleeveType,
            fitType: d.fitType,
            fabric: d.fabric,
            tags: Array.isArray(d.tags) ? d.tags : [],
            keywords: Array.isArray(d.keywords) ? d.keywords : [],
            pickupLocation: d.pickupLocation,
            weight: d.weight,
            dimensions: d.dimensions,
          });
        }
      });
      const combined = deduplicateProducts([...localSellerProducts, ...dbItems]);
      setCachedProducts(combined);
      return combined;
    }
    return deduplicateProducts(localSellerProducts.length > 0 ? localSellerProducts : cached);
  } catch {
    return deduplicateProducts(localSellerProducts.length > 0 ? localSellerProducts : cached);
  }
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  if (!productId) return null;

  // 1. Check in-memory / localStorage cache first
  const cached = getCachedProducts();
  const foundCached = cached.find(p => p.id === productId);
  if (foundCached) return foundCached;

  // 2. Check local seller created products
  const localSeller = getLocalSellerProducts();
  const foundLocal = localSeller.find(p => p.id === productId);
  if (foundLocal) return foundLocal;

  // 3. Query Firestore document directly
  try {
    const docRef = doc(db, 'products', productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      const rawImages = Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.image ? [d.image] : [DEFAULT_PRODUCT_PLACEHOLDER]);
      const sanitizedImages = rawImages.map((img: string) => (typeof img === 'string' && img.includes('8532616') ? DEFAULT_PRODUCT_PLACEHOLDER : img));
      return {
        id: snap.id,
        title: d.title || '',
        description: d.description || '',
        price: Number(d.price) || 0,
        mrp: Number(d.mrp) || Number(d.price) || 0,
        discount: Number(d.discount) || 0,
        category: d.category || 'fashion',
        images: sanitizedImages,
        rating: typeof d.rating === 'number' ? d.rating : 4.2,
        ratingCount: Number(d.ratingCount || d.rating_count || 120),
        brand: d.brand || 'AKSelling',
        inStock: d.inStock !== false && d.in_stock !== false,
        delivery: d.delivery || 'Free delivery by tomorrow',
        sizes: d.sizes,
        colors: d.colors,
        neckType: d.neckType,
        sleeveType: d.sleeveType,
        fitType: d.fitType,
        fabric: d.fabric,
        tags: Array.isArray(d.tags) ? d.tags : [],
        keywords: Array.isArray(d.keywords) ? d.keywords : [],
        pickupLocation: d.pickupLocation,
        weight: d.weight,
        dimensions: d.dimensions,
      };
    }
  } catch {
    // Silent fallback
  }

  // 4. Try full catalogue fetch if still not found
  try {
    const all = await fetchProducts();
    const foundInAll = all.find(p => p.id === productId);
    if (foundInAll) return foundInAll;
  } catch {
    // Silent fallback
  }

  return null;
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const localSellerProducts = getLocalSellerProducts().filter(p => p.category === category);
  const localIds = new Set(localSellerProducts.map(p => p.id));

  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('category', '==', category));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const dbItems: Product[] = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (!localIds.has(docSnap.id)) {
          const rawImages = Array.isArray(d.images) && d.images.length > 0 ? d.images : (d.image ? [d.image] : [DEFAULT_PRODUCT_PLACEHOLDER]);
          const sanitizedImages = rawImages.map((img: string) => (typeof img === 'string' && img.includes('8532616') ? DEFAULT_PRODUCT_PLACEHOLDER : img));
          dbItems.push({
            id: docSnap.id,
            title: d.title || '',
            description: d.description || '',
            price: Number(d.price) || 0,
            mrp: Number(d.mrp) || Number(d.price) || 0,
            discount: Number(d.discount) || 0,
            category: d.category || 'fashion',
            images: sanitizedImages,
            rating: typeof d.rating === 'number' ? d.rating : 4.2,
            ratingCount: Number(d.ratingCount || d.rating_count || 120),
            brand: d.brand || 'AKSelling',
            inStock: d.inStock !== false && d.in_stock !== false,
            delivery: d.delivery || 'Free delivery by tomorrow',
            sizes: d.sizes,
            colors: d.colors,
            neckType: d.neckType,
            sleeveType: d.sleeveType,
            fitType: d.fitType,
            fabric: d.fabric,
            tags: Array.isArray(d.tags) ? d.tags : [],
            keywords: Array.isArray(d.keywords) ? d.keywords : [],
            pickupLocation: d.pickupLocation,
            weight: d.weight,
            dimensions: d.dimensions,
          });
        }
      });
      return deduplicateProducts([...localSellerProducts, ...dbItems]);
    }
    return deduplicateProducts([...localSellerProducts]);
  } catch {
    return deduplicateProducts([...localSellerProducts]);
  }
}

function getLocalSellerProducts(): Product[] {
  try {
    const saved = safeLocalStorageGetItem('akselling_seller_products') || localStorage.getItem('akselling_seller_products');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(p => !p.id?.startsWith('sp_') && p.catalogId !== 'CAT-98421' && p.catalogId !== 'CAT-89302' && p.catalogId !== 'CAT-74910' && p.catalogId !== 'CAT-62914' && p.catalogId !== 'CAT-51928' && p.catalogId !== 'CAT-41092')
      .map(p => {
        const rawImgs = p.images && p.images.length > 0 ? p.images : [DEFAULT_PRODUCT_PLACEHOLDER];
        const sanitizedImgs = rawImgs.map((img: string) => (typeof img === 'string' && img.includes('8532616') ? DEFAULT_PRODUCT_PLACEHOLDER : img));
        return {
          id: p.id,
          title: p.title,
          description: p.description || '',
          price: Number(p.price) || 0,
          mrp: Number(p.mrp) || Number(p.price) || 0,
          discount: p.discount || (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0),
          category: p.category || 'fashion',
          images: sanitizedImgs,
          rating: typeof p.rating === 'number' ? p.rating : 0.0,
          ratingCount: p.salesCount || 0,
          brand: p.brand || 'AKSelling',
          inStock: p.stock > 0 || p.status === 'live',
          delivery: 'Free delivery in 2-3 days',
          sizes: p.sizes,
          colors: p.colors,
          neckType: p.neckType,
          sleeveType: p.sleeveType,
          fitType: p.fitType,
          fabric: p.fabric,
        };
      });
  } catch {
    return [];
  }
}

export function mapDbProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    price: row.price as number,
    mrp: row.mrp as number,
    discount: row.discount as number,
    category: row.category as string,
    images: (row.images as string[]) || [],
    rating: Number(row.rating || 4.2),
    ratingCount: (row.rating_count as number) || (row.ratingCount as number) || 120,
    brand: (row.brand as string) || 'AKSelling',
    inStock: row.in_stock !== false,
    delivery: (row.delivery as string) || 'Free delivery in 2-3 days',
    sizes: (row.sizes as string[]) || undefined,
    colors: (row.colors as string[]) || undefined,
    neckType: (row.neck_type as string) || (row.neckType as string) || undefined,
    sleeveType: (row.sleeve_type as string) || (row.sleeveType as string) || undefined,
    fitType: (row.fit_type as string) || (row.fitType as string) || undefined,
    fabric: (row.fabric as string) || undefined,
  };
}

// Non-fashion categories purged per store specialization for fashion manufacturing
export const REMOVED_NON_FASHION_IDS = new Set([
  'mobiles',
  'electronics',
  'home',
  'beauty',
  'appliances',
  'watches',
]);

export const categories: Category[] = [
  { id: 'apparel-manufacturing', name: 'Apparel & Garments', icon: 'Shirt', color: '#1b365d' },
  { id: 'fabrics-textiles', name: 'Fabrics & Textiles', icon: 'Scissors', color: '#d97706' },
  { id: 'custom-prints', name: 'Custom Prints & Graphics', icon: 'Palette', color: '#7c3aed' },
  { id: 'bulk-wholesale', name: 'Bulk Wholesale & Lots', icon: 'Package', color: '#059669' },
  { id: 'hoodies-sweats', name: 'Hoodies & Winterwear', icon: 'Flame', color: '#dc2626' },
  { id: 'ethnic-wear', name: 'Ethnic & Festive Wear', icon: 'Heart', color: '#e11d48' },
  { id: 'footwear', name: 'Footwear & Shoes', icon: 'Footprints', color: '#0284c7' },
  { id: 'accessories', name: 'Fashion Accessories', icon: 'ShoppingBag', color: '#d97706' },
];

export function getAllCategories(): Category[] {
  const custom = getCachedCategories();
  const deletedIds = new Set(getDeletedCategoryIds());

  // Build a map of customized categories (filtering out any non-fashion legacy categories)
  const customMap = new Map<string, Category>();
  if (custom && custom.length > 0) {
    custom.forEach(c => {
      if (!deletedIds.has(c.id) && !REMOVED_NON_FASHION_IDS.has(c.id.toLowerCase())) {
        customMap.set(c.id, {
          id: c.id,
          name: c.name,
          icon: (c.icon as Category['icon']) || 'Shirt',
          color: c.color || '#1b365d',
        });
      }
    });
  }

  // Filter default fashion manufacturing categories, applying any custom overrides
  const result: Category[] = [];
  const processedIds = new Set<string>();

  for (const cat of categories) {
    if (deletedIds.has(cat.id)) continue;
    if (customMap.has(cat.id)) {
      result.push(customMap.get(cat.id)!);
    } else {
      result.push(cat);
    }
    processedIds.add(cat.id);
  }

  // Append new custom categories (only if not in deleted or non-fashion blacklist)
  customMap.forEach((cat, id) => {
    if (!processedIds.has(id) && !REMOVED_NON_FASHION_IDS.has(id.toLowerCase())) {
      result.push(cat);
      processedIds.add(id);
    }
  });

  return result;
}

export const banners: Banner[] = [
  {
    id: 'b1',
    title: 'Welcome to AKSelling',
    subtitle: 'India’s trusted direct fashion & apparel manufacturing marketplace',
    cta: 'Explore Collections',
    image: 'https://images.pexels.com/photos/5625013/pexels-photo-5625013.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-flipkart-600 to-flipkart-800',
  },
  {
    id: 'b2',
    title: 'Sell with Confidence',
    subtitle: 'Instant GST & Bank verified seller onboarding',
    cta: 'Start Selling',
    image: 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gradient: 'from-pink-600 to-rose-700',
  },
];

// Production Clean: Zero dummy products. Only real products listed by verified sellers or stored in database.
export const products: Product[] = [];

export function formatPrice(price: number): string {
  return '₹' + (Number(price) || 0).toLocaleString('en-IN');
}

export function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}
