import type { Product, Category, VideoReel, Banner } from './types';
import { safeLocalStorageGetItem } from './utils/storageHelper';
import { db, getCachedProducts, setCachedProducts, getCachedCategories, getDeletedCategoryIds } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

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
      const combined = [...localSellerProducts, ...dbItems];
      setCachedProducts(combined);
      return combined;
    }
    return localSellerProducts.length > 0 ? localSellerProducts : cached;
  } catch (err) {
    console.warn('Firestore fetch products fallback:', err);
    return localSellerProducts.length > 0 ? localSellerProducts : cached;
  }
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
      return [...localSellerProducts, ...dbItems];
    }
    return [...localSellerProducts];
  } catch (err) {
    console.warn('Firestore fetch category products fallback:', err);
    return [...localSellerProducts];
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

export const categories: Category[] = [
  { id: 'fashion', name: 'Fashion', icon: 'Shirt', color: '#e91e63' },
  { id: 'mobiles', name: 'Mobiles', icon: 'Smartphone', color: '#2874f0' },
  { id: 'electronics', name: 'Electronics', icon: 'Headphones', color: '#009688' },
  { id: 'home', name: 'Home', icon: 'Sofa', color: '#ff9800' },
  { id: 'beauty', name: 'Beauty', icon: 'Sparkles', color: '#e040fb' },
  { id: 'footwear', name: 'Footwear', icon: 'Footprints', color: '#4caf50' },
  { id: 'watches', name: 'Watches', icon: 'Watch', color: '#795548' },
  { id: 'appliances', name: 'Appliances', icon: 'Refrigerator', color: '#607d8b' },
];

export function getAllCategories(): Category[] {
  const custom = getCachedCategories();
  const deletedIds = new Set(getDeletedCategoryIds());

  // Build a map of customized categories
  const customMap = new Map<string, Category>();
  if (custom && custom.length > 0) {
    custom.forEach(c => {
      if (!deletedIds.has(c.id)) {
        customMap.set(c.id, {
          id: c.id,
          name: c.name,
          icon: (c.icon as Category['icon']) || 'Layers',
          color: c.color || '#2874f0',
        });
      }
    });
  }

  // Filter default categories, applying any custom overrides
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

  // Append new custom categories
  customMap.forEach((cat, id) => {
    if (!processedIds.has(id)) {
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
    subtitle: 'India’s trusted marketplace for verified fashion & lifestyle',
    cta: 'Explore Products',
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

// Clean Video Reels - only active when real product reels exist
export const videoReels: VideoReel[] = [];

export function formatPrice(price: number): string {
  return '₹' + (Number(price) || 0).toLocaleString('en-IN');
}

export function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}
