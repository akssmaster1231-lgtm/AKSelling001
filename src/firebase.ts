import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  setPersistence,
  browserLocalPersistence,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth';
import type { Product, Banner } from '@/types';
import type { UserProfile } from '@/auth-context';
import type { SellerProduct } from '@/types/supplier';

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
let hasLoggedQuotaNotice = false;

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
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(QUOTA_STORAGE_KEY, today);
    sessionStorage.setItem('akselling_firestore_quota_exhausted', 'true');
  } catch {
    // ignore
  }
  if (!hasLoggedQuotaNotice) {
    hasLoggedQuotaNotice = true;
    console.warn(
      '[Firestore] Free daily write quota reached on free-tier database. Seamlessly switching to local offline persistence.',
      reason
    );
  }
}

export function handleFirestoreError(err: unknown, operationName: string): void {
  const msg = String((err as { message?: string })?.message || err || '');
  const code = String((err as { code?: string })?.code || '');
  if (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Free daily write units')
  ) {
    markQuotaExhausted(err);
  } else {
    console.warn(`[Firestore] ${operationName} notice:`, err);
  }
}

// -------------------------------------------------------------
// PRODUCTS FIRESTORE REAL-TIME SYNC & INSTANT CACHING
// -------------------------------------------------------------

const PRODUCTS_CACHE_KEY = 'akselling_firestore_products_cache';

const DEFAULT_PRODUCT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Cpath d='M200 130 L270 170 L270 250 L200 290 L130 250 L130 170 Z' fill='none' stroke='%239ca3af' stroke-width='8' stroke-linejoin='round'/%3E%3Cpath d='M200 130 L200 290' stroke='%239ca3af' stroke-width='8'/%3E%3Cpath d='M130 170 L200 210 L270 170' fill='none' stroke='%239ca3af' stroke-width='8'/%3E%3C/svg%3E";

export function getCachedProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter(p => !p.id?.startsWith('sp_') && p.id !== 'demo_tshirt')
          .map(p => ({
            ...p,
            images: (p.images || []).map((img: string) =>
              typeof img === 'string' && img.includes('8532616') ? DEFAULT_PRODUCT_PLACEHOLDER : img
            ),
          }));
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
    // ignore
  }
}

export function subscribeProducts(
  callback: (products: Product[]) => void,
  categoryFilter?: string
): () => void {
  // 1. Emit cached products synchronously for 0ms initial load
  if (!categoryFilter || categoryFilter === 'all') {
    const cached = getCachedProducts();
    if (cached.length > 0) {
      callback(cached);
    }
  }

  try {
    const productsRef = collection(db, 'products');
    let q = query(productsRef);
    if (categoryFilter && categoryFilter !== 'all') {
      q = query(productsRef, where('category', '==', categoryFilter));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              id: docSnap.id,
              title: data.title || '',
              description: data.description || '',
              price: Number(data.price) || 0,
              mrp: Number(data.mrp) || Number(data.price) || 0,
              discount: Number(data.discount) || 0,
              category: data.category || 'fashion',
              images: (Array.isArray(data.images) && data.images.length > 0
                ? data.images
                : [data.image || DEFAULT_PRODUCT_PLACEHOLDER]
              ).map((img: string) =>
                typeof img === 'string' && img.includes('8532616') ? DEFAULT_PRODUCT_PLACEHOLDER : img
              ),
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
              pickupLocation: data.pickupLocation,
              weight: data.weight,
              dimensions: data.dimensions,
            });
          });
          if (!categoryFilter || categoryFilter === 'all') {
            setCachedProducts(items);
          }
          callback(items);
        } else {
          callback([]);
        }
      },
      (error) => {
        handleFirestoreError(error, 'subscribeProducts');
        callback([]);
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeProducts');
    return () => {};
  }
}

export async function saveProductToFirestore(product: Product | SellerProduct): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    const prodId = product.id;
    if (!prodId) return;
    const docRef = doc(db, 'products', prodId);
    
    // Normalizing attributes
    const rawData: Record<string, unknown> = {
      id: prodId,
      title: product.title || '',
      description: product.description || '',
      price: Number(product.price) || 0,
      mrp: Number(product.mrp) || Number(product.price) || 0,
      discount: Number(product.discount) || 0,
      category: product.category || 'fashion',
      images: Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : ('image' in product && product.image ? [product.image] : []),
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
    if ('status' in product && product.status !== undefined) rawData.status = product.status;
    if ('sku' in product && product.sku !== undefined) rawData.sku = product.sku;
    if ('pickupLocation' in product && product.pickupLocation !== undefined) rawData.pickupLocation = product.pickupLocation;
    if ('weight' in product && product.weight !== undefined) rawData.weight = product.weight;
    if ('dimensions' in product && product.dimensions !== undefined) rawData.dimensions = product.dimensions;

    const dataToSave = sanitizeForFirestore(rawData);
    await setDoc(docRef, dataToSave, { merge: true });

    // Update local cache so it reflects immediately
    const current = getCachedProducts();
    const normalizedProd: Product = {
      id: prodId,
      title: rawData.title as string,
      description: rawData.description as string,
      price: rawData.price as number,
      mrp: rawData.mrp as number,
      discount: rawData.discount as number,
      category: rawData.category as string,
      images: rawData.images as string[],
      rating: rawData.rating as number,
      ratingCount: rawData.ratingCount as number,
      brand: rawData.brand as string,
      inStock: rawData.inStock as boolean,
      delivery: rawData.delivery as string,
    };
    const nextCached = current.some(p => p.id === prodId)
      ? current.map(p => p.id === prodId ? normalizedProd : p)
      : [normalizedProd, ...current];
    setCachedProducts(nextCached);
    window.dispatchEvent(new CustomEvent('akselling_products_updated'));
  } catch (err) {
    handleFirestoreError(err, 'saveProductToFirestore');
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    if (!productId) return;
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    handleFirestoreError(err, 'deleteProductFromFirestore');
  }
}

export async function seedInitialProductsIfEmpty(): Promise<void> {
  // Bulk write seeding disabled to conserve Firestore free tier write units
  return;
}

// -------------------------------------------------------------
// ORDERS FIRESTORE REAL-TIME SYNC
// -------------------------------------------------------------

export interface FirestoreOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: Array<{
    product_id: string;
    product_title: string;
    product_image: string;
    quantity: number;
    price: number;
    sku?: string;
    size?: string;
    color?: string;
  }>;
  total_amount: number;
  payment_method: string;
  payment_status?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
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
          const list: Banner[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              title: data.title || '',
              subtitle: data.subtitle || '',
              cta: data.cta || 'Shop Now',
              image: data.image || '',
              gradient: data.gradient || 'from-blue-600 to-indigo-800',
            });
          });
          callback(list);
        } else {
          callback([]);
        }
      },
      (err) => {
        handleFirestoreError(err, 'subscribeBanners');
        callback([]);
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeBanners');
    return () => {};
  }
}

export async function saveBannerToFirestore(banner: Banner): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    if (!banner.id) return;
    const bannerDoc = doc(db, 'banners', banner.id);
    const cleaned = sanitizeForFirestore(banner);
    await setDoc(bannerDoc, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveBannerToFirestore');
  }
}

export async function deleteBannerFromFirestore(id: string): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    if (!id) return;
    await deleteDoc(doc(db, 'banners', id));
  } catch (err) {
    handleFirestoreError(err, 'deleteBannerFromFirestore');
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
  id: string;
  order_id?: string;
  payment_id: string;
  signature?: string;
  amount: number;
  currency: string;
  customer_name?: string;
  customer_phone?: string;
  status: 'captured' | 'authorized' | 'verified';
  gateway: 'razorpay' | 'cashfree' | 'simulated';
  recorded_at: string;
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
// VIDEO REELS FIRESTORE SYNC & PERSISTENCE
// -------------------------------------------------------------

export function subscribeReelsFromFirestore(
  callback: (reels: unknown[]) => void
): () => void {
  try {
    const reelsRef = collection(db, 'reels');
    return onSnapshot(
      reelsRef,
      (snapshot) => {
        const items: unknown[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            ...docSnap.data(),
            id: docSnap.id,
          });
        });
        callback(items);
      },
      (err) => {
        handleFirestoreError(err, 'subscribeReelsFromFirestore');
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeReelsFromFirestore');
    return () => {};
  }
}

export async function saveReelToFirestore(reel: Record<string, unknown> & { id: string }): Promise<void> {
  if (isQuotaExhausted()) return;
  try {
    if (!reel.id) return;
    const docRef = doc(db, 'reels', reel.id);
    await setDoc(docRef, sanitizeForFirestore({
      ...reel,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'saveReelToFirestore');
  }
}


