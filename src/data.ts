import type { Product, Category, Banner } from './types';
import { safeLocalStorageGetItem } from './utils/storageHelper';
import { db, getCachedProducts, setCachedProducts, getCachedCategories, getDeletedCategoryIds } from './firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { deduplicateProducts, getProductDesignKey, DisplayDeduplicator } from './utils/productDeduplication';
import {
  resolveProductImages,
  getProductFallbackImage,
  DEFAULT_PRODUCT_IMAGE,
  isPlaceholderOrBroken,
} from './utils/productImageMapper';

export {
  deduplicateProducts,
  getProductDesignKey,
  DisplayDeduplicator,
  resolveProductImages,
  getProductFallbackImage,
  DEFAULT_PRODUCT_IMAGE,
  isPlaceholderOrBroken,
};

export const DEFAULT_PRODUCT_PLACEHOLDER = DEFAULT_PRODUCT_IMAGE;

export async function fetchProducts(): Promise<Product[]> {
  const localSellerProducts = getLocalSellerProducts();
  const cached = getCachedProducts();
  const dbItems: Product[] = [];
  const serverItems: Product[] = [];

  // 1. Fetch from server backend API
  try {
    const sRes = await fetch('/api/products');
    if (sRes.ok) {
      const sData = await sRes.json();
      if (Array.isArray(sData.products)) {
        sData.products.forEach((p: Product) => {
          if (p && p.id) {
            const resolvedImgs = resolveProductImages(p);
            serverItems.push({
              ...p,
              images: resolvedImgs,
              imageUrl: resolvedImgs[0],
              image: resolvedImgs[0],
            });
          }
        });
      }
    }
  } catch {
    // silent
  }

  // 2. Fetch from Firebase Firestore
  try {
    const productsRef = collection(db, 'products');
    const snap = await getDocs(productsRef);
    if (!snap.empty) {
      snap.forEach(docSnap => {
        const d = docSnap.data();
        const resolvedImgs = resolveProductImages({ id: docSnap.id, ...d });
        dbItems.push({
          id: docSnap.id,
          title: d.title || '',
          description: d.description || '',
          price: Number(d.price) || 0,
          mrp: Number(d.mrp) || Number(d.price) || 0,
          discount: Number(d.discount) || 0,
          category: d.category || 'fashion',
          images: resolvedImgs,
          imageUrl: resolvedImgs[0],
          image: resolvedImgs[0],
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
      });
    }
  } catch {
    // silent
  }

  const combined = deduplicateProducts([
    ...dbItems,
    ...serverItems,
    ...localSellerProducts,
    ...cached,
  ]);

  if (combined.length > 0) {
    setCachedProducts(combined);
    return combined;
  }
  return cached.length > 0 ? cached : [];
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
      const resolvedImgs = resolveProductImages({ id: snap.id, ...d });
      return {
        id: snap.id,
        title: d.title || '',
        description: d.description || '',
        price: Number(d.price) || 0,
        mrp: Number(d.mrp) || Number(d.price) || 0,
        discount: Number(d.discount) || 0,
        category: d.category || 'fashion',
        images: resolvedImgs,
        imageUrl: resolvedImgs[0],
        image: resolvedImgs[0],
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
          const resolvedImgs = resolveProductImages({ id: docSnap.id, ...d });
          dbItems.push({
            id: docSnap.id,
            title: d.title || '',
            description: d.description || '',
            price: Number(d.price) || 0,
            mrp: Number(d.mrp) || Number(d.price) || 0,
            discount: Number(d.discount) || 0,
            category: d.category || 'fashion',
            images: resolvedImgs,
            imageUrl: resolvedImgs[0],
            image: resolvedImgs[0],
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
        const resolvedImgs = resolveProductImages(p);
        return {
          id: p.id,
          title: p.title,
          description: p.description || '',
          price: Number(p.price) || 0,
          mrp: Number(p.mrp) || Number(p.price) || 0,
          discount: p.discount || (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0),
          category: p.category || 'fashion',
          images: resolvedImgs,
          imageUrl: resolvedImgs[0],
          image: resolvedImgs[0],
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
  const resolvedImgs = resolveProductImages(row);
  return {
    id: row.id as string,
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    price: Number(row.price) || 0,
    mrp: Number(row.mrp) || Number(row.price) || 0,
    discount: Number(row.discount) || 0,
    category: (row.category as string) || 'fashion',
    images: resolvedImgs,
    imageUrl: resolvedImgs[0],
    image: resolvedImgs[0],
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
