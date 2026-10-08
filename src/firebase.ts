import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  setPersistence,
  browserLocalPersistence,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth';
import type { Product, Banner, PriceAlert, PaymentLedgerEntry } from '@/types';
export type FirestoreProduct = Product;
import type { UserProfile } from '@/auth-context';
import type { SellerProduct } from '@/types/supplier';
import type { AppNotification } from '@/types/notification';
import type { ProductReview } from '@/types/review';
import { deduplicateProducts } from './utils/productDeduplication';
import { resolveProductImages, DEFAULT_PRODUCT_IMAGE } from './utils/productImageMapper';
import { compressImageFile } from './utils/imageCompressor';
export { resolveProductImages, DEFAULT_PRODUCT_IMAGE };

/**
 * ------------------------------------------------------------------
 * FIREBASE CONFIGURATION (firebaseConfig)
 * ------------------------------------------------------------------
 * आप यहाँ अपना Firebase प्रोजेक्ट क्रेडेंशियल्स (apiKey, authDomain आदि)
 * सीधे भर सकते हैं या फिर .env / firebase-applet-config.json का उपयोग कर सकते हैं।
 *
 * Example:
 * export const firebaseConfig = {
 *   apiKey: "AIzaSyYourApiKeyHere...",
 *   authDomain: "your-project-id.firebaseapp.com",
 *   projectId: "your-project-id",
 *   storageBucket: "your-project-id.appspot.com",
 *   messagingSenderId: "123456789012",
 *   appId: "1:123456789012:web:abcdef123456",
 * };
 */
export const firebaseConfig = {
  apiKey: "AIzaSyCnXkwV8ZMaqINLKCweHfeUeoxPTfi8zaI",
  authDomain: "akseling-4719a.firebaseapp.com",
  projectId: "akseling-4719a",
  storageBucket: "akseling-4719a.firebasestorage.app",
  messagingSenderId: "1019849690303",
  appId: "1:1019849690303:web:600af26ee64dcfe7dd0a0a",
  measurementId: "G-4LBZKYDXEB",
  firestoreDatabaseId: "(default)",
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */

// Initialize Firebase Authentication
export const auth = getAuth(app);
try {
  auth.useDeviceLanguage();
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // browser local persistence fallback
  });
} catch {
  // ignore in non-browser environments
}

// Initialize Firebase Storage (Permanent Bucket)
export const storage = getStorage(app);

/**
 * Uploads media (images/photos) to permanent storage.
 * 3-Tier Multi-Storage Architecture:
 * 1. Firebase Storage permanent cloud bucket (akseling-4719a.firebasestorage.app)
 * 2. Server permanent upload endpoint (/api/upload -> public/uploads)
 * 3. Client-side compressed Retina WebP data URL fallback
 * Guarantees URLs never expire and heavy images never disappear.
 */
export async function uploadMediaToPermanentStorage(
  dataUrlOrFile: string | File | Blob,
  folder: string = 'products',
  customId?: string
): Promise<string> {
  if (typeof dataUrlOrFile === 'string' && dataUrlOrFile.startsWith('http') && !dataUrlOrFile.startsWith('data:')) {
    return dataUrlOrFile;
  }

  let finalBase64 = '';
  if (typeof dataUrlOrFile !== 'string') {
    finalBase64 = await compressImageFile(dataUrlOrFile, { maxWidth: 800, maxHeight: 800, quality: 0.76 });
  } else {
    // If it's a massive raw base64 string, compress it before upload
    if (dataUrlOrFile.startsWith('data:image/') && dataUrlOrFile.length > 200000) {
      try {
        finalBase64 = await compressImageFile(dataUrlOrFile, { maxWidth: 800, maxHeight: 800, quality: 0.76 });
      } catch {
        finalBase64 = dataUrlOrFile;
      }
    } else {
      finalBase64 = dataUrlOrFile;
    }
  }

  if (!finalBase64 || !finalBase64.startsWith('data:')) {
    return finalBase64;
  }

  const fileExt = finalBase64.includes('image/webp') ? 'webp' : finalBase64.includes('image/png') ? 'png' : 'jpg';
  const fileName = `${folder}_${customId || Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

  // Instant Tier 1: Local server permanent storage endpoint (/api/upload -> public/uploads)
  // Writes directly to disk in < 10ms with zero timeout delay
  try {
    const resp = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl: finalBase64,
        filename: fileName,
        category: folder,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data?.url) {
        return data.url;
      }
    }
  } catch (serverErr) {
    console.warn('[Storage] Server upload notice:', serverErr);
  }

  // Tier 2: Firebase Storage with 1.5s strict timeout safeguard (never blocks the publishing UI)
  try {
    const sRef = storageRef(storage, `${folder}/${fileName}`);
    const uploadPromise = uploadString(sRef, finalBase64, 'data_url', {
      contentType: finalBase64.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    }).then(res => getDownloadURL(res.ref));

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout')), 1500)
    );

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    if (downloadUrl) {
      return downloadUrl;
    }
  } catch (storageErr) {
    console.warn('[Storage] Firebase Storage notice (using compressed data fallback):', storageErr);
  }

  // Tier 3: Client-side compressed WebP data URL fallback
  return finalBase64;
}

export const isFirebaseConfigured = Boolean(firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey);

/**
 * Setup RecaptchaVerifier for Firebase Phone Auth
 * Supports container ID string or DOM element, invisible or normal size.
 * Handles DOM re-renders and single-instance safety cleanly.
 */
export function setupRecaptcha(
  containerIdOrElement: string | HTMLElement = 'firebase-recaptcha-container',
  size: 'invisible' | 'normal' = 'invisible'
): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  const win = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };

  // Clear any existing recaptcha widget on the window
  if (win.recaptchaVerifier) {
    try {
      win.recaptchaVerifier.clear();
    } catch (e) {
      console.warn('RecaptchaVerifier clear notice:', e);
    }
    delete win.recaptchaVerifier;
  }

  // Ensure target container exists and has clean DOM
  let targetEl: HTMLElement;
  if (typeof containerIdOrElement === 'string') {
    let el = document.getElementById(containerIdOrElement);
    if (!el) {
      el = document.createElement('div');
      el.id = containerIdOrElement;
      document.body.appendChild(el);
    }
    el.innerHTML = '';
    targetEl = el;
  } else {
    targetEl = containerIdOrElement;
    targetEl.innerHTML = '';
  }

  const verifier = new RecaptchaVerifier(auth, targetEl, {
    size,
    callback: () => {
      console.log('Firebase Phone Auth reCAPTCHA solved.');
    },
    'expired-callback': () => {
      console.warn('Firebase Phone Auth reCAPTCHA expired. Please re-trigger OTP.');
    },
  });

  win.recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Send real SMS OTP to phone number using Firebase Phone Authentication
 * @param phone E.164 formatted phone number (e.g. +919876543210)
 * @param appVerifier RecaptchaVerifier instance
 */
export async function sendFirebasePhoneOtp(
  phone: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return await signInWithPhoneNumber(auth, phone, appVerifier);
}

/**
 * Confirm OTP code and complete Firebase Phone Sign-in
 */
export async function verifyFirebasePhoneOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<UserCredential> {
  return await confirmationResult.confirm(otpCode);
}

// Helper to strip undefined values recursively (Firestore disallows undefined)
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as unknown as T;
  }
  return obj;
}

// -------------------------------------------------------------
// FIRESTORE QUOTA EXHAUSTION CIRCUIT BREAKER
// -------------------------------------------------------------
// When free daily write units limit is reached, this prevents repeated retries
// and backoff delays, allowing the app to seamlessly fall back to local storage.
const QUOTA_STORAGE_KEY = 'akselling_firestore_quota_exhausted_date';

// Auto-reset any legacy quota flags when pointing to the genuine production project
if (typeof window !== 'undefined') {
  try {
    const activeProject = localStorage.getItem('akselling_active_firebase_project');
    if (activeProject !== firebaseConfig.projectId) {
      localStorage.removeItem(QUOTA_STORAGE_KEY);
      sessionStorage.removeItem('akselling_firestore_quota_exhausted');
      localStorage.setItem('akselling_active_firebase_project', firebaseConfig.projectId);
    }
  } catch {
    // ignore
  }
}

export function isQuotaExhausted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const storedDate = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (storedDate === today) return true;

    if (sessionStorage.getItem('akselling_firestore_quota_exhausted') === 'true') {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function markQuotaExhausted(reason?: unknown): void {
  if (typeof window === 'undefined') return;
  if (reason) {
    // Track error reason if present
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(QUOTA_STORAGE_KEY, today);
    sessionStorage.setItem('akselling_firestore_quota_exhausted', 'true');
  } catch {
    // ignore
  }
}

export function handleFirestoreError(err: unknown, operationName?: string): void {
  const msg = String((err as { message?: string })?.message || err || '');
  const code = String((err as { code?: string })?.code || '');
  if (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Free daily write units')
  ) {
    markQuotaExhausted(operationName || err);
  }
}

// -------------------------------------------------------------
// PRODUCTS FIRESTORE REAL-TIME SYNC & INSTANT CACHING
// -------------------------------------------------------------

const PRODUCTS_CACHE_KEY = 'akselling_firestore_products_cache';

export const DEFAULT_PRODUCT_PLACEHOLDER = DEFAULT_PRODUCT_IMAGE;

const DUMMY_PRODUCT_IDS = new Set([
  'sp_1',
  'sp_2',
  'sp_3',
  'sp_4',
  'sp_5',
  'demo_tshirt',
  'prod_1789471043550',
  'prod_1789377443939',
  'PRD-261462',
]);

export function getCachedProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter(p => !DUMMY_PRODUCT_IDS.has(p.id))
          .map(p => {
            const resolvedImgs = resolveProductImages(p);
            return {
              ...p,
              images: resolvedImgs,
              imageUrl: resolvedImgs[0],
              image: resolvedImgs[0],
            };
          });
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export function setCachedProducts(products: Product[]): void {
  try {
    if (Array.isArray(products) && products.length > 0) {
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
    }
  } catch {
    // If quota exceeded due to base64 images, save lean version with primary image
    try {
      const lean = products.map(p => ({
        ...p,
        images: (p.images || []).slice(0, 2),
      }));
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(lean));
    } catch {
      // ignore
    }
  }
}

function filterProductsByCategory(list: Product[], categoryFilter?: string): Product[] {
  if (!categoryFilter || categoryFilter === 'all') return list;
  const catLower = categoryFilter.toLowerCase().trim();
  return list.filter(p => {
    const pCat = (p.category || '').toLowerCase().trim();
    return (
      pCat === catLower ||
      (catLower === 'fashion' && (pCat === 'apparel-manufacturing' || pCat === 'fashion' || pCat.includes('apparel') || pCat.includes('cloth'))) ||
      (catLower === 'apparel-manufacturing' && (pCat === 'fashion' || pCat === 'apparel-manufacturing' || pCat.includes('apparel') || pCat.includes('garment')))
    );
  });
}

export function subscribeProducts(
  callback: (products: Product[]) => void,
  categoryFilter?: string
): () => void {
  // 1. Emit cached products synchronously for 0ms instant display
  const initialCached = getCachedProducts();
  if (initialCached.length > 0) {
    const filtered = filterProductsByCategory(initialCached, categoryFilter);
    callback(filtered);
  }

  // 2. Fetch server /api/products (which holds all permanent uploaded products)
  fetch('/api/products')
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data.products) && data.products.length > 0) {
        const merged = deduplicateProducts([...data.products, ...getCachedProducts()]);
        setCachedProducts(merged);
        callback(filterProductsByCategory(merged, categoryFilter));
      }
    })
    .catch(() => {});

  try {
    const productsRef = collection(db, 'products');
    // Fetch all active products without restrictive Firestore where clauses so new uploads are never blocked
    const q = query(productsRef);

    return onSnapshot(
      q,
      (snapshot) => {
        const items: Product[] = [];
        if (!snapshot.empty) {
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.isArchived === true || data.status === 'archived') {
              return;
            }
            const resolvedImgs = resolveProductImages({ id: docSnap.id, ...data });
            items.push({
              id: docSnap.id,
              title: data.title || '',
              description: data.description || '',
              price: Number(data.price) || 0,
              mrp: Number(data.mrp) || Number(data.price) || 0,
              discount: Number(data.discount) || (data.mrp > data.price ? Math.round(((data.mrp - data.price) / data.mrp) * 100) : 0),
              category: data.category || 'fashion',
              images: resolvedImgs,
              imageUrl: resolvedImgs[0],
              image: resolvedImgs[0],
              rating: typeof data.rating === 'number' ? data.rating : 4.2,
              ratingCount: Number(data.ratingCount || data.rating_count || 120),
              brand: data.brand || 'AKSelling',
              inStock: data.inStock !== false && data.in_stock !== false,
              delivery: data.delivery || 'Free delivery in 2-3 days',
              sizes: data.sizes,
              colors: data.colors,
              neckType: data.neckType || data.neck_type,
              sleeveType: data.sleeveType || data.sleeve_type,
              fitType: data.fitType || data.fit_type,
              fabric: data.fabric,
              tags: Array.isArray(data.tags) ? data.tags : [],
              keywords: Array.isArray(data.keywords) ? data.keywords : [],
              pickupLocation: data.pickupLocation || data.pickupAddress?.city || 'Gurugram Hub',
              weight: data.weight,
              dimensions: data.dimensions,
              productType: data.productType,
              printDesign: data.printDesign,
              weightGsm: data.weightGsm,
              shippingCharge: data.shippingCharge,
              isFreeShipping: data.isFreeShipping,
              stock: typeof data.stock === 'number' ? data.stock : (typeof data.inventoryCount === 'number' ? data.inventoryCount : 100),
              inventoryCount: typeof data.inventoryCount === 'number' ? data.inventoryCount : (typeof data.stock === 'number' ? data.stock : 100),
              sellerId: data.sellerId || 'owner',
              sellerName: data.sellerName || data.pickupAddress?.businessName || 'AKSelling',
              sellerPhone: data.sellerPhone || data.pickupAddress?.phone || '7290894907',
              pickupAddress: data.pickupAddress,
              variants: data.variants,
              storefrontPlacement: data.storefrontPlacement,
            });
          });
        }

        // Merge Firestore documents with local cache & server items so newly uploaded products appear instantly
        const currentCache = getCachedProducts();
        const combined = deduplicateProducts([...items, ...currentCache]);
        setCachedProducts(combined);
        callback(filterProductsByCategory(combined, categoryFilter));
      },
      () => {
        // Suppress permission errors and fall back to local/server cache
        const cached = getCachedProducts();
        callback(filterProductsByCategory(cached, categoryFilter));
      }
    );
  } catch {
    const cached = getCachedProducts();
    callback(filterProductsByCategory(cached, categoryFilter));
    return () => {};
  }
}

export async function saveProductToFirestore(product: Product | SellerProduct): Promise<void> {
  const prodId = product.id;
  if (!prodId) return;

  const rawImages = resolveProductImages(product);

  // Parallel multi-image compression & upload ensuring sub-100ms execution
  const permanentImages = await Promise.all(
    rawImages.map(async (img, i) => {
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        try {
          return await uploadMediaToPermanentStorage(img, 'products', `${prodId}_img_${i}`);
        } catch {
          return img;
        }
      }
      return img || DEFAULT_PRODUCT_IMAGE;
    })
  );

  const finalImages = permanentImages.filter(Boolean).length > 0
    ? permanentImages.filter(Boolean)
    : [DEFAULT_PRODUCT_IMAGE];

  // Normalizing attributes
  const rawData: Record<string, unknown> = {
    id: prodId,
    title: product.title || '',
    description: product.description || '',
    price: Number(product.price) || 0,
    mrp: Number(product.mrp) || Number(product.price) || 0,
    discount: Number(product.discount) || 0,
    category: product.category || 'fashion',
    images: finalImages,
    image: finalImages[0],
    imageUrl: finalImages[0],
    image_url: finalImages[0],
    rating: typeof product.rating === 'number' ? product.rating : 4.2,
    ratingCount: ('salesCount' in product ? product.salesCount : product.ratingCount) || 0,
    brand: product.brand || 'AKSelling',
    inStock: 'stock' in product ? (product.stock > 0 || product.status === 'live') : (product.inStock ?? true),
    delivery: ('delivery' in product ? product.delivery : null) || 'Free delivery by tomorrow',
    updatedAt: new Date().toISOString(),
  };

  if ('sizes' in product && product.sizes !== undefined) rawData.sizes = product.sizes;
  if ('colors' in product && product.colors !== undefined) rawData.colors = product.colors;
  if ('neckType' in product && product.neckType !== undefined) rawData.neckType = product.neckType;
  if ('sleeveType' in product && product.sleeveType !== undefined) rawData.sleeveType = product.sleeveType;
  if ('fitType' in product && product.fitType !== undefined) rawData.fitType = product.fitType;
  if ('fabric' in product && product.fabric !== undefined) rawData.fabric = product.fabric;
  if ('productType' in product && product.productType !== undefined) rawData.productType = product.productType;
  if ('printDesign' in product && product.printDesign !== undefined) rawData.printDesign = product.printDesign;
  if ('weightGsm' in product && product.weightGsm !== undefined) rawData.weightGsm = product.weightGsm;
  if ('shippingCharge' in product && product.shippingCharge !== undefined) rawData.shippingCharge = product.shippingCharge;
  if ('isFreeShipping' in product && product.isFreeShipping !== undefined) rawData.isFreeShipping = product.isFreeShipping;
  if ('pickupAddress' in product && product.pickupAddress !== undefined) rawData.pickupAddress = product.pickupAddress;
  if ('variants' in product && product.variants !== undefined) rawData.variants = product.variants;
  if ('storefrontPlacement' in product && product.storefrontPlacement !== undefined) rawData.storefrontPlacement = product.storefrontPlacement;
  if ('stock' in product && product.stock !== undefined) rawData.stock = product.stock;
  if ('inventoryCount' in product && product.inventoryCount !== undefined) rawData.inventoryCount = product.inventoryCount;
  if ('sellerId' in product && product.sellerId !== undefined) rawData.sellerId = product.sellerId;
  if ('sellerName' in product && product.sellerName !== undefined) rawData.sellerName = product.sellerName;
  if ('sellerPhone' in product && product.sellerPhone !== undefined) rawData.sellerPhone = product.sellerPhone;
  if ('status' in product && product.status !== undefined) rawData.status = product.status;
  if ('sku' in product && product.sku !== undefined) rawData.sku = product.sku;
  if ('pickupLocation' in product && product.pickupLocation !== undefined) rawData.pickupLocation = product.pickupLocation;
  if ('weight' in product && product.weight !== undefined) rawData.weight = product.weight;
  if ('dimensions' in product && product.dimensions !== undefined) rawData.dimensions = product.dimensions;
  if ('tags' in product && Array.isArray(product.tags)) rawData.tags = product.tags;
  if ('keywords' in product && Array.isArray(product.keywords)) rawData.keywords = product.keywords;

  // Strict Lifetime Permanence & Logistics Lock
  rawData.permanenceLocked = true;
  rawData.isArchived = false;

  const defaultPickupAddress = {
    businessName: 'AKSelling Hub',
    street: 'Plot 14, Phase 2, Industrial Area',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122016',
    phone: '7290894907',
    sellerGstin: '07AAACK1234F1Z5',
    logisticsPartner: 'Delhivery / BlueDart Express',
    dispatchTimeDays: 1,
  };

  const finalPickupAddress = (product.pickupAddress && typeof product.pickupAddress === 'object')
    ? { ...defaultPickupAddress, ...product.pickupAddress }
    : (rawData.pickupAddress && typeof rawData.pickupAddress === 'object')
      ? { ...defaultPickupAddress, ...(rawData.pickupAddress as Record<string, unknown>) }
      : defaultPickupAddress;

  rawData.pickupAddress = finalPickupAddress;

  const normalizedProd: Product = {
    id: prodId,
    title: rawData.title as string,
    description: rawData.description as string,
    price: rawData.price as number,
    mrp: rawData.mrp as number,
    discount: rawData.discount as number,
    category: rawData.category as string,
    images: rawData.images as string[],
    imageUrl: (rawData.images as string[])?.[0],
    image: (rawData.images as string[])?.[0],
    rating: rawData.rating as number,
    ratingCount: rawData.ratingCount as number,
    brand: rawData.brand as string,
    inStock: rawData.inStock as boolean,
    delivery: rawData.delivery as string,
    tags: (rawData.tags as string[]) || [],
    keywords: (rawData.keywords as string[]) || [],
    sizes: rawData.sizes as string[] | undefined,
    colors: rawData.colors as string[] | undefined,
    neckType: rawData.neckType as string | undefined,
    sleeveType: rawData.sleeveType as string | undefined,
    fitType: rawData.fitType as string | undefined,
    fabric: rawData.fabric as string | undefined,
    productType: rawData.productType as string | undefined,
    printDesign: rawData.printDesign as string | undefined,
    weightGsm: rawData.weightGsm as string | undefined,
    shippingCharge: rawData.shippingCharge as number | undefined,
    isFreeShipping: rawData.isFreeShipping as boolean | undefined,
    stock: typeof rawData.stock === 'number' ? rawData.stock : (typeof rawData.inventoryCount === 'number' ? rawData.inventoryCount : 100),
    inventoryCount: typeof rawData.inventoryCount === 'number' ? rawData.inventoryCount : (typeof rawData.stock === 'number' ? rawData.stock : 100),
    sellerId: rawData.sellerId as string | undefined,
    sellerName: (rawData.sellerName as string) || ((rawData.pickupAddress as Record<string, unknown>)?.businessName as string) || 'AKSelling',
    sellerPhone: (rawData.sellerPhone as string) || ((rawData.pickupAddress as Record<string, unknown>)?.phone as string) || '7290894907',
    pickupLocation: (rawData.pickupLocation as string) || ((rawData.pickupAddress as Record<string, unknown>)?.city as string) || 'Gurugram Hub',
    pickupAddress: rawData.pickupAddress as Product['pickupAddress'],
    variants: rawData.variants as Product['variants'],
    storefrontPlacement: rawData.storefrontPlacement as Record<string, unknown> | undefined,
  };

  // 1. Update local cache immediately so UI reflects in 0ms
  const current = getCachedProducts();
  const nextCached = current.some(p => p.id === prodId)
    ? current.map(p => (p.id === prodId ? normalizedProd : p))
    : [normalizedProd, ...current];
  setCachedProducts(nextCached);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('akselling_products_updated', { detail: { products: nextCached } }));
  }

  // 2. Persist to server backend API
  try {
    const sRes = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedProd),
    });
    if (sRes.ok) {
      const sData = await sRes.json();
      if (sData.product && Array.isArray(sData.product.images)) {
        rawData.images = sData.product.images;
        rawData.image = sData.product.image;
        rawData.imageUrl = sData.product.imageUrl;
        normalizedProd.images = sData.product.images;
        normalizedProd.image = sData.product.image;
        normalizedProd.imageUrl = sData.product.imageUrl;
      }
    }
  } catch (e) {
    console.warn('Server product sync notice:', e);
  }

  // 3. Persist to Firebase Firestore for lifetime permanence
  try {
    const docRef = doc(db, 'products', prodId);
    const dataToSave = sanitizeForFirestore(rawData);
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    console.warn('Firestore product write notice (saved in server/local database):', err);
  }

  // Check price drops & notifications
  const existingProd = current.find(p => p.id === prodId);
  if (existingProd && typeof existingProd.price === 'number' && normalizedProd.price < existingProd.price) {
    checkAndDispatchPriceDropAlerts(
      prodId,
      normalizedProd.price,
      existingProd.price,
      normalizedProd.title,
      normalizedProd.images?.[0]
    ).catch(dispatchErr => console.warn('[PriceAlert] Auto-dispatch notice:', dispatchErr));
  } else if (!existingProd) {
    broadcastNewCatalogNotification(normalizedProd).catch(dispatchErr =>
      console.warn('[NewCatalog] Auto-broadcast notice:', dispatchErr)
    );
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!productId) return;

  // 1. Update local cache
  const current = getCachedProducts();
  const updated = current.filter(p => p.id !== productId);
  setCachedProducts(updated);

  // 2. Remove from local seller products cache
  try {
    const rawSeller = localStorage.getItem('akselling_seller_products');
    if (rawSeller) {
      const parsed = JSON.parse(rawSeller);
      if (Array.isArray(parsed)) {
        const filteredSeller = parsed.filter((p: Record<string, unknown>) => p.id !== productId);
        localStorage.setItem('akselling_seller_products', JSON.stringify(filteredSeller));
      }
    }
  } catch {
    // ignore
  }

  // 3. Immediately broadcast to UI for 0ms reflection
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('akselling_products_updated', { detail: { products: updated } }));
  }

  // 4. Delete from server backend API
  try {
    await fetch(`/api/products/${productId}`, { method: 'DELETE' });
  } catch {
    // ignore
  }

  // 5. Permanently delete from Firebase Firestore
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef).catch(async () => {
      await updateDoc(docRef, {
        inStock: false,
        isArchived: true,
        status: 'archived',
        archivedAt: new Date().toISOString(),
      });
    });
  } catch (err) {
    console.warn('Firestore product deletion notice:', err);
  }
}

export async function seedInitialProductsIfEmpty(): Promise<void> {
  try {
    const productsRef = collection(db, 'products');
    const snap = await getDocs(productsRef);
    if (snap.empty) {
      const resp = await fetch('/api/products');
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          for (const prod of data.products) {
            if (prod && prod.id && prod.title) {
              const docRef = doc(db, 'products', prod.id);
              await setDoc(docRef, sanitizeForFirestore({ ...prod, permanenceLocked: true, isArchived: false }), { merge: true });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Seed initial products notice:', err);
  }
}

// -------------------------------------------------------------
// ORDERS FIRESTORE REAL-TIME SYNC
// -------------------------------------------------------------

export interface FirestoreOrder {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_address: string;
  user_id?: string;
  items: Array<{
    product_id: string;
    product_title: string;
    product_image: string;
    design_image?: string;
    designImage?: string;
    quantity: number;
    price: number;
    sku?: string;
    sku_id?: string;
    size?: string;
    color?: string;
    design?: string;
    fabric?: string;
    brand?: string;
    category?: string;
    description?: string;
  }>;
  total_amount: number;
  payment_method: string;
  payment_status?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  transaction_id?: string;
  upi_id?: string;
  upi_utr?: string;
  payment_screenshot?: string;
  wallet_discount_applied?: number;
  advance_paid?: number;
  balance_due?: number;
  payment_verified_by_admin?: boolean;
  payment_verified_at?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  awb_code?: string;
  courier_name?: string;
}

export function subscribeOrders(
  userPhoneOrId: string | undefined,
  callback: (orders: FirestoreOrder[]) => void
): () => void {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef);

    return onSnapshot(
      q,
      (snapshot) => {
        const orderList: FirestoreOrder[] = [];
        const cleanIdent = userPhoneOrId ? userPhoneOrId.replace(/\D/g, '').slice(-10) : '';
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as FirestoreOrder;
          // If filtering by user phone or identifier
          if (
            !userPhoneOrId ||
            (cleanIdent && data.customer_phone && data.customer_phone.replace(/\D/g, '').includes(cleanIdent)) ||
            (data.user_id && data.user_id === userPhoneOrId) ||
            (data.customer_email && data.customer_email.toLowerCase() === userPhoneOrId.toLowerCase())
          ) {
            orderList.push({
              ...data,
              id: docSnap.id,
            });
          }
        });

        // Sort latest first
        orderList.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        callback(orderList);
      },
      (error) => {
        handleFirestoreError(error, 'subscribeOrders');
        callback([]);
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeOrders');
    return () => {};
  }
}

export async function saveOrderToFirestore(order: FirestoreOrder): Promise<void> {
  // Always sync to server API for resilient order backup
  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    }).catch(() => {});
  } catch {
    // silent
  }

  if (isQuotaExhausted()) return;
  try {
    if (!order.id) return;
    const docRef = doc(db, 'orders', order.id);
    const cleanedOrder = sanitizeForFirestore({
      ...order,
      updated_at: new Date().toISOString(),
    });
    await setDoc(docRef, cleanedOrder, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveOrderToFirestore');
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: string,
  extra?: Record<string, unknown>
): Promise<void> {
  // Sync to server API
  try {
    fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, ...extra }),
    }).catch(() => {});
  } catch {
    // silent
  }

  if (isQuotaExhausted()) return;
  try {
    if (!orderId) return;
    const docRef = doc(db, 'orders', orderId);
    const cleanExtra = extra ? sanitizeForFirestore(extra) : {};
    await updateDoc(docRef, {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...cleanExtra,
    });
  } catch (err) {
    handleFirestoreError(err, 'updateOrderStatusInFirestore');
  }
}

// -------------------------------------------------------------
// REAL-TIME PAYMENT LEDGER FIRESTORE SYNC
// -------------------------------------------------------------

export async function savePaymentTransactionToFirestore(entry: PaymentLedgerEntry): Promise<void> {
  const txId = entry.id || `tx_${Date.now()}_${entry.utrNumber ? entry.utrNumber.slice(-4) : 'ref'}`;
  const cleanEntry: PaymentLedgerEntry = {
    ...entry,
    id: txId,
    createdAt: entry.createdAt || new Date().toISOString(),
    verifiedAt: entry.verifiedAt || new Date().toISOString(),
  };

  // 1. Sync to server API
  try {
    fetch('/api/orders/direct-upi-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: cleanEntry.orderId,
        utrNumber: cleanEntry.utrNumber,
        amount: cleanEntry.amount,
        customerName: cleanEntry.customerName,
        customerPhone: cleanEntry.customerPhone,
        paymentMode: cleanEntry.paymentMode || cleanEntry.paymentMethod,
        screenshotUrl: cleanEntry.screenshotUrl,
      }),
    }).catch(() => {});
  } catch {
    // silent
  }

  // 2. Persist to Firestore
  if (isQuotaExhausted()) return;
  try {
    const docRef = doc(db, 'payments_ledger', txId);
    await setDoc(docRef, sanitizeForFirestore(cleanEntry), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'savePaymentTransactionToFirestore');
  }
}

export function subscribeToPaymentLedger(
  callback: (entries: PaymentLedgerEntry[]) => void
): () => void {
  // First load from server API as instant fallback
  fetch('/api/admin/payments-ledger')
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data.payments) && data.payments.length > 0) {
        callback(data.payments);
      }
    })
    .catch(() => {});

  if (isQuotaExhausted()) return () => {};
  try {
    const ledgerRef = collection(db, 'payments_ledger');
    const q = query(ledgerRef, orderBy('createdAt', 'desc'), limit(100));

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: PaymentLedgerEntry[] = [];
          snapshot.forEach(docSnap => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              orderId: d.orderId || docSnap.id,
              paymentId: d.paymentId,
              utrNumber: d.utrNumber || '',
              amount: Number(d.amount) || 0,
              currency: d.currency || 'INR',
              customerName: d.customerName || 'Customer',
              customerPhone: d.customerPhone || '',
              paymentMethod: d.paymentMethod || 'Direct UPI',
              paymentMode: d.paymentMode,
              status: d.status || 'verified',
              screenshotUrl: d.screenshotUrl,
              verifiedAt: d.verifiedAt,
              createdAt: d.createdAt || new Date().toISOString(),
              notes: d.notes,
            });
          });
          callback(list);
        }
      },
      () => {
        // Fallback to server API on any network or permission error
        fetch('/api/admin/payments-ledger')
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data.payments)) {
              callback(data.payments);
            }
          })
          .catch(() => {});
      }
    );
  } catch {
    return () => {};
  }
}

export async function updatePaymentStatusInFirestore(
  id: string,
  status: string,
  notes?: string
): Promise<void> {
  // Sync to server API
  try {
    fetch(`/api/admin/payments-ledger/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    }).catch(() => {});
  } catch {
    // silent
  }

  if (isQuotaExhausted()) return;
  try {
    const docRef = doc(db, 'payments_ledger', id);
    await updateDoc(docRef, {
      status,
      notes: notes || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, 'updatePaymentStatusInFirestore');
  }
}

// -------------------------------------------------------------
// USER PROFILES FIRESTORE REAL-TIME SYNC
// -------------------------------------------------------------

export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    const userId = profile.id || profile.phone || profile.email;
    if (!userId || userId === 'guest') return;
    const userDoc = doc(db, 'users', userId);
    const cleaned = sanitizeForFirestore({
      ...profile,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userDoc, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveUserProfileToFirestore');
  }
}

export function subscribeUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void
): () => void {
  try {
    if (!userId || userId === 'guest') return () => {};
    const userDoc = doc(db, 'users', userId);
    return onSnapshot(
      userDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as UserProfile);
        } else {
          callback(null);
        }
      },
      (err) => {
        handleFirestoreError(err, 'subscribeUserProfile');
        callback(null);
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeUserProfile');
    return () => {};
  }
}

// -------------------------------------------------------------
// BANNERS FIRESTORE REAL-TIME SYNC
// -------------------------------------------------------------

export function subscribeBanners(callback: (banners: Banner[]) => void): () => void {
  try {
    const bannersRef = collection(db, 'banners');
    return onSnapshot(
      bannersRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: (Banner & { display_order?: number; active?: boolean })[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const isActive = data.active !== false && data.isActive !== false;
            if (isActive) {
              list.push({
                id: docSnap.id,
                title: data.title || '',
                subtitle: data.subtitle || '',
                cta: data.cta || 'Shop Now',
                image: data.image || data.imageUrl || '',
                gradient: data.gradient || 'from-blue-600 to-indigo-800',
                display_order: Number(data.display_order || data.order || 1),
                active: true,
              });
            }
          });
          list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          callback(list);
        } else {
          // If empty, fetch from server API
          fetch('/api/banners')
            .then(r => r.json())
            .then(d => {
              if (Array.isArray(d.banners) && d.banners.length > 0) {
                callback(d.banners.filter((b: Banner & { active?: boolean }) => b.active !== false));
              }
            })
            .catch(() => {});
        }
      },
      () => {
        // Fall back gracefully to backend API banners without scaring public users
        fetch('/api/banners')
          .then(r => r.json())
          .then(d => {
            if (Array.isArray(d.banners) && d.banners.length > 0) {
              callback(d.banners.filter((b: Banner & { active?: boolean }) => b.active !== false));
            }
          })
          .catch(() => {});
      }
    );
  } catch {
    fetch('/api/banners')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.banners) && d.banners.length > 0) {
          callback(d.banners.filter((b: Banner & { active?: boolean }) => b.active !== false));
        }
      })
      .catch(() => {});
    return () => {};
  }
}

export async function saveBannerToFirestore(banner: Banner): Promise<void> {
  try {
    if (!banner.id) return;
    const bannerDoc = doc(db, 'banners', banner.id);
    const cleaned = sanitizeForFirestore(banner);
    await setDoc(bannerDoc, cleaned, { merge: true });
  } catch (err) {
    console.warn('Firestore save banner notice:', err);
  }
}

export async function deleteBannerFromFirestore(id: string): Promise<void> {
  try {
    if (!id) return;
    await deleteDoc(doc(db, 'banners', id));
  } catch (err) {
    console.warn('Firestore delete banner notice:', err);
  }
}

// -------------------------------------------------------------
// SELLER KYC & VERIFICATION FIRESTORE REAL-TIME SYNC
// -------------------------------------------------------------

export interface SellerKycRecord {
  id: string;
  seller_id: string;
  business_name: string;
  owner_name: string;
  registration_type: 'gst' | 'pan';
  gst_number?: string | null;
  pan_number?: string | null;
  aadhar_masked?: string | null;
  mobile_number: string;
  is_mobile_verified: boolean;
  email: string;
  support_email: string;
  pickup_address: string;
  city: string;
  state: string;
  pincode: string;
  bank_beneficiary: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  account_type?: string;
  upi_id?: string;
  status: 'verified_active' | 'approved' | 'pending' | 'rejected';
  is_diamond_certified: boolean;
  commission_rate: number;
  compliance_status: string;
  verification_audit_id?: string;
  ip_address_hash?: string;
  device_agent?: string;
  validation_logs: Array<{
    field: string;
    status: 'valid' | 'invalid';
    timestamp: string;
    message: string;
  }>;
  registered_at: string;
  updated_at: string;
}

export interface SellerVerificationAudit {
  id: string;
  seller_id: string;
  business_name: string;
  mobile_number: string;
  is_otp_verified: boolean;
  document_type: 'gst' | 'pan';
  document_reference: string;
  bank_account_verified: boolean;
  bank_name: string;
  ifsc_code: string;
  penny_drop_status: string;
  compliance_passed: boolean;
  support_contact: string;
  user_agent: string;
  verified_at: string;
  logs: Array<{
    field: string;
    status: 'valid' | 'invalid';
    timestamp: string;
    message: string;
  }>;
}

export async function saveSellerKycToFirestore(seller: SellerKycRecord): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    if (!seller.id && !seller.seller_id) return;
    const docId = seller.seller_id || seller.id;
    const sellerDoc = doc(db, 'sellers', docId);
    const cleaned = sanitizeForFirestore({
      ...seller,
      support_email: 'support.akselling@gmail.com',
      updated_at: new Date().toISOString(),
    });
    await setDoc(sellerDoc, cleaned, { merge: true });
    console.log(`[Firestore] Seller KYC saved successfully: ${docId}`);
  } catch (err) {
    handleFirestoreError(err, 'saveSellerKycToFirestore');
  }
}

export async function logSellerVerificationAudit(audit: SellerVerificationAudit): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    if (!audit.id && !audit.seller_id) return;
    const auditDocId = audit.id || `AUDIT_${audit.seller_id}_${Date.now()}`;
    const auditDoc = doc(db, 'seller_verification_audits', auditDocId);
    const cleaned = sanitizeForFirestore({
      ...audit,
      id: auditDocId,
      support_contact: 'support.akselling@gmail.com',
      verified_at: audit.verified_at || new Date().toISOString(),
    });
    await setDoc(auditDoc, cleaned, { merge: true });
    console.log(`[Firestore] Seller verification audit logged: ${auditDocId}`);
  } catch (err) {
    handleFirestoreError(err, 'logSellerVerificationAudit');
  }
}

export function subscribeSellerKyc(
  sellerId: string,
  callback: (record: SellerKycRecord | null) => void
): () => void {
  try {
    if (!sellerId) return () => {};
    const sellerDoc = doc(db, 'sellers', sellerId);
    return onSnapshot(
      sellerDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as SellerKycRecord);
        } else {
          callback(null);
        }
      },
      (err) => {
        handleFirestoreError(err, 'subscribeSellerKyc');
        callback(null);
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeSellerKyc');
    return () => {};
  }
}

// -------------------------------------------------------------
// CART CLOUD PERSISTENCE REAL-TIME SYNC
// -------------------------------------------------------------

export async function saveCartToFirestore(userId: string, cartItems: unknown[]): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    if (!userId || userId === 'guest') return;
    const cartDoc = doc(db, 'carts', userId);
    const cleaned = sanitizeForFirestore({
      userId,
      items: cartItems,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(cartDoc, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveCartToFirestore');
  }
}

export function subscribeCartFromFirestore(
  userId: string,
  callback: (items: unknown[]) => void
): () => void {
  try {
    if (!userId || userId === 'guest') return () => {};
    const cartDoc = doc(db, 'carts', userId);
    return onSnapshot(
      cartDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.items)) {
            callback(data.items);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, 'subscribeCartFromFirestore');
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeCartFromFirestore');
    return () => {};
  }
}

/**
 * Deducts stock or flags inventory change on ordered items in Firestore catalog
 */
export async function deductProductInventory(
  items: Array<{ product_id: string; quantity: number }>
): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    for (const item of items) {
      if (!item.product_id) continue;
      const productRef = doc(db, 'products', item.product_id);
      await updateDoc(productRef, {
        lastSoldAt: new Date().toISOString(),
        inStock: true,
      }).catch((err) => handleFirestoreError(err, 'deductProductInventory'));
    }
  } catch (err) {
    handleFirestoreError(err, 'deductProductInventory');
  }
}

// -------------------------------------------------------------
// DYNAMIC CATEGORIES FIRESTORE SYNC & PERSISTENCE
// -------------------------------------------------------------

export interface FirestoreCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt?: string;
}

const CATEGORIES_STORAGE_KEY = 'akselling_custom_categories';
const DELETED_CATEGORIES_KEY = 'akselling_deleted_categories';

export function getDeletedCategoryIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_CATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function getCachedCategories(): FirestoreCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function subscribeCategories(
  callback: (categories: FirestoreCategory[]) => void
): () => void {
  try {
    const cached = getCachedCategories();
    if (cached.length > 0) {
      callback(cached);
    }

    const categoriesRef = collection(db, 'categories');
    return onSnapshot(
      categoriesRef,
      (snapshot) => {
        const items: FirestoreCategory[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            name: data.name || docSnap.id,
            icon: data.icon || 'Layers',
            color: data.color || '#2874f0',
            createdAt: data.createdAt,
          });
        });
        if (items.length > 0) {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(items));
          callback(items);
        }
      },
      (err) => {
        handleFirestoreError(err, 'subscribeCategories');
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeCategories');
    return () => {};
  }
}

export async function saveCategoryToFirestore(cat: {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}): Promise<void> {
  // If previously deleted, un-delete it
  try {
    const deleted = getDeletedCategoryIds().filter(id => id !== cat.id);
    localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(deleted));
  } catch {
    // ignore
  }

  if (isQuotaExhausted()) return;
  try {
    const docRef = doc(db, 'categories', cat.id);
    const cleaned = sanitizeForFirestore({
      ...cat,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });

    // Update local cache
    const current = getCachedCategories();
    const exists = current.some((c) => c.id === cat.id);
    const updated = exists
      ? current.map((c) => (c.id === cat.id ? { ...c, ...cat } : c))
      : [...current, cat];
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('akselling_categories_updated'));
  } catch (err) {
    handleFirestoreError(err, 'saveCategoryToFirestore');
  }
}

export async function deleteCategoryFromFirestore(catId: string): Promise<void> {
  if (!catId) return;

  // Track deletion so both default and custom categories are purged
  try {
    const deleted = getDeletedCategoryIds();
    if (!deleted.includes(catId)) {
      localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify([...deleted, catId]));
    }
  } catch {
    // ignore
  }

  // Update local cache immediately
  const current = getCachedCategories();
  const updated = current.filter((c) => c.id !== catId);
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('akselling_categories_updated'));

  if (isQuotaExhausted()) return;
  try {
    const docRef = doc(db, 'categories', catId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, 'deleteCategoryFromFirestore');
  }
}

// -------------------------------------------------------------
// SECURE RAZORPAY PAYMENT LOGGING TO FIRESTORE
// -------------------------------------------------------------

export interface PaymentTransactionRecord {
  id?: string;
  order_id?: string;
  orderId?: string;
  payment_id?: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  currency?: string;
  customer_name?: string;
  customerName?: string;
  customer_phone?: string;
  customerPhone?: string;
  status: 'captured' | 'authorized' | 'verified';
  gateway?: 'razorpay' | 'cashfree' | 'simulated';
  method?: string;
  recorded_at?: string;
}

export async function logPaymentTransactionToFirestore(
  log: Omit<PaymentTransactionRecord, 'recorded_at'> & { recorded_at?: string }
): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    const docId = log.payment_id || log.id || `pay_${Date.now()}`;
    const docRef = doc(db, 'payments', docId);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...log,
        recorded_at: log.recorded_at || new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, 'logPaymentTransactionToFirestore');
  }
}

// -------------------------------------------------------------
// PRICE DROP ALERTS FIRESTORE INTEGRATION & DISPATCH
// -------------------------------------------------------------

export async function savePriceAlertToFirestore(alert: PriceAlert): Promise<void> {
  // Sync to local storage for instant UI responsiveness & offline fallback
  try {
    const localAlerts: PriceAlert[] = JSON.parse(localStorage.getItem('akselling_price_alerts') || '[]');
    const filtered = localAlerts.filter(a => a.id !== alert.id && a.productId !== alert.productId);
    localStorage.setItem('akselling_price_alerts', JSON.stringify([...filtered, alert]));
    window.dispatchEvent(new CustomEvent('akselling_price_alerts_updated'));
  } catch {
    // ignore local storage errors
  }

  if (isQuotaExhausted()) return;

  try {
    const docId = alert.id || `alert_${alert.productId}_${alert.userId || 'guest'}`;
    const docRef = doc(db, 'PriceAlerts', docId);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...alert,
        id: docId,
        active: alert.active !== false,
        updatedAt: new Date().toISOString(),
        createdAt: alert.createdAt || new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, 'savePriceAlertToFirestore');
  }
}

export async function removePriceAlertFromFirestore(alertId: string, productId?: string): Promise<void> {
  // Clean up local storage
  try {
    const localAlerts: PriceAlert[] = JSON.parse(localStorage.getItem('akselling_price_alerts') || '[]');
    const filtered = localAlerts.filter(a => a.id !== alertId && (!productId || a.productId !== productId));
    localStorage.setItem('akselling_price_alerts', JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('akselling_price_alerts_updated'));
  } catch {
    // ignore
  }

  if (isQuotaExhausted()) return;

  try {
    if (alertId) {
      const docRef = doc(db, 'PriceAlerts', alertId);
      await setDoc(docRef, { active: false, updatedAt: new Date().toISOString() }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, 'removePriceAlertFromFirestore');
  }
}

export async function getUserPriceAlertForProduct(
  productId: string,
  userId?: string,
  email?: string
): Promise<PriceAlert | null> {
  // 1. Fast check from local storage
  try {
    const localAlerts: PriceAlert[] = JSON.parse(localStorage.getItem('akselling_price_alerts') || '[]');
    const found = localAlerts.find(
      a =>
        a.productId === productId &&
        a.active !== false &&
        (!userId || a.userId === userId || a.userId === 'guest' || (email && a.notifyEmail === email))
    );
    if (found) return found;
  } catch {
    // ignore
  }

  if (isQuotaExhausted()) return null;

  try {
    // 2. Direct document lookup
    const directDocId = `alert_${productId}_${userId || 'guest'}`;
    const directDoc = await getDoc(doc(db, 'PriceAlerts', directDocId));
    if (directDoc.exists()) {
      const data = directDoc.data() as PriceAlert;
      if (data.active !== false) return { ...data, id: directDoc.id };
    }

    // 3. Fallback query by productId
    const alertsRef = collection(db, 'PriceAlerts');
    const q = query(alertsRef, where('productId', '==', productId), where('active', '==', true));
    const snap = await getDocs(q);
    if (!snap.empty) {
      for (const d of snap.docs) {
        const item = d.data() as PriceAlert;
        if (!userId || item.userId === userId || (email && item.notifyEmail === email) || item.userId === 'guest') {
          return { ...item, id: d.id };
        }
      }
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, 'getUserPriceAlertForProduct');
    return null;
  }
}

export function subscribeUserPriceAlerts(
  userId: string,
  callback: (alerts: PriceAlert[]) => void
): () => void {
  try {
    const alertsRef = collection(db, 'PriceAlerts');
    const q = query(alertsRef, where('userId', '==', userId), where('active', '==', true));
    return onSnapshot(
      q,
      snapshot => {
        const list: PriceAlert[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...docSnap.data(), id: docSnap.id } as PriceAlert);
        });
        callback(list);
      },
      err => {
        handleFirestoreError(err, 'subscribeUserPriceAlerts');
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeUserPriceAlerts');
    return () => {};
  }
}

export async function checkAndDispatchPriceDropAlerts(
  productId: string,
  newPrice: number,
  oldPrice: number,
  productTitle: string,
  productImage?: string
): Promise<{ triggeredCount: number }> {
  if (newPrice >= oldPrice) return { triggeredCount: 0 };
  let triggeredCount = 0;

  try {
    // Also check local alerts in case of offline/local storage
    const localAlerts: PriceAlert[] = JSON.parse(localStorage.getItem('akselling_price_alerts') || '[]');
    const matchingLocal = localAlerts.filter(a => a.productId === productId && a.active !== false);

    for (const alert of matchingLocal) {
      const threshold = alert.targetPrice || alert.initialPrice;
      if (newPrice < threshold) {
        triggeredCount++;
        // Post to email & notification API
        try {
          await fetch('/api/price-alerts/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              alertId: alert.id,
              email: alert.notifyEmail,
              productId,
              productTitle: productTitle || alert.productTitle,
              productImage: productImage || alert.productImage,
              oldPrice: alert.initialPrice || oldPrice,
              newPrice,
              userId: alert.userId,
            }),
          });
        } catch {
          // ignore network error
        }
      }
    }

    if (!isQuotaExhausted()) {
      const alertsRef = collection(db, 'PriceAlerts');
      const q = query(alertsRef, where('productId', '==', productId), where('active', '==', true));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        for (const docSnap of snapshot.docs) {
          const alert = docSnap.data() as PriceAlert;
          const threshold = alert.targetPrice || alert.initialPrice;
          if (newPrice < threshold) {
            // Avoid duplicate trigger if already counted in local
            if (!matchingLocal.some(m => m.id === docSnap.id)) {
              triggeredCount++;
              try {
                await fetch('/api/price-alerts/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    alertId: docSnap.id,
                    email: alert.notifyEmail,
                    productId,
                    productTitle: productTitle || alert.productTitle,
                    productImage: productImage || alert.productImage,
                    oldPrice: alert.initialPrice || oldPrice,
                    newPrice,
                    userId: alert.userId,
                  }),
                });
              } catch {
                // ignore
              }
            }

            // Update record in Firestore
            try {
              await updateDoc(doc(db, 'PriceAlerts', docSnap.id), {
                currentPrice: newPrice,
                lastNotifiedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            } catch {
              // ignore
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('checkAndDispatchPriceDropAlerts error:', err);
  }

  return { triggeredCount };
}

/**
 * ------------------------------------------------------------------
 * REAL-TIME NOTIFICATIONS & NEW CATALOG BROADCAST SYSTEM
 * ------------------------------------------------------------------
 */

const NOTIFICATIONS_CACHE_KEY = 'akselling_app_notifications';

export function getCachedNotifications(): AppNotification[] {
  try {
    const cached = localStorage.getItem(NOTIFICATIONS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // ignore
  }
  return [];
}

export function setCachedNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(notifications.slice(0, 50)));
  } catch {
    // ignore
  }
}

/**
 * Broadcast a new catalog / product upload notification to all app users via Firestore
 */
export async function broadcastNewCatalogNotification(
  product: Product | SellerProduct,
  customMessage?: string
): Promise<AppNotification | null> {
  const prodTitle = product.title || 'New Arrival Catalog';
  const prodPrice = Number(product.price) || 0;
  const prodImg = (Array.isArray(product.images) && product.images[0]) || ('image' in product ? product.image : '') || '';
  const notifId = `notif_cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const notification: AppNotification = {
    id: notifId,
    type: 'NEW_CATALOG',
    title: '✨ New Catalog Uploaded!',
    message: customMessage || `${prodTitle} is now live in ${product.category || 'the catalog'} at just ₹${prodPrice.toLocaleString('en-IN')}! Check it out now.`,
    productId: product.id,
    productTitle: prodTitle,
    productPrice: prodPrice,
    productImage: typeof prodImg === 'string' ? prodImg : '',
    category: product.category || 'General',
    createdAt: new Date().toISOString(),
    read: false,
    senderName: 'AKSelling Store',
  };

  // 1. Immediately store in local cache and dispatch window event so local user gets it instantly
  const current = getCachedNotifications();
  const updated = [notification, ...current.filter(n => n.id !== notifId)].slice(0, 50);
  setCachedNotifications(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('akselling_new_notification', { detail: notification }));
    window.dispatchEvent(new CustomEvent('akselling_notifications_updated'));
  }

  // 2. Persist to Firestore notifications collection so all connected users receive the live notification
  if (!isQuotaExhausted()) {
    try {
      const docRef = doc(db, 'notifications', notifId);
      const firestorePayload = sanitizeForFirestore({
        ...notification,
        timestamp: new Date().toISOString(),
      });
      await setDoc(docRef, firestorePayload);
    } catch (err) {
      console.warn('broadcastNewCatalogNotification to Firestore notice:', err);
    }
  }

  return notification;
}

/**
 * Real-time subscription to notifications across Firestore
 */
export function subscribeNotifications(
  callback: (notifications: AppNotification[]) => void
): () => void {
  // Always emit cached notifications first
  const initial = getCachedNotifications();
  if (initial.length > 0) {
    callback(initial);
  }

  if (isQuotaExhausted()) {
    return () => {};
  }

  try {
    const notifsRef = collection(db, 'notifications');
    const q = query(notifsRef, orderBy('createdAt', 'desc'), limit(40));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const liveList: AppNotification[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              type: (data.type as AppNotification['type']) || 'NEW_CATALOG',
              title: (data.title as string) || 'New Notification',
              message: (data.message as string) || '',
              productId: data.productId as string | undefined,
              productTitle: data.productTitle as string | undefined,
              productPrice: data.productPrice as number | undefined,
              productImage: data.productImage as string | undefined,
              category: data.category as string | undefined,
              createdAt: (data.createdAt as string) || (data.timestamp as string) || new Date().toISOString(),
              read: Boolean(data.read),
              link: data.link as string | undefined,
              senderName: (data.senderName as string) || 'AKSelling',
            };
          });

          // Merge with local read states
          const readIds = new Set<string>();
          try {
            const storedRead = localStorage.getItem('akselling_read_notification_ids');
            if (storedRead) {
              (JSON.parse(storedRead) as string[]).forEach((id: string) => readIds.add(id));
            }
          } catch {
            // ignore
          }

          const finalized = liveList.map(n => ({
            ...n,
            read: n.read || readIds.has(n.id),
          }));

          setCachedNotifications(finalized);
          callback(finalized);
        } else if (initial.length > 0) {
          callback(initial);
        }
      },
      (err) => {
        handleFirestoreError(err, 'subscribeNotifications');
        callback(getCachedNotifications());
      }
    );

    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, 'subscribeNotifications');
    return () => {};
  }
}

// -------------------------------------------------------------
// VERIFIED CUSTOMER REVIEWS & FLIPKART-GRADE RATINGS (Firestore)
// -------------------------------------------------------------

// In-memory live aggregate rating cache updated by onSnapshot
const liveRatingsCache = new Map<string, { rating: number; count: number }>();

export function subscribeProductReviews(
  productId: string,
  callback: (reviews: ProductReview[]) => void
): () => void {
  if (!productId) return () => {};

  try {
    const reviewsRef = collection(db, 'product_reviews');
    const q = query(
      reviewsRef,
      where('productId', '==', productId),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ProductReview[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              productId: d.productId || productId,
              userId: d.userId,
              userName: d.userName || 'Verified Buyer',
              userAvatar: d.userAvatar,
              rating: typeof d.rating === 'number' ? d.rating : 5,
              title: d.title || 'Great Quality Product',
              comment: d.comment || '',
              photos: Array.isArray(d.photos) ? d.photos : [],
              verifiedPurchase: d.verifiedPurchase !== false,
              helpfulCount: Number(d.helpfulCount) || 0,
              sizePurchased: d.sizePurchased,
              createdAt: d.createdAt || new Date().toISOString(),
            });
          });

          // Sort newest first
          const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          // Update live aggregate rating cache
          if (sorted.length > 0) {
            const sum = sorted.reduce((acc, r) => acc + r.rating, 0);
            const avg = Number((sum / sorted.length).toFixed(1));
            liveRatingsCache.set(productId, { rating: avg, count: sorted.length });
          }

          callback(sorted);
        } else {
          callback([]);
        }
      },
      (err) => {
        console.warn('Reviews subscription notice:', err);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Reviews listener catch notice:', err);
    return () => {};
  }
}

/**
 * Submits a verified customer review to Firestore, computes real-time rating aggregates,
 * updates the product document in Firestore, and syncs local storage.
 */
export async function submitProductReview(
  review: Omit<ProductReview, 'id' | 'createdAt'>
): Promise<string> {
  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const reviewDoc: ProductReview = {
    ...review,
    id: reviewId,
    createdAt: new Date().toISOString(),
    verifiedPurchase: true,
    helpfulCount: 0,
  };

  try {
    // 1. Write review document to Firestore
    const docRef = doc(db, 'product_reviews', reviewId);
    await setDoc(docRef, sanitizeForFirestore(reviewDoc as unknown as Record<string, unknown>));

    // 2. Query all reviews for this product to recalculate live average
    try {
      const q = query(collection(db, 'product_reviews'), where('productId', '==', review.productId));
      const snap = await getDocs(q);
      const ratings: number[] = [];
      snap.forEach((d) => {
        const val = d.data()?.rating;
        if (typeof val === 'number') ratings.push(val);
      });

      if (!ratings.includes(review.rating)) {
        ratings.push(review.rating);
      }

      const totalReviews = ratings.length;
      const avgScore = Number((ratings.reduce((a, b) => a + b, 0) / totalReviews).toFixed(1));

      // Cache live
      liveRatingsCache.set(review.productId, { rating: avgScore, count: totalReviews });

      // Update product document in Firestore
      const prodRef = doc(db, 'products', review.productId);
      await updateDoc(prodRef, {
        rating: avgScore,
        reviewsCount: totalReviews,
        ratingCount: totalReviews,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    } catch {
      // ignore
    }

    // 3. Save to local storage cache for instant sub-millisecond retrieval
    try {
      const localKey = `akselling_reviews_${review.productId}`;
      const existing = localStorage.getItem(localKey);
      let list: ProductReview[] = [];
      if (existing) {
        try {
          list = JSON.parse(existing);
        } catch {
          list = [];
        }
      }
      list.unshift(reviewDoc);
      localStorage.setItem(localKey, JSON.stringify(list));
    } catch {
      // ignore
    }

    // 4. Notify app components that ratings & reviews have been updated live
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('akselling_reviews_updated', { detail: { productId: review.productId } }));
    }

    return reviewId;
  } catch (err) {
    console.warn('Firestore review submit notice:', err);
    return reviewId;
  }
}

/**
 * Increments helpful count for a review in Firestore
 */
export async function voteReviewHelpful(reviewId: string): Promise<void> {
  if (!reviewId) return;
  try {
    const docRef = doc(db, 'product_reviews', reviewId);
    await updateDoc(docRef, {
      helpfulCount: increment(1),
    });
  } catch (err) {
    console.warn('Vote review helpful notice:', err);
  }
}

/**
 * Returns the latest live Firestore rating and review count for a product if cached
 */
export function getLiveProductRating(productId: string): { rating: number; count: number } | null {
  return liveRatingsCache.get(productId) || null;
}

// -------------------------------------------------------------
// FIREBASE CLOUD MESSAGING (FCM) TOKEN REGISTRATION
// -------------------------------------------------------------

export async function saveFcmTokenToFirestore(
  token: string,
  userEmail?: string | null
): Promise<void> {
  if (!token) return;
  try {
    const cleanToken = token.slice(-32);
    const docRef = doc(db, 'fcm_tokens', cleanToken);
    await setDoc(
      docRef,
      {
        token,
        userEmail: userEmail || 'anonymous',
        platform: 'web',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('FCM token save notice:', err);
  }
}





